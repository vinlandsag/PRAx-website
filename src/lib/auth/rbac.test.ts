/**
 * src/lib/auth/rbac.test.ts
 *
 * Test suite for Phase 5 — RBAC, Route & API Protection, and Proxy Middleware.
 * Covers:
 * 1. Permission Matrix & Role capability verification (Visitor, Member, Admin).
 * 2. Deny-by-default for unknown roles and permissions.
 * 3. Resource ownership checks (`canAccessResource`).
 * 4. Server-side authorization guard (`authorize`, `requireRole`, `requirePermission`).
 * 5. Role tampering and stale/expired session rejection.
 * 6. Proxy / Middleware direct URL & API interception.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  type AppPermission,
  canAccessResource,
  hasPermission,
  isValidRole,
  isValidUserStatus,
  MEMBER_PERMISSIONS,
  ROLE_PERMISSIONS,
} from "./rbac";
import { authorize, requirePermission, requireRole } from "./guard";
import { signSession } from "./session";
import type { SessionUser } from "./types";
import { proxy } from "@/proxy";

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", "test-only-session-key-that-is-at-least-32-characters");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Phase 5 — RBAC Permission Matrix & Deny-by-Default", () => {
  const memberUser: SessionUser = {
    id: "usr_mem_1",
    email: "member@example.com",
    role: "MEMBER",
    status: "APPROVED",
    name: "Valid Member",
  };

  const adminUser: SessionUser = {
    id: "usr_adm_1",
    email: "admin@example.com",
    role: "ADMIN",
    status: "APPROVED",
    name: "Admin User",
  };

  const pendingUser: SessionUser = {
    id: "usr_pen_1",
    email: "pending@example.com",
    role: "MEMBER",
    status: "PENDING_APPROVAL",
    name: "Pending Member",
  };

  describe("Role Verification & Deny-by-Default", () => {
    it("recognizes only valid application roles ('MEMBER', 'ADMIN')", () => {
      expect(isValidRole("MEMBER")).toBe(true);
      expect(isValidRole("ADMIN")).toBe(true);

      // Unknown or forged roles must be rejected
      expect(isValidRole("SUPER_ADMIN")).toBe(false);
      expect(isValidRole("HACKER")).toBe(false);
      expect(isValidRole("GUEST")).toBe(false);
      expect(isValidRole("")).toBe(false);
      expect(isValidRole(null)).toBe(false);
      expect(isValidRole(undefined)).toBe(false);
    });

    it("enforces deny-by-default for unknown or tampered roles", () => {
      expect(hasPermission("SUPER_ADMIN", "view:dashboard")).toBe(false);
      expect(hasPermission("HACKER", "admin:approve_user")).toBe(false);
      expect(hasPermission("root", "view:tasks")).toBe(false);
      expect(hasPermission("", "view:dashboard")).toBe(false);
      expect(hasPermission(null, "view:dashboard")).toBe(false);
      expect(hasPermission(undefined, "admin:view_user_queue")).toBe(false);
    });

    it("recognizes only persisted account status values", () => {
      for (const status of ["PENDING_APPROVAL", "APPROVED", "REJECTED", "SUSPENDED", "DISABLED"]) {
        expect(isValidUserStatus(status)).toBe(true);
      }
      expect(isValidUserStatus("ROOT")).toBe(false);
      expect(isValidUserStatus(1)).toBe(false);
      expect(isValidUserStatus(null)).toBe(false);
    });

    it("enforces deny-by-default for unknown permissions", () => {
      expect(hasPermission("ADMIN", "unknown:action" as AppPermission)).toBe(false);
      expect(hasPermission("MEMBER", "admin:drop_database" as AppPermission)).toBe(false);
    });
  });

  describe("Permission Matrix — Visitor Capabilities", () => {
    it("allows Visitors only public permissions", () => {
      expect(hasPermission(null, "view:landing")).toBe(true);
      expect(hasPermission(null, "auth:register")).toBe(true);
      expect(hasPermission(null, "auth:login")).toBe(true);
      expect(hasPermission(null, "invites:verify")).toBe(true);

      // Must be denied from any member or admin features
      expect(hasPermission(null, "view:dashboard")).toBe(false);
      expect(hasPermission(null, "view:tasks")).toBe(false);
      expect(hasPermission(null, "create:submission")).toBe(false);
      expect(hasPermission(null, "chat:read_write")).toBe(false);
      expect(hasPermission(null, "admin:approve_user")).toBe(false);
      expect(hasPermission(null, "admin:view_audit_log")).toBe(false);
    });
  });

  describe("Permission Matrix — Member Capabilities", () => {
    it("allows Members access to all member operations", () => {
      for (const permission of MEMBER_PERMISSIONS) {
        expect(hasPermission("MEMBER", permission)).toBe(true);
      }
    });

    it("strictly denies Members from any administrative operations", () => {
      const adminOnlyPermissions: AppPermission[] = [
        "admin:view_user_queue",
        "admin:approve_user",
        "admin:reject_user",
        "admin:suspend_user",
        "admin:unsuspend_user",
        "admin:disable_user",
        "admin:create_invite",
        "admin:revoke_invite",
        "admin:view_invites",
        "admin:view_submissions_queue",
        "admin:approve_submission",
        "admin:reject_submission",
        "admin:request_revision_submission",
        "admin:manage_rubric",
        "admin:assign_points",
        "admin:moderate_chat",
        "admin:view_audit_log",
      ];

      for (const permission of adminOnlyPermissions) {
        expect(hasPermission("MEMBER", permission)).toBe(false);
      }
    });
  });

  describe("Permission Matrix — Admin Capabilities", () => {
    it("allows Admins access to both member and admin operations", () => {
      for (const permission of ROLE_PERMISSIONS.ADMIN) {
        expect(hasPermission("ADMIN", permission)).toBe(true);
      }
    });
  });

  describe("Resource Ownership Authorization (`canAccessResource`)", () => {
    it("allows a member to access their own resource", () => {
      expect(canAccessResource(memberUser, "usr_mem_1")).toBe(true);
    });

    it("denies a member from accessing another member's resource", () => {
      expect(canAccessResource(memberUser, "usr_mem_2")).toBe(false);
    });

    it("allows an admin to access any member's resource by default", () => {
      expect(canAccessResource(adminUser, "usr_mem_1")).toBe(true);
      expect(canAccessResource(adminUser, "usr_mem_2")).toBe(true);
    });

    it("respects allowAdmin: false when strict privacy is required", () => {
      expect(canAccessResource(adminUser, "usr_mem_1", { allowAdmin: false })).toBe(false);
      // But owner still has access
      expect(canAccessResource(memberUser, "usr_mem_1", { allowAdmin: false })).toBe(true);
    });

    it("returns false if user or resource ID is missing", () => {
      expect(canAccessResource(null, "usr_1")).toBe(false);
      expect(canAccessResource(memberUser, "")).toBe(false);
    });
  });

  describe("Server Authorization Guard (`authorize`)", () => {
    function makeRequest(cookie?: string): Request {
      return new Request("https://prax.test/api/protected", {
        headers: cookie ? { cookie } : {},
      });
    }

    it("rejects unauthenticated requests with 401 UNAUTHENTICATED", async () => {
      const res = authorize(makeRequest());
      expect(res.authorized).toBe(false);
      if (!res.authorized) {
        expect(res.errorResponse.status).toBe(401);
        const json = await res.errorResponse.json();
        expect(json.error.code).toBe("UNAUTHENTICATED");
      }
    });

    it("rejects stale or expired sessions with 401 UNAUTHENTICATED", async () => {
      // Create session with negative TTL (-10 seconds)
      const expiredToken = signSession(memberUser, -10000);
      const req = makeRequest(`prax_session=${expiredToken}`);
      const res = authorize(req);

      expect(res.authorized).toBe(false);
      if (!res.authorized) {
        expect(res.errorResponse.status).toBe(401);
        const json = await res.errorResponse.json();
        expect(json.error.code).toBe("UNAUTHENTICATED");
      }
    });

    it("rejects tampered session signatures with 401 UNAUTHENTICATED", async () => {
      const validToken = signSession(memberUser);
      // Tamper with the payload part
      const [payload, sig] = validToken.split(".");
      const tamperedToken = `${payload}modified.${sig}`;

      const req = makeRequest(`prax_session=${tamperedToken}`);
      const res = authorize(req);
      expect(res.authorized).toBe(false);
      if (!res.authorized) {
        expect(res.errorResponse.status).toBe(401);
      }
    });

    it("denies access by default if token contains an unknown role", async () => {
      const forgedUser: SessionUser = {
        ...memberUser,
        role: "SUPER_ADMIN" as unknown as SessionUser["role"],
      };
      const forgedToken = signSession(forgedUser);
      const req = makeRequest(`prax_session=${forgedToken}`);
      const res = authorize(req);

      expect(res.authorized).toBe(false);
      if (!res.authorized) {
        expect(res.errorResponse.status).toBe(403);
        const json = await res.errorResponse.json();
        expect(json.error.code).toBe("FORBIDDEN");
      }
    });

    it("denies a signed session containing an unknown account status", async () => {
      const malformedUser: SessionUser = {
        ...memberUser,
        status: "ACTIVE" as unknown as SessionUser["status"],
      };
      const token = signSession(malformedUser);
      const result = authorize(makeRequest(`prax_session=${token}`));
      expect(result).toMatchObject({ authorized: false });
      if (!result.authorized) {
        expect(result.errorResponse.status).toBe(403);
        expect(await result.errorResponse.json()).toMatchObject({
          error: { code: "FORBIDDEN" },
        });
      }
    });

    it("fails closed when a route supplies an empty resource owner ID", async () => {
      const token = signSession(memberUser);
      const result = authorize(makeRequest(`prax_session=${token}`), { resourceOwnerId: "" });
      expect(result).toMatchObject({ authorized: false });
      if (!result.authorized) expect(result.errorResponse.status).toBe(403);
    });

    it("blocks inactive account states with 403 ACCOUNT_NOT_ACTIVE", async () => {
      const statuses = ["REJECTED", "SUSPENDED", "DISABLED"] as const;
      for (const status of statuses) {
        const inactiveUser: SessionUser = { ...memberUser, status };
        const token = signSession(inactiveUser);
        const req = makeRequest(`prax_session=${token}`);
        const res = authorize(req);

        expect(res.authorized).toBe(false);
        if (!res.authorized) {
          expect(res.errorResponse.status).toBe(403);
          const json = await res.errorResponse.json();
          expect(json.error.code).toBe("ACCOUNT_NOT_ACTIVE");
        }
      }
    });

    it("blocks PENDING_APPROVAL users with 403 ACCOUNT_PENDING from member endpoints", async () => {
      const token = signSession(pendingUser);
      const req = makeRequest(`prax_session=${token}`);
      const res = authorize(req);

      expect(res.authorized).toBe(false);
      if (!res.authorized) {
        expect(res.errorResponse.status).toBe(403);
        const json = await res.errorResponse.json();
        expect(json.error.code).toBe("ACCOUNT_PENDING");
      }
    });

    it("allows PENDING_APPROVAL users when allowedStatuses explicitly includes it", async () => {
      const token = signSession(pendingUser);
      const req = makeRequest(`prax_session=${token}`);
      const res = authorize(req, { allowedStatuses: ["PENDING_APPROVAL"] });

      expect(res.authorized).toBe(true);
      if (res.authorized) {
        expect(res.user.id).toBe("usr_pen_1");
      }
    });

    it("enforces role requirements via requireRole", async () => {
      const memberToken = signSession(memberUser);
      const adminToken = signSession(adminUser);

      // Member calling admin requirement
      const req1 = makeRequest(`prax_session=${memberToken}`);
      const res1 = requireRole(req1, "ADMIN");
      expect(res1.authorized).toBe(false);
      if (!res1.authorized) {
        expect(res1.errorResponse.status).toBe(403);
      }

      // Admin calling admin requirement
      const req2 = makeRequest(`prax_session=${adminToken}`);
      const res2 = requireRole(req2, "ADMIN");
      expect(res2.authorized).toBe(true);
      if (res2.authorized) {
        expect(res2.user.role).toBe("ADMIN");
      }
    });

    it("enforces permission requirements via requirePermission", async () => {
      const memberToken = signSession(memberUser);
      const adminToken = signSession(adminUser);

      // Member checking submission creation (allowed)
      const req1 = makeRequest(`prax_session=${memberToken}`);
      const res1 = requirePermission(req1, "create:submission");
      expect(res1.authorized).toBe(true);

      // Member checking audit log view (forbidden)
      const res2 = requirePermission(req1, "admin:view_audit_log");
      expect(res2.authorized).toBe(false);
      if (!res2.authorized) {
        expect(res2.errorResponse.status).toBe(403);
      }

      // Admin checking audit log view (allowed)
      const req3 = makeRequest(`prax_session=${adminToken}`);
      const res3 = requirePermission(req3, "admin:view_audit_log");
      expect(res3.authorized).toBe(true);
    });

    it("enforces resource ownership boundary checks", async () => {
      const memberToken = signSession(memberUser);

      // Accessing own resource
      const req1 = makeRequest(`prax_session=${memberToken}`);
      const res1 = authorize(req1, { resourceOwnerId: "usr_mem_1" });
      expect(res1.authorized).toBe(true);

      // Accessing other member's resource
      const res2 = authorize(req1, { resourceOwnerId: "usr_mem_999" });
      expect(res2.authorized).toBe(false);
      if (!res2.authorized) {
        expect(res2.errorResponse.status).toBe(403);
      }
    });
  });

  describe("Proxy Middleware Route Protection", () => {
    function makeNextRequest(path: string, cookie?: string): NextRequest {
      return new NextRequest(`https://prax.test${path}`, {
        headers: cookie ? { cookie } : {},
      });
    }

    describe("Page Direct URL Protection", () => {
      it("redirects unauthenticated visitor visiting /admin to /login?callbackUrl=/admin", () => {
        const req = makeNextRequest("/admin");
        const res = proxy(req);
        expect(res.status).toBe(307);
        const location = res.headers.get("location");
        expect(location).toContain("/login");
        expect(location).toContain("callbackUrl=%2Fadmin");
      });

      it("redirects unauthenticated visitor visiting /dashboard to /login?callbackUrl=/dashboard", () => {
        const req = makeNextRequest("/dashboard");
        const res = proxy(req);
        expect(res.status).toBe(307);
        const location = res.headers.get("location");
        expect(location).toContain("/login");
        expect(location).toContain("callbackUrl=%2Fdashboard");
      });

      it("redirects a malformed account status away from protected pages", () => {
        const invalidUser = {
          ...memberUser,
          status: "ACTIVE" as unknown as SessionUser["status"],
        };
        const request = makeNextRequest("/space", `prax_session=${signSession(invalidUser)}`);
        const response = proxy(request);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("error=invalid_account_state");
      });

      it("redirects authenticated Member attempting direct URL access to /admin to /dashboard?error=access_denied", () => {
        const memberCookie = `prax_session=${signSession(memberUser)}`;
        const req = makeNextRequest("/admin/members", memberCookie);
        const res = proxy(req);
        expect(res.status).toBe(307);
        const location = res.headers.get("location");
        expect(location).toContain("/dashboard");
        expect(location).toContain("error=access_denied");
      });

      it("allows authenticated Admin direct URL access to /admin and subroutes", () => {
        const adminCookie = `prax_session=${signSession(adminUser)}`;
        const req = makeNextRequest("/admin/review", adminCookie);
        const res = proxy(req);
        // Successful pass-through
        expect(res.status).toBe(200);
      });

      it("redirects PENDING_APPROVAL user visiting /dashboard to /onboarding", () => {
        const pendingCookie = `prax_session=${signSession(pendingUser)}`;
        const req = makeNextRequest("/dashboard", pendingCookie);
        const res = proxy(req);
        expect(res.status).toBe(307);
        const location = res.headers.get("location");
        expect(location).toContain("/onboarding");
      });

      it("redirects APPROVED user visiting /onboarding to /dashboard", () => {
        const approvedCookie = `prax_session=${signSession(memberUser)}`;
        const req = makeNextRequest("/onboarding", approvedCookie);
        const res = proxy(req);
        expect(res.status).toBe(307);
        const location = res.headers.get("location");
        expect(location).toContain("/dashboard");
      });

      it("allows PENDING_APPROVAL user to access /onboarding", () => {
        const pendingCookie = `prax_session=${signSession(pendingUser)}`;
        const req = makeNextRequest("/onboarding", pendingCookie);
        const res = proxy(req);
        expect(res.status).toBe(200);
      });
    });

    describe("API Endpoint Protection via Proxy", () => {
      it("blocks visitor direct API access to /api/admin/users with 401 UNAUTHENTICATED", async () => {
        const req = makeNextRequest("/api/admin/users");
        const res = proxy(req);
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error.code).toBe("UNAUTHENTICATED");
      });

      it("blocks member direct API access to /api/admin/users with 403 FORBIDDEN", async () => {
        const memberCookie = `prax_session=${signSession(memberUser)}`;
        const req = makeNextRequest("/api/admin/users", memberCookie);
        const res = proxy(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error.code).toBe("FORBIDDEN");
      });

      it("blocks a malformed account status from protected API routes", async () => {
        const invalidUser = {
          ...memberUser,
          status: "ACTIVE" as unknown as SessionUser["status"],
        };
        const request = makeNextRequest("/api/streaks", `prax_session=${signSession(invalidUser)}`);
        const response = proxy(request);
        expect(response.status).toBe(403);
      });

      it("blocks member direct API access to /api/invites with 403 FORBIDDEN", async () => {
        const memberCookie = `prax_session=${signSession(memberUser)}`;
        const req = makeNextRequest("/api/invites", memberCookie);
        const res = proxy(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error.code).toBe("FORBIDDEN");
      });

      it("allows admin direct API access to /api/admin/users and /api/invites", () => {
        const adminCookie = `prax_session=${signSession(adminUser)}`;
        const req1 = makeNextRequest("/api/admin/users", adminCookie);
        const res1 = proxy(req1);
        expect(res1.status).toBe(200);

        const req2 = makeNextRequest("/api/invites", adminCookie);
        const res2 = proxy(req2);
        expect(res2.status).toBe(200);
      });

      it("allows public API endpoints without authentication (/api/health, /api/auth/login, /api/invites/verify)", () => {
        expect(proxy(makeNextRequest("/api/health")).status).toBe(200);
        expect(proxy(makeNextRequest("/api/auth/login")).status).toBe(200);
        expect(proxy(makeNextRequest("/api/invites/verify")).status).toBe(200);
      });
    });
  });
});
