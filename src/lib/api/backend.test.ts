import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import * as route0 from "@/app/api/admin/audit-log/route";
import * as route1 from "@/app/api/admin/reports/route";
import * as route2 from "@/app/api/admin/submissions/[id]/approve/route";
import * as route3 from "@/app/api/admin/submissions/[id]/reject/route";
import * as route4 from "@/app/api/admin/submissions/[id]/request-revision/route";
import * as route5 from "@/app/api/admin/submissions/route";
import * as route6 from "@/app/api/admin/users/[id]/approve/route";
import * as route7 from "@/app/api/admin/users/[id]/disable/route";
import * as route8 from "@/app/api/admin/users/[id]/reject/route";
import * as route9 from "@/app/api/admin/users/[id]/suspend/route";
import * as route10 from "@/app/api/admin/users/[id]/unsuspend/route";
import * as route11 from "@/app/api/admin/users/route";
import * as route12 from "@/app/api/auth/login/route";
import * as route13 from "@/app/api/auth/magic-link/request/route";
import * as route14 from "@/app/api/auth/magic-link/verify/route";
import * as route15 from "@/app/api/auth/register/route";
import * as route16 from "@/app/api/chat/attachments/[id]/route";
import * as route17 from "@/app/api/chat/attachments/route";
import * as route18 from "@/app/api/dashboard/route";
import * as route19 from "@/app/api/invites/[id]/route";
import * as route20 from "@/app/api/invites/route";
import * as route21 from "@/app/api/invites/verify/route";
import * as route22 from "@/app/api/leaderboard/route";
import * as route23 from "@/app/api/notifications/route";
import * as route24 from "@/app/api/rubric/route";
import * as route25 from "@/app/api/streaks/route";
import * as route26 from "@/app/api/submissions/route";
import * as route27 from "@/app/api/tasks/[id]/route";
import * as route28 from "@/app/api/tasks/route";
import * as route29 from "@/app/api/users/me/route";
import * as route30 from "@/app/api/workspace/route";
const routes = [
  { path: "/api/admin/audit-log", handlers: route0 },
  { path: "/api/admin/reports", handlers: route1 },
  { path: "/api/admin/submissions/test-id/approve", handlers: route2 },
  { path: "/api/admin/submissions/test-id/reject", handlers: route3 },
  { path: "/api/admin/submissions/test-id/request-revision", handlers: route4 },
  { path: "/api/admin/submissions", handlers: route5 },
  { path: "/api/admin/users/test-id/approve", handlers: route6 },
  { path: "/api/admin/users/test-id/disable", handlers: route7 },
  { path: "/api/admin/users/test-id/reject", handlers: route8 },
  { path: "/api/admin/users/test-id/suspend", handlers: route9 },
  { path: "/api/admin/users/test-id/unsuspend", handlers: route10 },
  { path: "/api/admin/users", handlers: route11 },
  { path: "/api/auth/login", handlers: route12 },
  { path: "/api/auth/magic-link/request", handlers: route13 },
  { path: "/api/auth/magic-link/verify", handlers: route14 },
  { path: "/api/auth/register", handlers: route15 },
  { path: "/api/chat/attachments/test-id", handlers: route16 },
  { path: "/api/chat/attachments", handlers: route17 },
  { path: "/api/dashboard", handlers: route18 },
  { path: "/api/invites/test-id", handlers: route19 },
  { path: "/api/invites", handlers: route20 },
  { path: "/api/invites/verify", handlers: route21 },
  { path: "/api/leaderboard", handlers: route22 },
  { path: "/api/notifications", handlers: route23 },
  { path: "/api/rubric", handlers: route24 },
  { path: "/api/streaks", handlers: route25 },
  { path: "/api/submissions", handlers: route26 },
  { path: "/api/tasks/test-id", handlers: route27 },
  { path: "/api/tasks", handlers: route28 },
  { path: "/api/users/me", handlers: route29 },
  { path: "/api/workspace", handlers: route30 },
];
const member: SessionUser = {
  id: "test-member",
  name: "Test",
  email: "test@example.test",
  role: "MEMBER",
  status: "APPROVED",
};
beforeEach(() => vi.stubEnv("SESSION_SECRET", "test-only-secret-with-more-than-32-characters"));
afterEach(() => vi.unstubAllEnvs());
for (const route of routes) {
  for (const [method, handler] of Object.entries(route.handlers)) {
    if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) continue;
    const invoke = (user?: SessionUser) =>
      handler(
        new Request("http://localhost" + route.path, {
          method,
          headers: user ? { cookie: "prax_session=" + signSession(user) } : {},
        })
      );
    const publicApi = route.path.startsWith("/api/auth/") || route.path === "/api/invites/verify";
    const adminApi =
      route.path.startsWith("/api/admin/") ||
      (route.path.startsWith("/api/invites") && !publicApi) ||
      (route.path === "/api/rubric" && method === "PUT") ||
      ((route.path === "/api/tasks" || route.path.startsWith("/api/tasks/")) && method !== "GET");
    describe(method + " " + route.path, () => {
      it("never fabricates data, tokens or successful persistence", async () => {
        const response = await invoke({ ...member, role: "ADMIN" });
        expect(response.status).toBe(503);
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(await response.json()).toEqual({
          error: { code: "BACKEND_NOT_CONFIGURED", message: expect.any(String), status: 503 },
        });
        expect(response.headers.get("set-cookie")).toBeNull();
      });
      it("preserves visitor and member access boundaries", async () => {
        expect((await invoke()).status).toBe(publicApi ? 503 : 401);
        expect((await invoke(member)).status).toBe(adminApi ? 403 : 503);
      });
    });
  }
}
