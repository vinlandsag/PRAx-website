import { afterEach, describe, expect, it, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { GET as listQueue } from "./route";
import { POST as approve } from "./[id]/approve/route";

vi.mock("@/lib/db/prisma", () => ({ getPrismaClient: () => null }));

const secret = "synthetic-review-route-session-secret-long-enough";
const member: SessionUser = {
  id: "review-member",
  email: "member@example.test",
  name: "Synthetic Member",
  role: "MEMBER",
  status: "APPROVED",
};
const admin: SessionUser = { ...member, id: "review-admin", role: "ADMIN" };

function request(
  path: string,
  options: { user?: SessionUser; method?: string; body?: unknown } = {}
) {
  const headers = new Headers();
  if (options.user) headers.set("cookie", `prax_session=${signSession(options.user)}`);
  if (options.body !== undefined) headers.set("content-type", "application/json");
  return new Request(`http://localhost${path}`, {
    method: options.method ?? "GET",
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
}

afterEach(() => vi.unstubAllEnvs());

describe("admin review route authorization and input boundaries", () => {
  it("requires an approved admin session for queue and review actions", async () => {
    vi.stubEnv("SESSION_SECRET", secret);
    expect((await listQueue(request("/api/admin/submissions"))).status).toBe(401);
    expect((await listQueue(request("/api/admin/submissions", { user: member }))).status).toBe(403);
    expect(
      (
        await approve(
          request("/api/admin/submissions/sub-1/approve", {
            user: member,
            method: "POST",
            body: { pointsAwarded: 10 },
          }),
          { params: Promise.resolve({ id: "sub-1" }) }
        )
      ).status
    ).toBe(403);
  });

  it("rejects forged reviewer fields and invalid score values before database access", async () => {
    vi.stubEnv("SESSION_SECRET", secret);
    const forged = await approve(
      request("/api/admin/submissions/sub-1/approve", {
        user: admin,
        method: "POST",
        body: { pointsAwarded: 10, reviewedById: member.id },
      }),
      { params: Promise.resolve({ id: "sub-1" }) }
    );
    expect(forged.status).toBe(400);
    expect((await forged.json()).error.code).toBe("VALIDATION_ERROR");

    const fractional = await approve(
      request("/api/admin/submissions/sub-1/approve", {
        user: admin,
        method: "POST",
        body: { pointsAwarded: 2.5 },
      }),
      { params: Promise.resolve({ id: "sub-1" }) }
    );
    expect(fractional.status).toBe(400);
  });
});
