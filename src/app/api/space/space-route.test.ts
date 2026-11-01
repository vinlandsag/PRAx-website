import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { GET, PATCH } from "./route";

// Mocked Prisma: these tests prove the route's authorization, validation and owner scoping by
// inspecting the queries it builds. Real-database proof is in space.integration.test.ts
// (written, not run in this environment).
const mock = vi.hoisted(() => ({ getPrismaClient: vi.fn() }));
vi.mock("@/lib/db/prisma", () => mock);

const secret = "space-route-test-secret-longer-than-thirty-two-characters";
const member: SessionUser = {
  id: "space-member-1",
  name: "Member One",
  email: "member1@example.test",
  role: "MEMBER",
  status: "APPROVED",
};
const admin: SessionUser = {
  id: "space-admin-1",
  name: "Admin One",
  email: "admin1@example.test",
  role: "ADMIN",
  status: "APPROVED",
};

function crud() {
  return {
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
  };
}
function makeDb() {
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    todo: crud(),
    note: crud(),
    goal: crud(),
    task: { findFirst: vi.fn().mockResolvedValue({ id: "task-1" }) },
  };
  const db = {
    user: { findUnique: vi.fn() },
    todo: { findMany: vi.fn().mockResolvedValue([]) },
    note: { findMany: vi.fn().mockResolvedValue([]) },
    goal: { findMany: vi.fn().mockResolvedValue([]) },
    $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  };
  mock.getPrismaClient.mockReturnValue(db);
  return { db, tx };
}
const persisted = (db: ReturnType<typeof makeDb>["db"], user: SessionUser, status = "APPROVED") =>
  db.user.findUnique.mockResolvedValue({
    id: user.id,
    name: user.name,
    role: user.role,
    status,
  });

function request(
  method: "GET" | "PATCH",
  user?: SessionUser,
  body?: unknown,
  init: { origin?: string; contentType?: string; raw?: string; path?: string } = {}
) {
  const headers: Record<string, string> = {};
  if (user) headers.cookie = `prax_session=${signSession(user)}`;
  const hasBody = body !== undefined || init.raw !== undefined;
  if (hasBody) {
    headers["content-type"] = init.contentType ?? "application/json";
    headers.origin = init.origin ?? "http://localhost";
  }
  return new Request(`http://localhost${init.path ?? "/api/space"}`, {
    method,
    headers,
    ...(hasBody ? { body: init.raw ?? JSON.stringify(body) } : {}),
  });
}
const patch = (user: SessionUser | undefined, body: unknown, init = {}) =>
  PATCH(request("PATCH", user, body, init));
const code = async (response: Response) => (await response.json()).error?.code;

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", secret);
  vi.stubEnv("NODE_ENV", "test");
  mock.getPrismaClient.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/space", () => {
  it("requires a session", async () => {
    const { db } = makeDb();
    expect((await GET(request("GET"))).status).toBe(401);
    expect(db.todo.findMany).not.toHaveBeenCalled();
  });

  it("refuses pending and inactive accounts before touching the database", async () => {
    const { db } = makeDb();
    const pending = await GET(request("GET", { ...member, status: "PENDING_APPROVAL" }));
    expect(pending.status).toBe(403);
    expect(await code(pending)).toBe("ACCOUNT_PENDING");
    const suspended = await GET(request("GET", { ...member, status: "SUSPENDED" }));
    expect(suspended.status).toBe(403);
    expect(await code(suspended)).toBe("ACCOUNT_NOT_ACTIVE");
    expect(mock.getPrismaClient).not.toHaveBeenCalled();
    expect(db.todo.findMany).not.toHaveBeenCalled();
  });

  it("refuses a stale session whose persisted account is no longer approved", async () => {
    const { db } = makeDb();
    persisted(db, member, "SUSPENDED");
    const response = await GET(request("GET", member));
    expect(response.status).toBe(403);
    expect(db.todo.findMany).not.toHaveBeenCalled();
    expect(db.note.findMany).not.toHaveBeenCalled();
    expect(db.goal.findMany).not.toHaveBeenCalled();
  });

  it("returns 503 when the database is not configured", async () => {
    mock.getPrismaClient.mockReturnValue(null);
    const response = await GET(request("GET", member));
    expect(response.status).toBe(503);
  });

  it.each([
    ["a member", member],
    ["an admin", admin],
  ])("reads only the caller's own rows for %s", async (_label, user) => {
    const { db } = makeDb();
    persisted(db, user);
    const response = await GET(
      request("GET", user, undefined, { path: "/api/space?userId=other" })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    for (const table of [db.todo, db.note, db.goal])
      expect(table.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: user.id } })
      );
  });

  it("maps rows and hides a linked task that is no longer published", async () => {
    const { db } = makeDb();
    persisted(db, member);
    const base = {
      description: "",
      difficulty: "HARD",
      priority: "HIGH",
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.todo.findMany.mockResolvedValue([
      {
        ...base,
        id: "t1",
        title: "Linked",
        dueDate: new Date("2026-11-05T00:00:00.000Z"),
        taskId: "task-1",
        task: { id: "task-1", title: "Landing page", lifecycle: "PUBLISHED" },
      },
      {
        ...base,
        id: "t2",
        title: "Archived link",
        dueDate: null,
        taskId: "task-2",
        task: { id: "task-2", title: "Old task", lifecycle: "ARCHIVED" },
      },
    ]);
    db.note.findMany.mockResolvedValue([
      { id: "n1", title: "Idea", content: "text", updatedAt: new Date("2026-11-01T10:00:00.000Z") },
    ]);
    db.goal.findMany.mockResolvedValue([
      { id: "g1", title: "Ship", description: "d", progress: 40 },
    ]);
    const body = await (await GET(request("GET", member))).json();
    expect(body.todos[0]).toMatchObject({
      id: "t1",
      difficulty: "Hard",
      priority: "High",
      dueDate: "2026-11-05",
      taskId: "task-1",
      taskTitle: "Landing page",
    });
    expect(body.todos[1]).toMatchObject({ dueDate: "", taskId: null, taskTitle: null });
    expect(body.notes[0]).toEqual({
      id: "n1",
      title: "Idea",
      content: "text",
      updatedAt: "2026-11-01T10:00:00.000Z",
    });
    expect(body.goals[0]).toEqual({ id: "g1", title: "Ship", description: "d", progress: 40 });
    expect(JSON.stringify(body)).not.toContain("userId");
  });
});

