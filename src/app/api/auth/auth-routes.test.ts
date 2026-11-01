import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { hashInviteCode } from "@/lib/auth/persistence";
import type { SessionUser } from "@/lib/auth/types";
import { POST as register } from "./register/route";
import { POST as login } from "./login/route";
import { POST as verifyInvite } from "../invites/verify/route";
import { GET as currentUser } from "../users/me/route";
import { POST as bootstrapAdmin } from "./bootstrap-admin/route";
import { POST as createInvite } from "../invites/route";
import { GET as listInvites } from "../invites/route";

const mock = vi.hoisted(() => ({ getPrismaClient: vi.fn() }));
vi.mock("@/lib/db/prisma", () => mock);

const secret = "auth-route-test-secret-longer-than-thirty-two-characters";
const inviteCode = "PRAX-ABCD-2345";
const admin: SessionUser = {
  id: "auth-test-admin",
  name: "Auth Test Admin",
  email: "auth-admin@example.test",
  role: "ADMIN",
  status: "APPROVED",
};

function jsonRequest(url: string, body: unknown, user?: SessionUser) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(user ? { cookie: `prax_session=${signSession(user)}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", secret);
  vi.stubEnv("NODE_ENV", "test");
  mock.getPrismaClient.mockReset();
});

afterEach(() => vi.unstubAllEnvs());

describe("database-backed auth route contracts", () => {
  it("creates only a pending MEMBER and consumes a hashed invite transactionally", async () => {
    const now = new Date();
    const tx = {
      inviteCode: {
        findUnique: vi.fn().mockResolvedValue({
          id: "invite-1",
          status: "ACTIVE",
          maxUses: 1,
          usedCount: 0,
          expiresAt: null,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        create: vi.fn().mockResolvedValue({
          id: "member-1",
          email: "person@example.test",
          name: "Example Person",
          role: "MEMBER",
          status: "PENDING_APPROVAL",
          createdAt: now,
        }),
      },
    };
    const prisma = { $transaction: vi.fn((callback) => callback(tx)) };
    mock.getPrismaClient.mockReturnValue(prisma);

    const response = await register(
      jsonRequest("http://localhost/api/auth/register", {
        name: "  Example Person ",
        email: " Person@Example.test ",
        password: "a-long-test-password",
        inviteCode,
      })
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(tx.inviteCode.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { codeHash: hashInviteCode(inviteCode) } })
    );
    expect(tx.inviteCode.updateMany).toHaveBeenCalled();
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "person@example.test",
          role: "MEMBER",
          status: "PENDING_APPROVAL",
        }),
      })
    );
  });

  it("rejects client-selected identity and malformed credentials before database access", async () => {
    const response = await register(
      jsonRequest("http://localhost/api/auth/register", {
        name: "Person",
        email: "person@example.test",
        password: "a-long-test-password",
        inviteCode,
        role: "ADMIN",
      })
    );
    expect(response.status).toBe(400);
    expect(mock.getPrismaClient).not.toHaveBeenCalled();
  });

  it("uses persisted credentials, issues a session, and never logs a pending account in as admin", async () => {
    const passwordHash = await hashPassword("a-long-test-password");
    mock.getPrismaClient.mockReturnValue({
      user: {
        findFirst: vi.fn().mockResolvedValue({
          ...admin,
          email: "person@example.test",
          role: "MEMBER",
          status: "PENDING_APPROVAL",
          passwordHash,
        }),
      },
    });
    const response = await login(
      jsonRequest("http://localhost/api/auth/login", {
        email: "PERSON@example.test",
        password: "a-long-test-password",
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect((await response.json()).user).toMatchObject({ role: "MEMBER", status: "PENDING_APPROVAL" });
  });

  it("returns identical invalid-credential errors for missing users and wrong passwords", async () => {
    mock.getPrismaClient.mockReturnValue({ user: { findFirst: vi.fn().mockResolvedValue(null) } });
    const response = await login(
      jsonRequest("http://localhost/api/auth/login", {
        email: "missing@example.test",
        password: "a-long-test-password",
      })
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("validates invites from their hash and returns no secret", async () => {
    mock.getPrismaClient.mockReturnValue({
      inviteCode: {
        findUnique: vi.fn().mockResolvedValue({
          status: "ACTIVE",
          maxUses: 3,
          usedCount: 1,
          expiresAt: null,
        }),
      },
    });
    const response = await verifyInvite(
      jsonRequest("http://localhost/api/invites/verify", { code: inviteCode.toLowerCase() })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ valid: true, remainingUses: 2 });
  });

  it("re-reads the current account from the database instead of trusting session role/status", async () => {
    const session = signSession({ ...admin, role: "MEMBER", status: "PENDING_APPROVAL" });
    const createdAt = new Date("2026-10-31T10:00:00Z");
    mock.getPrismaClient.mockReturnValue({
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "ADMIN",
          status: "APPROVED",
          createdAt,
        }),
      },
    });
    const response = await currentUser(
      new Request("http://localhost/api/users/me", {
        headers: { cookie: `prax_session=${session}` },
      })
    );
    expect(response.status).toBe(200);
    expect((await response.json()).user).toMatchObject({ role: "ADMIN", status: "APPROVED" });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("keeps first-admin bootstrap disabled unless a private one-time token is configured", async () => {
    const response = await bootstrapAdmin(
      jsonRequest("http://localhost/api/auth/bootstrap-admin", {
        name: "First Admin",
        email: "first@example.test",
        password: "a-much-longer-initial-password",
      })
    );
    expect(response.status).toBe(404);
    expect(mock.getPrismaClient).not.toHaveBeenCalled();
  });

  it("bootstraps one approved administrator under a database lock when given the configured token", async () => {
    vi.stubEnv("FIRST_ADMIN_BOOTSTRAP_TOKEN", "one-time-test-token-with-at-least-thirty-two-characters");
    const createdAt = new Date("2026-10-31T10:00:00Z");
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      user: {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ ...admin, createdAt }),
      },
    };
    mock.getPrismaClient.mockReturnValue({
      $transaction: vi.fn((callback: (transaction: unknown) => unknown) => callback(tx)),
    });
    const response = await bootstrapAdmin(
      new Request("http://localhost/api/auth/bootstrap-admin", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-first-admin-token": "one-time-test-token-with-at-least-thirty-two-characters",
        },
        body: JSON.stringify({
          name: admin.name,
          email: admin.email,
          password: "a-much-longer-initial-password",
        }),
      })
    );
    expect(response.status).toBe(201);
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.user.count).toHaveBeenCalledWith({ where: { role: "ADMIN" } });
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "ADMIN", status: "APPROVED" }),
      })
    );
  });

  it("refuses to bootstrap a second administrator once any ADMIN row exists", async () => {
    vi.stubEnv("FIRST_ADMIN_BOOTSTRAP_TOKEN", "one-time-test-token-with-at-least-thirty-two-characters");
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      user: {
        count: vi.fn().mockResolvedValue(1),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    };
    mock.getPrismaClient.mockReturnValue({
      $transaction: vi.fn((callback: (transaction: unknown) => unknown) => callback(tx)),
    });
    const response = await bootstrapAdmin(
      new Request("http://localhost/api/auth/bootstrap-admin", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-first-admin-token": "one-time-test-token-with-at-least-thirty-two-characters",
        },
        body: JSON.stringify({
          name: "Second Admin",
          email: "second-admin@example.test",
          password: "a-much-longer-initial-password",
        }),
      })
    );
    expect(response.status).toBe(409);
    expect(tx.user.create).not.toHaveBeenCalled();
  });

  it("returns only the generated raw invite code once and never lists stored hashes or codes", async () => {
    const createdAt = new Date("2026-10-31T10:00:00Z");
    const inviteMetadata = {
      id: "invite-1",
      maxUses: 1,
      usedCount: 0,
      status: "ACTIVE",
      expiresAt: null,
      createdById: admin.id,
      createdAt,
      updatedAt: createdAt,
    };
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: admin.id, name: admin.name, role: "ADMIN", status: "APPROVED" }),
      },
      inviteCode: {
        create: vi.fn().mockResolvedValue(inviteMetadata),
        findMany: vi.fn().mockResolvedValue([inviteMetadata]),
        count: vi.fn().mockResolvedValue(1),
      },
    };
    mock.getPrismaClient.mockReturnValue(prisma);
    const create = await createInvite(jsonRequest("http://localhost/api/invites", { maxUses: 1 }, admin));
    expect(create.status).toBe(201);
    const createdInvite = (await create.json()).invite;
    expect(createdInvite.code).toMatch(/^PRAX-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(prisma.inviteCode.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          codeHash: hashInviteCode(createdInvite.code),
          createdById: admin.id,
        }),
      })
    );
    const list = await listInvites(new Request("http://localhost/api/invites", {
      headers: { cookie: `prax_session=${signSession(admin)}` },
    }));
    expect(list.status).toBe(200);
    expect((await list.json()).invites[0].code).toBeNull();
  });

  it("requires an approved admin session before invitation management reaches storage", async () => {
    const response = await createInvite(jsonRequest("http://localhost/api/invites", { maxUses: 1 }));
    expect(response.status).toBe(401);
    expect(mock.getPrismaClient).not.toHaveBeenCalled();
  });
});
