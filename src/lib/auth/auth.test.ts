/**
 * src/lib/auth/auth.test.ts
 *
 * Comprehensive test suite for Phase 3 Authentication, Invite Codes,
 * Sessions, Rate Limiting, and Magic Links.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { hashPassword, verifyPassword } from "./password";
import {
  signSession,
  verifySession,
  getSessionFromCookieHeader,
  SESSION_COOKIE_NAME,
} from "./session";
import {
  generateInviteCode,
  normalizeInviteCode,
  validateInviteCode,
  getInviteStatus,
} from "./invite";
import { rateLimit, resetRateLimits } from "./rate-limit";
import { authStore } from "@/lib/db/auth-store";
import type { SessionUser, InviteCode } from "./types";

// Import Route Handlers for endpoint testing
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as magicRequestHandler } from "@/app/api/auth/magic-link/request/route";
import { POST as magicVerifyHandler } from "@/app/api/auth/magic-link/verify/route";
import { GET as meHandler } from "@/app/api/users/me/route";
import { POST as inviteVerifyHandler } from "@/app/api/invites/verify/route";
import { GET as listInvitesHandler, POST as createInviteHandler } from "@/app/api/invites/route";
import { DELETE as revokeInviteHandler } from "@/app/api/invites/[id]/route";

describe("Phase 3 — Password Security", () => {
  it("hashes password with a salt and produces distinct hashes for the same password", async () => {
    const pass = "SuperSecretPassword123!";
    const hash1 = await hashPassword(pass);
    const hash2 = await hashPassword(pass);

    expect(hash1).not.toBe(hash2);
    expect(hash1.split(":")).toHaveLength(2);
  });

  it("verifies matching password correctly", async () => {
    const pass = "ValidPassword123!";
    const hash = await hashPassword(pass);
    const isValid = await verifyPassword(pass, hash);
    expect(isValid).toBe(true);
  });

  it("rejects non-matching password", async () => {
    const hash = await hashPassword("RealPassword123!");
    const isValid = await verifyPassword("WrongPassword123!", hash);
    expect(isValid).toBe(false);
  });

  it("rejects empty or null hash securely", async () => {
    expect(await verifyPassword("Pass", null)).toBe(false);
    expect(await verifyPassword("", "somehash")).toBe(false);
  });

  it("enforces minimum password length", async () => {
    await expect(hashPassword("short")).rejects.toThrow("at least 8 characters");
  });
});

describe("Phase 3 — Session Management & Expiration", () => {
  const mockUser: SessionUser = {
    id: "usr_test_123",
    email: "test@prax.build",
    name: "Test Builder",
    role: "MEMBER",
    status: "APPROVED",
  };

  it("signs and verifies a valid session payload", () => {
    const token = signSession(mockUser, 60000); // 1 minute
    const payload = verifySession(token);

    expect(payload).not.toBeNull();
    expect(payload?.user.id).toBe(mockUser.id);
    expect(payload?.user.email).toBe(mockUser.email);
    expect(payload?.user.role).toBe("MEMBER");
  });

  it("rejects tampered session token", () => {
    const token = signSession(mockUser);
    const parts = token.split(".");
    const tampered = `${parts[0]}tampered.${parts[1]}`;

    expect(verifySession(tampered)).toBeNull();
  });

  it("rejects expired session token", () => {
    // Session that expired 10 seconds ago
    const expiredToken = signSession(mockUser, -10000);
    expect(verifySession(expiredToken)).toBeNull();
  });

  it("reads and parses session from cookie header", () => {
    const token = signSession(mockUser);
    const cookieHeader = `other_cookie=xyz; ${SESSION_COOKIE_NAME}=${token}; test=123`;
    const payload = getSessionFromCookieHeader(cookieHeader);

    expect(payload).not.toBeNull();
    expect(payload?.user.email).toBe(mockUser.email);
  });

  it("returns null for missing or invalid cookie header", () => {
    expect(getSessionFromCookieHeader("")).toBeNull();
    expect(getSessionFromCookieHeader("random_cookie=value")).toBeNull();
  });
});

describe("Phase 3 — Invite Code Lifecycle & Policy", () => {
  beforeEach(async () => {
    await authStore.resetForTesting();
    resetRateLimits();
  });

  it("generates invite codes matching PRAX-XXXX-XXXX format", () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^PRAX-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("normalizes invite code by trimming and uppercasing", () => {
    expect(normalizeInviteCode("  prax-alpha-2026  ")).toBe("PRAX-ALPHA-2026");
  });

  it("validates active invite codes and computes remaining uses", () => {
    const invite: InviteCode = {
      id: "inv_1",
      code: "PRAX-TEST-CODE",
      maxUses: 5,
      usedCount: 2,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdById: "usr_admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = validateInviteCode(invite);
    expect(result.valid).toBe(true);
    expect(result.remainingUses).toBe(3);
    expect(getInviteStatus(invite)).toBe("ACTIVE");
  });

  it("marks expired code as INVALID_INVITE", () => {
    const expiredInvite: InviteCode = {
      id: "inv_exp",
      code: "PRAX-EXPIRED",
      maxUses: 5,
      usedCount: 0,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() - 10000).toISOString(),
      createdById: "usr_admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = validateInviteCode(expiredInvite);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("INVALID_INVITE");
    expect(getInviteStatus(expiredInvite)).toBe("EXPIRED");
  });

  it("marks exhausted code as INVITE_EXHAUSTED", () => {
    const usedInvite: InviteCode = {
      id: "inv_used",
      code: "PRAX-EXHAUSTED",
      maxUses: 1,
      usedCount: 1,
      status: "USED",
      expiresAt: null,
      createdById: "usr_admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = validateInviteCode(usedInvite);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("INVITE_EXHAUSTED");
  });

  it("marks revoked code as INVALID_INVITE", () => {
    const revokedInvite: InviteCode = {
      id: "inv_rev",
      code: "PRAX-REVOKED",
      maxUses: 10,
      usedCount: 0,
      status: "REVOKED",
      expiresAt: null,
      createdById: "usr_admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = validateInviteCode(revokedInvite);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("INVALID_INVITE");
  });

  it("consumes single-use invite code atomically and blocks reuse", async () => {
    const firstConsume = await authStore.consumeInvite("PRAX-SINGLE-USE");
    expect(firstConsume.success).toBe(true);
    expect(firstConsume.invite?.usedCount).toBe(1);
    expect(firstConsume.invite?.status).toBe("USED");

    // Attempt second consume (replay)
    const secondConsume = await authStore.consumeInvite("PRAX-SINGLE-USE");
    expect(secondConsume.success).toBe(false);
    expect(secondConsume.errorCode).toBe("INVITE_EXHAUSTED");
  });
});

describe("Phase 3 — Rate Limiting", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("permits requests within configured threshold", () => {
    const key = "test-endpoint:127.0.0.1";
    for (let i = 0; i < 3; i++) {
      const res = rateLimit(key, 3, 60000);
      expect(res.success).toBe(true);
    }
  });

  it("blocks requests exceeding threshold and returns remaining=0", () => {
    const key = "test-endpoint:127.0.0.1";
    rateLimit(key, 2, 60000);
    rateLimit(key, 2, 60000);

    const blocked = rateLimit(key, 2, 60000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetAt).toBeGreaterThan(Date.now());
  });

  it("tracks different keys independently", () => {
    rateLimit("ip:1", 1, 60000);
    const blockedIp1 = rateLimit("ip:1", 1, 60000);
    const allowedIp2 = rateLimit("ip:2", 1, 60000);

    expect(blockedIp1.success).toBe(false);
    expect(allowedIp2.success).toBe(true);
  });
});

describe("Phase 3 — Magic Links Flow", () => {
  beforeEach(async () => {
    await authStore.resetForTesting();
  });

  it("creates, verifies, and single-use consumes a magic link token", async () => {
    const email = "member@prax.build";
    const { rawToken } = await authStore.createMagicLinkToken(email);

    // First consumption succeeds
    const firstVerify = await authStore.verifyAndConsumeMagicLink(rawToken);
    expect(firstVerify.valid).toBe(true);
    expect(firstVerify.email).toBe(email);

    // Second consumption (reuse / replay) fails
    const secondVerify = await authStore.verifyAndConsumeMagicLink(rawToken);
    expect(secondVerify.valid).toBe(false);
  });

  it("rejects expired magic links", async () => {
    const email = "member@prax.build";
    const { rawToken } = await authStore.createMagicLinkToken(email, -1000); // Expired

    const verify = await authStore.verifyAndConsumeMagicLink(rawToken);
    expect(verify.valid).toBe(false);
  });

  it("rejects non-existent or invalid tokens", async () => {
    const verify = await authStore.verifyAndConsumeMagicLink("non-existent-token-12345");
    expect(verify.valid).toBe(false);
  });
});

describe("Phase 3 — API Endpoints Integration", () => {
  beforeEach(async () => {
    await authStore.resetForTesting();
    resetRateLimits();
  });

  it("POST /api/auth/register registers user in PENDING_APPROVAL and consumes invite", async () => {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "newbuilder@prax.build",
        password: "SecurePassword123!",
        name: "New Builder",
        inviteCode: "PRAX-ALPHA-2026",
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.user.email).toBe("newbuilder@prax.build");
    expect(data.user.status).toBe("PENDING_APPROVAL");
    expect(data.user.role).toBe("MEMBER");

    // Verify invite usedCount incremented
    const invite = await authStore.findInviteByCode("PRAX-ALPHA-2026");
    expect(invite?.usedCount).toBe(1);
  });

  it("POST /api/auth/register rejects invalid or exhausted invite code", async () => {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "fail@prax.build",
        password: "SecurePassword123!",
        name: "Fail User",
        inviteCode: "PRAX-EXPIRED-CODE",
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe("INVALID_INVITE");
  });

  it("POST /api/auth/login logs in valid user and returns session cookie", async () => {
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "member@prax.build",
        password: "MemberPass123!",
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user.email).toBe("member@prax.build");

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain(SESSION_COOKIE_NAME);
    expect(setCookie).toContain("HttpOnly");
  });

  it("POST /api/auth/login rejects incorrect password with 401 UNAUTHENTICATED", async () => {
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "member@prax.build",
        password: "WrongPassword999!",
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error.code).toBe("UNAUTHENTICATED");
  });

  it("POST /api/auth/login blocks suspended accounts with 403 ACCOUNT_NOT_ACTIVE", async () => {
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "suspended@prax.build",
        password: "SuspendedPass123!",
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.error.code).toBe("ACCOUNT_NOT_ACTIVE");
  });

  it("GET /api/users/me returns authenticated user from session cookie", async () => {
    const adminUser = await authStore.findUserByEmail("admin@prax.build");
    expect(adminUser).not.toBeNull();

    const token = signSession({
      id: adminUser!.id,
      email: adminUser!.email,
      name: adminUser!.name,
      role: adminUser!.role,
      status: adminUser!.status,
    });

    const req = new Request("http://localhost:3000/api/users/me", {
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
    });

    const res = await meHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user.email).toBe("admin@prax.build");
    expect(data.user.role).toBe("ADMIN");
  });

  it("GET /api/users/me returns 401 UNAUTHENTICATED when cookie is missing", async () => {
    const req = new Request("http://localhost:3000/api/users/me");
    const res = await meHandler(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error.code).toBe("UNAUTHENTICATED");
  });

  it("POST /api/invites/verify returns remaining uses for valid code", async () => {
    const req = new Request("http://localhost:3000/api/invites/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "PRAX-ALPHA-2026" }),
    });

    const res = await inviteVerifyHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.remainingUses).toBe(10);
  });

  it("POST /api/invites allows admin to create new code and rejects non-admin", async () => {
    const adminUser = await authStore.findUserByEmail("admin@prax.build");
    const adminToken = signSession({
      id: adminUser!.id,
      email: adminUser!.email,
      name: adminUser!.name,
      role: adminUser!.role,
      status: adminUser!.status,
    });

    // Admin creates code
    const adminReq = new Request("http://localhost:3000/api/invites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
      },
      body: JSON.stringify({ maxUses: 3 }),
    });

    const adminRes = await createInviteHandler(adminReq);
    expect(adminRes.status).toBe(201);
    const adminData = await adminRes.json();
    expect(adminData.invite.code).toMatch(/^PRAX-/);
    expect(adminData.invite.maxUses).toBe(3);

    // Non-admin member attempts create
    const memberUser = await authStore.findUserByEmail("member@prax.build");
    const memberToken = signSession({
      id: memberUser!.id,
      email: memberUser!.email,
      name: memberUser!.name,
      role: memberUser!.role,
      status: memberUser!.status,
    });

    const memberReq = new Request("http://localhost:3000/api/invites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${SESSION_COOKIE_NAME}=${memberToken}`,
      },
      body: JSON.stringify({ maxUses: 3 }),
    });

    const memberRes = await createInviteHandler(memberReq);
    expect(memberRes.status).toBe(403);
  });

  it("GET /api/invites allows admin to list invite codes and rejects non-admin", async () => {
    const adminUser = await authStore.findUserByEmail("admin@prax.build");
    const adminToken = signSession({
      id: adminUser!.id,
      email: adminUser!.email,
      name: adminUser!.name,
      role: adminUser!.role,
      status: adminUser!.status,
    });

    const adminReq = new Request("http://localhost:3000/api/invites", {
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
      },
    });

    const adminRes = await listInvitesHandler(adminReq);
    expect(adminRes.status).toBe(200);
    const adminData = await adminRes.json();
    expect(Array.isArray(adminData.invites)).toBe(true);
    expect(adminData.invites.length).toBeGreaterThan(0);

    // Non-admin rejected
    const memberUser = await authStore.findUserByEmail("member@prax.build");
    const memberToken = signSession({
      id: memberUser!.id,
      email: memberUser!.email,
      name: memberUser!.name,
      role: memberUser!.role,
      status: memberUser!.status,
    });

    const memberReq = new Request("http://localhost:3000/api/invites", {
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${memberToken}`,
      },
    });

    const memberRes = await listInvitesHandler(memberReq);
    expect(memberRes.status).toBe(403);
  });

  it("DELETE /api/invites/:id revokes active code and blocks terminal state transition", async () => {
    const adminUser = await authStore.findUserByEmail("admin@prax.build");
    const adminToken = signSession({
      id: adminUser!.id,
      email: adminUser!.email,
      name: adminUser!.name,
      role: adminUser!.role,
      status: adminUser!.status,
    });

    const activeInvite = await authStore.findInviteByCode("PRAX-ALPHA-2026");
    expect(activeInvite).not.toBeNull();

    // Revoke active code
    const deleteReq = new Request(`http://localhost:3000/api/invites/${activeInvite!.id}`, {
      method: "DELETE",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
      },
    });

    const deleteRes = await revokeInviteHandler(deleteReq, {
      params: Promise.resolve({ id: activeInvite!.id }),
    });
    expect(deleteRes.status).toBe(200);

    const revokedData = await deleteRes.json();
    expect(revokedData.invite.status).toBe("REVOKED");

    // Attempt to revoke already revoked code -> 422 INVALID_STATE_TRANSITION
    const secondDeleteReq = new Request(`http://localhost:3000/api/invites/${activeInvite!.id}`, {
      method: "DELETE",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
      },
    });

    const secondDeleteRes = await revokeInviteHandler(secondDeleteReq, {
      params: Promise.resolve({ id: activeInvite!.id }),
    });
    expect(secondDeleteRes.status).toBe(422);
  });

  it("handles magic link request and verify flow end-to-end", async () => {
    const email = "member@prax.build";

    // 1. Request magic link
    const reqReq = new Request("http://localhost:3000/api/auth/magic-link/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const reqRes = await magicRequestHandler(reqReq);
    expect(reqRes.status).toBe(200);
    const reqData = await reqRes.json();
    expect(reqData.success).toBe(true);
    expect(reqData.token).toBeDefined();

    // 2. Verify magic link
    const verifyReq = new Request("http://localhost:3000/api/auth/magic-link/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: reqData.token }),
    });

    const verifyRes = await magicVerifyHandler(verifyReq);
    expect(verifyRes.status).toBe(200);

    const verifyData = await verifyRes.json();
    expect(verifyData.user.email).toBe(email);
    expect(verifyRes.headers.get("set-cookie")).toContain(SESSION_COOKIE_NAME);
  });
});
