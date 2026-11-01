import { afterEach, describe, expect, it, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { GET, POST } from "./route";
import { GET as getTask, PATCH } from "./[id]/route";

const member: SessionUser = {
  id: "task-route-member",
  name: "Synthetic Member",
  email: "task-route-member@example.test",
  role: "MEMBER",
  status: "APPROVED",
};
const admin: SessionUser = { ...member, id: "task-route-admin", role: "ADMIN" };
const secret = "synthetic-task-route-secret-with-more-than-32-characters";

function makeRequest(
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

describe("task route authorization and disconnected database behavior", () => {
  it("requires a session for list and detail", async () => {
    vi.stubEnv("SESSION_SECRET", secret);
    expect((await GET(makeRequest("/api/tasks"))).status).toBe(401);
    expect(
      (
        await getTask(makeRequest("/api/tasks/task-1"), {
          params: Promise.resolve({ id: "task-1" }),
        })
      ).status
    ).toBe(401);
  });

  it("rejects query/body validation errors before database access", async () => {
    vi.stubEnv("SESSION_SECRET", secret);
    const invalidQuery = await GET(makeRequest("/api/tasks?sort=oldest", { user: member }));
    expect(invalidQuery.status).toBe(400);
    expect((await invalidQuery.json()).error.code).toBe("VALIDATION_ERROR");

    const invalidCreate = await POST(
      makeRequest("/api/tasks", { method: "POST", user: admin, body: { title: "No" } })
    );
    expect(invalidCreate.status).toBe(400);
    const invalidPatch = await PATCH(
      makeRequest("/api/tasks/task-1", {
        method: "PATCH",
        user: admin,
        body: { lifecycle: "ARCHIVED" },
      }),
      { params: Promise.resolve({ id: "task-1" }) }
    );
    expect(invalidPatch.status).toBe(400);
  });

  it("denies member task writes and admin routes reject stale status claims", async () => {
    vi.stubEnv("SESSION_SECRET", secret);
    const memberWrite = await POST(
      makeRequest("/api/tasks", { method: "POST", user: member, body: {} })
    );
    expect(memberWrite.status).toBe(403);
    const pending = await GET(
      makeRequest("/api/tasks", { user: { ...member, status: "PENDING_APPROVAL" } })
    );
    expect(pending.status).toBe(403);
  });

  it("returns 503 for valid authenticated requests when database URLs are absent", async () => {
    vi.stubEnv("SESSION_SECRET", secret);
    const list = await GET(makeRequest("/api/tasks?limit=10", { user: member }));
    expect(list.status).toBe(503);
    expect((await list.json()).error.code).toBe("BACKEND_NOT_CONFIGURED");
    const detail = await getTask(makeRequest("/api/tasks/task-1", { user: member }), {
      params: Promise.resolve({ id: "task-1" }),
    });
    expect(detail.status).toBe(503);
  });
});