describe("PATCH /api/space access control", () => {
  it("requires a session", async () => {
    const { db } = makeDb();
    expect(
      (await patch(undefined, { resource: "notes", operation: "create", data: { title: "x" } }))
        .status
    ).toBe(401);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("rejects cross-origin writes", async () => {
    const { db } = makeDb();
    const response = await patch(
      member,
      { resource: "notes", operation: "create", data: { title: "x" } },
      { origin: "https://evil.example" }
    );
    expect(response.status).toBe(403);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    ["pending", "PENDING_APPROVAL", "ACCOUNT_PENDING"],
    ["suspended", "SUSPENDED", "ACCOUNT_NOT_ACTIVE"],
    ["disabled", "DISABLED", "ACCOUNT_NOT_ACTIVE"],
    ["rejected", "REJECTED", "ACCOUNT_NOT_ACTIVE"],
  ] as const)("denies %s accounts", async (_label, status, expected) => {
    const { db } = makeDb();
    const response = await patch(
      { ...member, status },
      { resource: "notes", operation: "create", data: { title: "x" } }
    );
    expect(response.status).toBe(403);
    expect(await code(response)).toBe(expected);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("denies a stale session when the persisted account is suspended", async () => {
    const { db } = makeDb();
    persisted(db, member, "SUSPENDED");
    const response = await patch(member, {
      resource: "notes",
      operation: "create",
      data: { title: "x" },
    });
    expect(response.status).toBe(403);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("denies a forged role: a cookie claiming ADMIN for a persisted MEMBER", async () => {
    const { db } = makeDb();
    persisted(db, member);
    const forged = { ...member, role: "ADMIN" as const };
    const response = await patch(forged, {
      resource: "notes",
      operation: "create",
      data: { title: "x" },
    });
    expect(response.status).toBe(403);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/space validation", () => {
  const todo = (data: Record<string, unknown>) => ({
    resource: "todos",
    operation: "create",
    data,
  });
  const cases: Array<[string, unknown]> = [
    [
      "a top-level userId",
      { resource: "notes", operation: "create", userId: "other", data: { title: "x" } },
    ],
    ["a userId inside data (todo)", todo({ title: "x", userId: "other" })],
    [
      "a userId inside data (note)",
      { resource: "notes", operation: "create", data: { title: "x", userId: "o" } },
    ],
    ["an unknown resource", { resource: "profile", operation: "create", data: { title: "x" } }],
    ["an unknown operation", { resource: "notes", operation: "pin", id: "n1" }],
    ["an id on create", { resource: "notes", operation: "create", id: "n1", data: { title: "x" } }],
    ["update without an id", { resource: "notes", operation: "update", data: { title: "x" } }],
    ["an empty id", { resource: "notes", operation: "update", id: "", data: { title: "x" } }],
    ["data on delete", { resource: "notes", operation: "delete", id: "n1", data: {} }],
    ["create without data", { resource: "notes", operation: "create" }],
    ["a todo without a title", todo({ description: "d" })],
    ["a blank title", todo({ title: "   " })],
    ["a 201 character title", todo({ title: "a".repeat(201) })],
    ["a 5001 character description", todo({ title: "x", description: "a".repeat(5001) })],
    ["an unknown difficulty", todo({ title: "x", difficulty: "Extreme" })],
    ["an inherited difficulty key", todo({ title: "x", difficulty: "constructor" })],
    ["an unknown priority", todo({ title: "x", priority: "Urgent" })],
    ["an impossible date", todo({ title: "x", dueDate: "2026-02-30" })],
    ["a non-ISO date", todo({ title: "x", dueDate: "tomorrow" })],
    ["a non-boolean completed", todo({ title: "x", completed: "yes" })],
    ["an empty taskId", todo({ title: "x", taskId: "" })],
    ["a numeric taskId", todo({ title: "x", taskId: 5 })],
    ["a NUL character in a title", todo({ title: "bad\u0000title" })],
    ["an unknown todo field", todo({ title: "x", owner: "me" })],
    ["an empty update", { resource: "todos", operation: "update", id: "t1", data: {} }],
    [
      "a 5001 character note",
      { resource: "notes", operation: "create", data: { title: "x", content: "a".repeat(5001) } },
    ],
    [
      "a goal progress of 101",
      { resource: "goals", operation: "create", data: { title: "x", progress: 101 } },
    ],
    [
      "a goal progress of -1",
      { resource: "goals", operation: "create", data: { title: "x", progress: -1 } },
    ],
    [
      "a fractional goal progress",
      { resource: "goals", operation: "create", data: { title: "x", progress: 1.5 } },
    ],
    [
      "a string goal progress",
      { resource: "goals", operation: "create", data: { title: "x", progress: "50" } },
    ],
    [
      "an unknown goal field",
      { resource: "goals", operation: "create", data: { title: "x", color: "red" } },
    ],
  ];
  it.each(cases)("rejects %s before touching the database", async (_label, body) => {
    const { db } = makeDb();
    persisted(db, member);
    const response = await patch(member, body);
    expect(response.status).toBe(400);
    expect(await code(response)).toBe("VALIDATION_ERROR");
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON or is too large", async () => {
    const { db } = makeDb();
    persisted(db, member);
    expect((await patch(member, undefined, { raw: "x=1", contentType: "text/plain" })).status).toBe(
      400
    );
    expect((await patch(member, undefined, { raw: "{ not json" })).status).toBe(400);
    const huge = JSON.stringify({
      resource: "notes",
      operation: "create",
      data: { title: "x", content: "a".repeat(33_000) },
    });
    expect((await patch(member, undefined, { raw: huge })).status).toBe(400);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("accepts values at the documented limits", async () => {
    const { db, tx } = makeDb();
    persisted(db, member);
    const response = await patch(member, {
      resource: "todos",
      operation: "create",
      data: { title: "a".repeat(200), description: "b".repeat(5000), dueDate: "" },
    });
    expect(response.status).toBe(200);
    expect(tx.todo.create).toHaveBeenCalledTimes(1);
    const goal = await patch(member, {
      resource: "goals",
      operation: "create",
      data: { title: "g", progress: 100 },
    });
    expect(goal.status).toBe(200);
    const zero = await patch(member, {
      resource: "goals",
      operation: "create",
      data: { title: "g", progress: 0 },
    });
    expect(zero.status).toBe(200);
  });
});

describe("PATCH /api/space owner scoping", () => {
  it("creates rows for the persisted account and trims the title", async () => {
    const { db, tx } = makeDb();
    persisted(db, member);
    const response = await patch(member, {
      resource: "todos",
      operation: "create",
      data: {
        title: "  Polish forms  ",
        difficulty: "Hard",
        priority: "High",
        dueDate: "2026-11-05",
        completed: false,
        taskId: null,
      },
    });
    expect(response.status).toBe(200);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.todo.count).toHaveBeenCalledWith({ where: { userId: member.id } });
    expect(tx.todo.create).toHaveBeenCalledWith({
      data: {
        userId: member.id,
        title: "Polish forms",
        difficulty: "HARD",
        priority: "HIGH",
        dueDate: new Date("2026-11-05T00:00:00.000Z"),
        completed: false,
        taskId: null,
      },
    });
    expect(db.todo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: member.id } })
    );
  });

  it.each([
    ["todos", "todo"],
    ["notes", "note"],
    ["goals", "goal"],
  ] as const)("refuses to create more than 100 %s", async (resource, table) => {
    const { db, tx } = makeDb();
    persisted(db, member);
    tx[table].count.mockResolvedValue(100);
    const response = await patch(member, {
      resource,
      operation: "create",
      data: { title: "one more" },
    });
    expect(response.status).toBe(400);
    expect(tx[table].count).toHaveBeenCalledWith({ where: { userId: member.id } });
    expect(tx[table].create).not.toHaveBeenCalled();
  });

  it("links only published tasks", async () => {
    const { db, tx } = makeDb();
    persisted(db, member);
    tx.task.findFirst.mockResolvedValueOnce(null);
    const refused = await patch(member, {
      resource: "todos",
      operation: "create",
      data: { title: "x", taskId: "draft-task" },
    });
    expect(refused.status).toBe(400);
    expect(tx.task.findFirst).toHaveBeenCalledWith({
      where: { id: "draft-task", lifecycle: "PUBLISHED" },
      select: { id: true },
    });
    expect(tx.todo.create).not.toHaveBeenCalled();

    const accepted = await patch(member, {
      resource: "todos",
      operation: "update",
      id: "t1",
      data: { taskId: "task-1" },
    });
    expect(accepted.status).toBe(200);
    expect(tx.todo.updateMany).toHaveBeenCalledWith({
      where: { id: "t1", userId: member.id },
      data: { taskId: "task-1" },
    });
  });

  it("clears a task link without looking the task up", async () => {
    const { db, tx } = makeDb();
    persisted(db, member);
    const response = await patch(member, {
      resource: "todos",
      operation: "update",
      id: "t1",
      data: { taskId: null },
    });
    expect(response.status).toBe(200);
    expect(tx.task.findFirst).not.toHaveBeenCalled();
    expect(tx.todo.updateMany).toHaveBeenCalledWith({
      where: { id: "t1", userId: member.id },
      data: { taskId: null },
    });
  });

  it.each([
    ["todos", "todo", { completed: true }],
    ["notes", "note", { content: "changed" }],
    ["goals", "goal", { progress: 60 }],
  ] as const)("updates %s only inside the caller's own rows", async (resource, table, data) => {
    const { db, tx } = makeDb();
    persisted(db, member);
    const response = await patch(member, { resource, operation: "update", id: "item-1", data });
    expect(response.status).toBe(200);
    expect(tx[table].updateMany).toHaveBeenCalledWith({
      where: { id: "item-1", userId: member.id },
      data,
    });
  });

  it.each([
    ["todos", "todo"],
    ["notes", "note"],
    ["goals", "goal"],
  ] as const)(
    "returns 404 when another member's %s id is updated or deleted",
    async (resource, table) => {
      const { db, tx } = makeDb();
      persisted(db, member);
      tx[table].updateMany.mockResolvedValue({ count: 0 });
      tx[table].deleteMany.mockResolvedValue({ count: 0 });
      const update = await patch(member, {
        resource,
        operation: "update",
        id: "foreign-1",
        data: { title: "hijack" },
      });
      expect(update.status).toBe(404);
      const removal = await patch(member, { resource, operation: "delete", id: "foreign-1" });
      expect(removal.status).toBe(404);
      expect(tx[table].updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "foreign-1", userId: member.id } })
      );
      expect(tx[table].deleteMany).toHaveBeenCalledWith({
        where: { id: "foreign-1", userId: member.id },
      });
    }
  );

  it("gives an ADMIN no access to a member's items: queries are scoped to the admin's own id", async () => {
    const { db, tx } = makeDb();
    persisted(db, admin);
    tx.todo.updateMany.mockResolvedValue({ count: 0 });
    tx.note.deleteMany.mockResolvedValue({ count: 0 });
    const update = await patch(admin, {
      resource: "todos",
      operation: "update",
      id: "members-todo",
      data: { title: "admin edit" },
    });
    const removal = await patch(admin, {
      resource: "notes",
      operation: "delete",
      id: "members-note",
    });
    expect(update.status).toBe(404);
    expect(removal.status).toBe(404);
    expect(tx.todo.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "members-todo", userId: admin.id } })
    );
    expect(tx.note.deleteMany).toHaveBeenCalledWith({
      where: { id: "members-note", userId: admin.id },
    });
    // Nothing in the transaction was ever queried without the caller's id.
    for (const call of [...tx.todo.count.mock.calls, ...tx.note.count.mock.calls])
      expect(call[0]).toEqual({ where: { userId: admin.id } });
  });

  it("deletes inside the caller's own rows and returns the refreshed space", async () => {
    const { db, tx } = makeDb();
    persisted(db, member);
    const response = await patch(member, { resource: "todos", operation: "delete", id: "t1" });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(tx.todo.deleteMany).toHaveBeenCalledWith({ where: { id: "t1", userId: member.id } });
    expect(await response.json()).toEqual({ todos: [], notes: [], goals: [] });
  });

  it("reports an unexpected database failure without leaking details", async () => {
    const { db } = makeDb();
    persisted(db, member);
    db.$transaction.mockRejectedValueOnce(new Error("connection string leaked here"));
    const response = await patch(member, {
      resource: "notes",
      operation: "create",
      data: { title: "x" },
    });
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("leaked");
  });
});
