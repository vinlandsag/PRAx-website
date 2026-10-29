import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET, PATCH } from "@/app/api/workspace/route";
import { authStore } from "@/lib/db/auth-store";
import { signSession } from "@/lib/auth/session";
import { listAuditEvents, resetAuditLog } from "@/lib/audit/audit";
import type { SessionUser } from "@/lib/auth/types";
import type { WorkspaceData } from "./types";
import { workspaceStore } from "./store";
import { filterTasks, filterTodos, rankBuilders, searchWorkspace } from "./filter";

let member: SessionUser, admin: SessionUser, other: SessionUser;
beforeAll(async () => {
  await authStore.initDefaultSeed();
  member = (await authStore.findUserById("usr_member_01"))!;
  admin = (await authStore.findUserById("usr_admin_01"))!;
  other = await authStore.createUser({
    email: "workspace-test@example.test",
    name: "Other builder",
    passwordHash: null,
    status: "APPROVED",
  });
});
beforeEach(() => {
  workspaceStore.reset();
  resetAuditLog();
});
function request(user: SessionUser | undefined, body?: unknown, query = "", origin?: string) {
  return new Request(`http://localhost/api/workspace${query}`, {
    method: body === undefined ? "GET" : "PATCH",
    headers: {
      ...(user ? { cookie: `prax_session=${signSession(user)}` } : {}),
      ...(origin ? { origin } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function save(
  user: SessionUser,
  resource: string,
  operation: string,
  data: unknown = {},
  id?: string
) {
  return PATCH(request(user, { resource, operation, data, id }));
}
async function read(user = member): Promise<WorkspaceData> {
  return (await GET(request(user))).json();
}

describe("workspace authenticated API", () => {
  it("audits successful chat moderation without recording message text", async () => {
    await save(member, "messages", "create", { content: "Do not log this text" });
    const message = (await read()).messages.at(-1)!;
    await save(member, "messages", "pin", {}, message.id);
    expect(listAuditEvents().total).toBe(0);
    await save(admin, "messages", "pin", {}, message.id);
    await save(admin, "messages", "delete", {}, message.id);
    const events = listAuditEvents().events;
    expect(events.map((e) => e.event)).toEqual(["CHAT_MESSAGE_DELETED", "CHAT_MESSAGE_PINNED"]);
    expect(events[0]).toMatchObject({
      actorId: admin.id,
      targetId: message.id,
      metadata: { authorId: member.id },
    });
    expect(JSON.stringify(events)).not.toContain("Do not log this text");
  });
  it("accepts the browser-facing host when Next normalizes its internal request URL", async () => {
    const req = new Request("http://localhost:3000/api/workspace", {
      method: "PATCH",
      headers: {
        cookie: `prax_session=${signSession(member)}`,
        host: "127.0.0.1:3000",
        origin: "http://127.0.0.1:3000",
      },
      body: JSON.stringify({ resource: "settings", operation: "update", data: { theme: "dark" } }),
    });
    expect((await PATCH(req)).status).toBe(200);
  });
  it("blocks visitors, pending accounts and deleted accounts", async () => {
    expect((await GET(request(undefined))).status).toBe(401);
    expect((await GET(request({ ...member, status: "PENDING_APPROVAL" }))).status).toBe(403);
    expect((await GET(request({ ...member, id: "missing" }))).status).toBe(401);
  });
  it("checks current account status even with a previously approved token", async () => {
    await authStore.updateUser(other.id, { status: "SUSPENDED" });
    expect((await GET(request(other))).status).toBe(403);
    await authStore.updateUser(other.id, { status: "APPROVED" });
  });
  it("rejects cross-origin writes", async () => {
    expect(
      (
        await PATCH(
          request(
            member,
            { resource: "settings", operation: "update", data: { theme: "dark" } },
            "",
            "https://other.test"
          )
        )
      ).status
    ).toBe(403);
  });
  it("saves full to-do details and partial completion updates across GET requests", async () => {
    const response = await save(member, "todos", "create", {
      title: "Ship UI",
      description: "Polish forms",
      difficulty: "Hard",
      priority: "High",
      dueDate: "2026-11-03",
    });
    expect(response.status).toBe(200);
    const todo = (await response.json()).todos[0];
    expect(todo).toMatchObject({
      title: "Ship UI",
      difficulty: "Hard",
      priority: "High",
      completed: false,
    });
    await save(member, "todos", "update", { completed: true }, todo.id);
    expect((await read()).todos[0]).toMatchObject({
      id: todo.id,
      completed: true,
      description: "Polish forms",
      dueDate: "2026-11-03",
    });
    expect((await save(member, "todos", "delete", {}, todo.id)).status).toBe(200);
    expect((await read()).todos.some((t) => t.id === todo.id)).toBe(false);
  });
  it("isolates private data and refuses foreign ids even for admins", async () => {
    await save(member, "notes", "create", { title: "Private research", content: "Only mine" });
    const note = (await read()).notes[0];
    expect((await read(other)).notes.some((n) => n.id === note.id)).toBe(false);
    expect((await save(other, "notes", "update", { title: "Stolen" }, note.id)).status).toBe(404);
    expect((await save(admin, "notes", "delete", {}, note.id)).status).toBe(404);
    expect(
      (await save(member, "todos", "create", { title: "Forged", ownerId: other.id })).status
    ).toBe(400);
  });
  it.each([
    { difficulty: "Impossible" },
    { priority: "Urgent" },
    { dueDate: "2026-02-30" },
    { completed: "yes" },
    { title: "" },
  ])("rejects invalid to-do fields %j", async (fields) => {
    expect((await save(member, "todos", "create", { title: "Valid", ...fields })).status).toBe(400);
  });
  it("creates, edits and removes notes and goals without changing identity or points", async () => {
    await save(member, "notes", "create", { title: "Idea", content: "Body" });
    let d = await read();
    await save(member, "notes", "update", { content: "Revised" }, d.notes[0].id);
    expect((await read()).notes[0].content).toBe("Revised");
    await save(member, "goals", "create", {
      title: "Ship",
      description: "Three projects",
      progress: 25,
    });
    d = await read();
    await save(member, "goals", "update", { progress: 100 }, d.goals[0].id);
    expect((await read()).goals[0].progress).toBe(100);
    expect((await save(member, "goals", "update", { progress: 101 }, d.goals[0].id)).status).toBe(
      400
    );
    await save(member, "notes", "delete", {}, d.notes[0].id);
    await save(member, "goals", "delete", {}, d.goals[0].id);
    expect((await read()).user.id).toBe(member.id);
  });
  it("saves profile and settings and limits public reads to shared fields", async () => {
    await save(member, "profile", "update", {
      name: "New name",
      skills: ["React", "Accessibility"],
      currentProject: "Toolkit",
      portfolioUrl: "https://example.test",
    });
    await save(member, "settings", "update", {
      theme: "dark",
      showPortfolio: false,
      chatNotifications: true,
    });
    const d = await read();
    expect(d.profile.name).toBe("New name");
    expect(d.settings).toMatchObject({
      theme: "dark",
      showPortfolio: false,
      chatNotifications: true,
    });
    const pub = await (await GET(request(other, undefined, `?memberId=${member.id}`))).json();
    expect(pub.profile.portfolioUrl).toBe("");
    expect(pub.todos).toBeUndefined();
    expect(pub.settings).toBeUndefined();
    await save(member, "settings", "update", { showPortfolio: true });
    expect(
      (await (await GET(request(other, undefined, `?memberId=${member.id}`))).json()).profile
        .portfolioUrl
    ).toBe("https://example.test");
  });
  it("rejects unsafe links, oversized skills and privilege changes atomically", async () => {
    expect(
      (
        await save(member, "profile", "update", {
          name: "Changed",
          portfolioUrl: "javascript:alert(1)",
        })
      ).status
    ).toBe(400);
    expect((await read()).profile.name).toBe(member.name);
    expect(
      (await save(member, "profile", "update", { skills: Array(16).fill("Skill") })).status
    ).toBe(400);
    expect((await save(member, "settings", "update", { role: "ADMIN" })).status).toBe(400);
    expect((await save(member, "settings", "update", { theme: "invalid" })).status).toBe(400);
  });
  it("enforces author editing, author/admin deletion and admin-only pinning", async () => {
    await save(member, "messages", "create", { content: "My update" });
    const message = (await read()).messages.at(-1)!;
    expect(
      (await save(other, "messages", "update", { content: "Hijack" }, message.id)).status
    ).toBe(403);
    expect((await save(other, "messages", "delete", {}, message.id)).status).toBe(403);
    expect((await save(member, "messages", "pin", {}, message.id)).status).toBe(403);
    expect((await save(admin, "messages", "pin", {}, message.id)).status).toBe(200);
    expect((await read()).messages.at(-1)?.pinned).toBe(true);
    expect(
      (await save(member, "messages", "update", { content: "Edited update" }, message.id)).status
    ).toBe(200);
    expect((await read()).messages.at(-1)).toMatchObject({
      content: "Edited update",
      edited: true,
    });
    expect((await save(admin, "messages", "delete", {}, message.id)).status).toBe(200);
    expect((await read()).messages.some((m) => m.id === message.id)).toBe(false);
  });
  it("rejects malformed requests and excessive message content", async () => {
    expect(
      (
        await PATCH(
          new Request("http://localhost/api/workspace", {
            method: "PATCH",
            headers: { cookie: `prax_session=${signSession(member)}` },
            body: "{",
          })
        )
      ).status
    ).toBe(400);
    expect((await save(member, "messages", "create", { content: "x".repeat(501) })).status).toBe(
      400
    );
    expect((await save(member, "messages", "create", { content: " " })).status).toBe(400);
    expect((await save(member, "unknown", "update", {})).status).toBe(400);
  });
});

describe("search, filters and rankings", () => {
  it("combines task search/category/status and sorts matches", () => {
    expect(filterTasks("secure", "Backend", "approved", "newest").map((t) => t.id)).toEqual(["3"]);
    expect(filterTasks("", "all", "all", "points")[0].id).toBe("6");
    expect(filterTasks("", "all", "open", "deadline").map((t) => t.id)).toEqual(["2", "1", "5"]);
    expect(filterTasks("nothing matches", "all", "all", "newest")).toEqual([]);
    expect(filterTasks("", "UI/UX Design", "submitted", "newest")[0].id).toBe("4");
  });
  it("combines personal filters including overdue, upcoming, completion and difficulty", async () => {
    const base = (await read()).todos[0];
    const items = [
      { ...base, id: "past", dueDate: "2026-10-27", difficulty: "Hard" as const },
      { ...base, id: "future", dueDate: "2026-11-01" },
      { ...base, id: "done", completed: true },
      { ...base, id: "no-date", dueDate: "" },
    ];
    expect(filterTodos(items, "today", "Hard", "project", "2026-10-29").map((t) => t.id)).toEqual([
      "past",
    ]);
    expect(filterTodos(items, "upcoming", "all", "", "2026-10-29").map((t) => t.id)).toEqual([
      "future",
    ]);
    expect(filterTodos(items, "done", "all", "", "2026-10-29").map((t) => t.id)).toEqual(["done"]);
    expect(filterTodos(items, "all", "all", "", "2026-10-29")).toHaveLength(4);
  });
  it("searches pages, tasks and only the supplied user's private content", async () => {
    await save(member, "notes", "create", { title: "Secret blueprint", content: "Research" });
    expect(searchWorkspace("blueprint", await read())).toHaveLength(1);
    expect(searchWorkspace("blueprint", await read(other))).toHaveLength(0);
    expect(searchWorkspace("SQL", null)[0].href).toBe("/tasks/1");
    expect(searchWorkspace("settings", null)[0].href).toBe("/settings");
    expect(searchWorkspace("member management", await read())).toEqual([]);
    expect(searchWorkspace("member management", await read(admin))[0].href).toBe("/admin/members");
    expect(searchWorkspace(" ", null)).toEqual([]);
  });
  it("changes scores, podium order and own rank between periods", () => {
    const weekly = rankBuilders("weekly"),
      all = rankBuilders("alltime");
    expect(weekly[0].name).toBe("Kabir Nair");
    expect(all[0].name).toBe("Meera Shah");
    expect(weekly.find((b) => b.id === member.id)).toMatchObject({ rank: 7, points: 185 });
    expect(all.find((b) => b.id === member.id)).toMatchObject({ rank: 5, points: 1240 });
    expect(all.every((b, i) => i === 0 || all[i - 1].points >= b.points)).toBe(true);
  });
});
