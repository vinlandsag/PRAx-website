import { afterEach, describe, expect, it, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { DELETE, GET as getSubmission, PATCH } from "./[id]/route";
import { GET as listSubmissions, POST } from "./route";

const member: SessionUser = {
  id: "submission-route-member",
  name: "Synthetic Member",
  email: "submission-route-member@example.test",
  role: "MEMBER",
  status: "APPROVED",
};
const admin: SessionUser = { ...member, id: "submission-route-admin", role: "ADMIN" };
const secret = "synthetic-submission-route-secret-long-enough";
const valid = {
  taskId: "task-123",
  proofUrl: "https://example.test/proof",
  note: "This is a synthetic proof note.",
};

function request(
  path: string,
  method: string,
  options: { user?: SessionUser; body?: unknown } = {}
) {
  const headers = new Headers();
  if (options.user) headers.set("cookie", `prax_session=${signSession(options.user)}`);
  if (options.body !== undefined) headers.set("content-type", "application/json");
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
}

const context = { params: Promise.resolve({ id: "submission-123" }) };

afterEach(() => vi.unstubAllEnvs());

describe("submission API guards and request validation", () => {
  it("requires a session for own-list and detail reads", async () => {
    vi.stubEnv("SESSION_SECRET", secret);
    expect((await listSubmissions(request("/api/submissions", "GET"))).status).toBe(401);
    expect((await getSubmission(request("/api/submissions/submission-123", "GET"), context)).status).toBe(
      401
    );
  });

  it("rejects invalid proof data and forged fields before accessing the database", async () => {
    vi.stubEnv("SESSION_SECRET", secret);
    const invalidUrl = await POST(
      request("/api/submissions", "POST", {
        user: member,
        body: { ...valid, proofUrl: "javascript:alert(1)" },
      })
    );
    expect(invalidUrl.status).toBe(400);
    const forged = await POST(
      request("/api/submissions", "POST", {
        user: member,
        body: { ...valid, userId: "another-user" },
      })
    );
    expect(forged.status).toBe(400);
    const statusEdit = await PATCH(
      request("/api/submissions/submission-123", "PATCH", {
        user: member,
        body: { status: "APPROVED" },
      }),
      context
    );
    expect(statusEdit.status).toBe(400);
  });

  it("allows only member sessions to write and returns 503 without a configured DB", async () => {
    vi.stubEnv("SESSION_SECRET", secret);
    vi.stubEnv("DATABASE_URL", "");
    expect(
      (
        await POST(
          request("/api/submissions", "POST", { user: admin, body: valid })
        )
      ).status
    ).toBe(403);
    expect((await POST(request("/api/submissions", "POST", { user: member, body: valid }))).status).toBe(
      503
    );
    expect((await listSubmissions(request("/api/submissions", "GET", { user: member }))).status).toBe(
      503
    );
    expect(
      (
        await DELETE(request("/api/submissions/submission-123", "DELETE", { user: member }), context)
      ).status
    ).toBe(503);
  });
});
