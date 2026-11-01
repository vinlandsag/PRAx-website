import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { GET as listMessages, POST as postMessage } from "./messages/route";
import { DELETE as removeMessage, PATCH as editMessage } from "./messages/[id]/route";
import { POST as pinMessage } from "./messages/[id]/pin/route";
import { POST as reactToMessage } from "./messages/[id]/reactions/route";
import { POST as acceptRules } from "./rules/accept/route";

// Mocked Prisma: these tests prove authorization, validation and the queries each route builds.
// Real-database proof is in chat.integration.test.ts (written, not run in this environment).
const mock = vi.hoisted(() => ({ getPrismaClient: vi.fn() }));
vi.mock("@/lib/db/prisma", () => mock);

const secret = "chat-route-test-secret-longer-than-thirty-two-characters";
const member: SessionUser = {
  id: "chat-member-1",
  name: "Member One",
  email: "member1@example.test",
  role: "MEMBER",
  status: "APPROVED",
};
const admin: SessionUser = {
  id: "chat-admin-1",
  name: "Admin One",
  email: "admin1@example.test",
  role: "ADMIN",
  status: "APPROVED",
};
const T = (iso: string) => new Date(iso);

function makeDb() {
  const db = {
    user: { findUnique: vi.fn() },
    chatMessage: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockResolvedValue({}),
    },
    userPreferences: {
      findUnique: vi.fn().mockResolvedValue({ chatRulesAcceptedAt: T("2026-11-01T09:00:00Z") }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({}),
    },
    messageReaction: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn(async (fn: (t: unknown) => unknown) => fn(db)),
  };
  mock.getPrismaClient.mockReturnValue(db);
  return db;
}
type Db = ReturnType<typeof makeDb>;
const persisted = (db: Db, user: SessionUser, status = "APPROVED") =>
  db.user.findUnique.mockResolvedValue({ id: user.id, name: user.name, role: user.role, status });

const row = (id: string, createdAt: string, extra: Record<string, unknown> = {}) => ({
  id,
  authorId: "author-1",
  content: `message ${id}`,
  pinned: false,
  editedAt: null,
  deletedAt: null,
  createdAt: T(createdAt),
  updatedAt: T(createdAt),
  author: { name: "Ada", avatarUrl: "https://example.test/ada.png" },
  reactions: [],
  ...extra,
});

function request(
  method: string,
  path: string,
  user?: SessionUser,
  body?: unknown,
  init: { origin?: string; contentType?: string; raw?: string } = {}
) {
  const headers: Record<string, string> = {};
  if (user) headers.cookie = `prax_session=${signSession(user)}`;
  const hasBody = body !== undefined || init.raw !== undefined;
  if (hasBody) headers["content-type"] = init.contentType ?? "application/json";
  if (method !== "GET") headers.origin = init.origin ?? "http://localhost";
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    ...(hasBody ? { body: init.raw ?? JSON.stringify(body) } : {}),
  });
}
const withId = (id: string) => ({ params: Promise.resolve({ id }) });
const get = (path: string, user?: SessionUser) =>
  listMessages(request("GET", `/api/chat/messages${path}`, user));
const post = (user: SessionUser | undefined, body: unknown, init = {}) =>
  postMessage(request("POST", "/api/chat/messages", user, body, init));
const code = async (response: Response) => (await response.json()).error?.code;

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", secret);
  vi.stubEnv("NODE_ENV", "test");
  mock.getPrismaClient.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe("chat access control (every route)", () => {
  const routes: Array<[string, (user?: SessionUser, extra?: SessionUser) => Promise<Response>]> = [
    ["GET messages", (u) => get("", u)],
    ["POST messages", (u) => post(u, { content: "hi" })],
    [
      "PATCH message",
      (u) =>
        editMessage(request("PATCH", "/api/chat/messages/m1", u, { content: "x" }), withId("m1")),
    ],
    [
      "DELETE message",
      (u) => removeMessage(request("DELETE", "/api/chat/messages/m1", u), withId("m1")),
    ],
    [
      "POST reaction",
      (u) =>
        reactToMessage(
          request("POST", "/api/chat/messages/m1/reactions", u, { emoji: "🎉" }),
          withId("m1")
        ),
    ],
    ["POST rules accept", (u) => acceptRules(request("POST", "/api/chat/rules/accept", u, {}))],
  ];
  it.each(routes)("%s: anonymous callers get 401", async (_name, call) => {
    const db = makeDb();
    expect((await call(undefined)).status).toBe(401);
    expect(db.chatMessage.findMany).not.toHaveBeenCalled();
    expect(db.chatMessage.create).not.toHaveBeenCalled();
  });
  it.each(routes)(
    "%s: pending and inactive accounts are refused before any query",
    async (_name, call) => {
      const db = makeDb();
      const pending = await call({ ...member, status: "PENDING_APPROVAL" });
      expect(pending.status).toBe(403);
      expect(await code(pending)).toBe("ACCOUNT_PENDING");
      const suspended = await call({ ...member, status: "SUSPENDED" });
      expect(suspended.status).toBe(403);
      expect(await code(suspended)).toBe("ACCOUNT_NOT_ACTIVE");
      expect(mock.getPrismaClient).not.toHaveBeenCalled();
      expect(db.chatMessage.findMany).not.toHaveBeenCalled();
    }
  );
  it.each(routes)(
    "%s: a stale cookie for a now-suspended account is refused",
    async (_name, call) => {
      const db = makeDb();
      persisted(db, member, "SUSPENDED");
      const response = await call(member);
      expect(response.status).toBe(403);
      expect(db.chatMessage.findMany).not.toHaveBeenCalled();
      expect(db.chatMessage.create).not.toHaveBeenCalled();
      expect(db.chatMessage.updateMany).not.toHaveBeenCalled();
      expect(db.messageReaction.create).not.toHaveBeenCalled();
    }
  );
});

describe("GET /api/chat/messages", () => {
  it.each([
    ["limit=0"],
    ["limit=51"],
    ["limit=abc"],
    ["limit=1&limit=2"],
    ["before=a&after=b"],
    ["after=a&updatedSince=yesterday"],
    ["updatedSince=2026-11-01T10:00:00.000Z"],
    ["before=bad%20cursor"],
    ["after=" + "a".repeat(65)],
  ])("rejects the query %s", async (query) => {
    const db = makeDb();
    persisted(db, member);
    const response = await get(`?${query}`, member);
    expect(response.status).toBe(400);
    expect(await code(response)).toBe("VALIDATION_ERROR");
    expect(db.chatMessage.findMany).not.toHaveBeenCalled();
  });

  it("returns the latest page oldest-first with paging info, viewer and rule state", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.findMany.mockImplementation(async (args: { where: Record<string, unknown> }) =>
      args.where.pinned
        ? [row("pinned-1", "2026-11-01T08:00:00Z", { pinned: true })]
        : [
            row("m3", "2026-11-01T10:03:00Z"),
            row("m2", "2026-11-01T10:02:00Z"),
            row("m1", "2026-11-01T10:01:00Z"),
          ]
    );
    const response = await get("?limit=2", member);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const feed = await response.json();
    expect(feed.messages.map((m: { id: string }) => m.id)).toEqual(["m2", "m3"]);
    expect(feed).toMatchObject({
      hasMore: true,
      nextBefore: "m2",
      rulesAccepted: true,
      viewer: { id: member.id, role: "MEMBER" },
      updates: [],
      pinned: [{ id: "pinned-1", pinned: true }],
    });
    expect(new Date(feed.serverTime).toISOString()).toBe(feed.serverTime);
    expect(feed.messages[0]).toMatchObject({
      author: "Ada",
      authorAvatarUrl: "https://example.test/ada.png",
      edited: false,
    });
    const listCall = db.chatMessage.findMany.mock.calls.find((c) => !c[0].where.pinned)![0];
    expect(listCall.where).toEqual({ deletedAt: null });
    expect(listCall.take).toBe(3);
  });

  it("reports rulesAccepted false when the member has not accepted", async () => {
    const db = makeDb();
    persisted(db, member);
    db.userPreferences.findUnique.mockResolvedValue(null);
    expect((await (await get("", member)).json()).rulesAccepted).toBe(false);
  });

  it("aggregates reactions in palette order, marks the viewer's own, and never exposes reactors", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.findMany.mockImplementation(async (args: { where: Record<string, unknown> }) =>
      args.where.pinned
        ? []
        : [
            row("m1", "2026-11-01T10:01:00Z", {
              reactions: [
                { emoji: "🎉", userId: member.id },
                { emoji: "🎉", userId: "someone-secret" },
                { emoji: "👍", userId: "someone-secret" },
                { emoji: "💩", userId: "someone-secret" },
              ],
            }),
          ]
    );
    const text = await (await get("", member)).text();
    const feed = JSON.parse(text);
    expect(feed.messages[0].reactions).toEqual([
      { emoji: "👍", count: 1, reacted: false },
      { emoji: "🎉", count: 2, reacted: true },
    ]);
    expect(text).not.toContain("someone-secret");
  });

  it("pages backwards with the before cursor and rejects an unknown cursor", async () => {
    const db = makeDb();
    persisted(db, member);
    const cursor = { id: "m5", createdAt: T("2026-11-01T10:05:00Z") };
    db.chatMessage.findUnique.mockResolvedValueOnce(cursor);
    await get("?before=m5", member);
    const call = db.chatMessage.findMany.mock.calls.find((c) => !c[0].where.pinned)![0];
    expect(call.where).toEqual({
      deletedAt: null,
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: "m5" } },
      ],
    });
    expect(call.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);

    db.chatMessage.findUnique.mockResolvedValueOnce(null);
    const missing = await get("?before=nope", member);
    expect(missing.status).toBe(400);
  });

  it("polls forward with the after cursor and returns changes plus removal tombstones", async () => {
    const db = makeDb();
    persisted(db, member);
    const cursor = { id: "m2", createdAt: T("2026-11-01T10:02:00Z") };
    db.chatMessage.findUnique.mockResolvedValue(cursor);
    db.chatMessage.findMany.mockImplementation(async (args: { where: Record<string, unknown> }) => {
      if (args.where.pinned) return [];
      if (args.where.updatedAt)
        return [
          row("m1", "2026-11-01T10:01:00Z", {
            content: "edited",
            editedAt: T("2026-11-01T10:06:00Z"),
          }),
          row("gone", "2026-11-01T10:00:00Z", {
            deletedAt: T("2026-11-01T10:06:00Z"),
            content: "secret text",
          }),
        ];
      return [row("m3", "2026-11-01T10:03:00Z")];
    });
    const since = "2026-11-01T10:05:58.000Z";
    const text = await (await get(`?after=m2&updatedSince=${since}`, member)).text();
    const feed = JSON.parse(text);
    expect(feed.messages.map((m: { id: string }) => m.id)).toEqual(["m3"]);
    expect(feed.updates).toEqual([
      expect.objectContaining({ id: "m1", content: "edited", edited: true }),
      { id: "gone", deleted: true },
    ]);
    expect(text).not.toContain("secret text");
    const forward = db.chatMessage.findMany.mock.calls.find(
      (c) => !c[0].where.pinned && !c[0].where.updatedAt
    )![0];
    expect(forward.where).toEqual({
      deletedAt: null,
      OR: [
        { createdAt: { gt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { gt: "m2" } },
      ],
    });
    expect(forward.orderBy).toEqual([{ createdAt: "asc" }, { id: "asc" }]);
    const changes = db.chatMessage.findMany.mock.calls.find((c) => c[0].where.updatedAt)![0];
    expect(changes.where.updatedAt).toEqual({ gt: new Date(since) });
    expect(changes.where.OR).toEqual([
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lte: "m2" } },
    ]);
  });

  it("asks the client to resync when too many messages changed", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.findUnique.mockResolvedValue({ id: "m2", createdAt: T("2026-11-01T10:02:00Z") });
    db.chatMessage.findMany.mockImplementation(async (args: { where: Record<string, unknown> }) =>
      args.where.updatedAt
        ? Array.from({ length: 101 }, (_, i) => row(`c${i}`, "2026-11-01T10:00:00Z"))
        : []
    );
    const feed = await (
      await get("?after=m2&updatedSince=2026-11-01T10:05:58.000Z", member)
    ).json();
    expect(feed.resync).toBe(true);
    expect(feed.updates).toEqual([]);
  });

  it("returns 503 when the database is not configured", async () => {
    mock.getPrismaClient.mockReturnValue(null);
    expect((await get("", member)).status).toBe(503);
  });
});

describe("POST /api/chat/messages", () => {
  it("rejects cross-origin posts", async () => {
    const db = makeDb();
    const response = await post(member, { content: "hi" }, { origin: "https://evil.example" });
    expect(response.status).toBe(403);
    expect(db.chatMessage.create).not.toHaveBeenCalled();
  });

  it("refuses to post until the community rules are accepted", async () => {
    const db = makeDb();
    persisted(db, member);
    db.userPreferences.findUnique.mockResolvedValue(null);
    const none = await post(member, { content: "hi" });
    expect(none.status).toBe(403);
    expect(await code(none)).toBe("CHAT_RULES_NOT_ACCEPTED");
    db.userPreferences.findUnique.mockResolvedValue({ chatRulesAcceptedAt: null });
    const unset = await post(member, { content: "hi" });
    expect(await code(unset)).toBe("CHAT_RULES_NOT_ACCEPTED");
    expect(db.chatMessage.create).not.toHaveBeenCalled();
  });

  it("saves a trimmed message for the persisted account", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.create.mockImplementation(
      async (args: { data: { authorId: string; content: string } }) =>
        row("new-1", "2026-11-01T11:00:00Z", {
          authorId: args.data.authorId,
          content: args.data.content,
        })
    );
    const response = await post(member, { content: "  hello team  " });
    expect(response.status).toBe(201);
    expect(db.chatMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { authorId: member.id, content: "hello team" } })
    );
    expect((await response.json()).message).toMatchObject({
      id: "new-1",
      content: "hello team",
      pinned: false,
      reactions: [],
    });
  });

  it.each([
    ["a client-supplied authorId", { content: "hi", authorId: "someone-else" }],
    ["a blank message", { content: "   " }],
    ["a missing message", {}],
    ["a non-string message", { content: 5 }],
    ["a 501 character message", { content: "a".repeat(501) }],
    ["a NUL character", { content: "bad\u0000" }],
    ["attachments (not built yet)", { content: "hi", attachmentIds: ["a1"] }],
    ["a non-array attachment list", { content: "hi", attachmentIds: "a1" }],
  ])("rejects %s", async (_label, body) => {
    const db = makeDb();
    persisted(db, member);
    const response = await post(member, body);
    expect(response.status).toBe(400);
    expect(db.chatMessage.create).not.toHaveBeenCalled();
  });

  it("accepts exactly 500 characters and an empty attachment list", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.create.mockResolvedValue(row("new-2", "2026-11-01T11:00:00Z"));
    expect((await post(member, { content: "a".repeat(500), attachmentIds: [] })).status).toBe(201);
  });
});

describe("PATCH /api/chat/messages/[id]", () => {
  const edit = (user: SessionUser | undefined, body: unknown, id = "m1") =>
    editMessage(request("PATCH", `/api/chat/messages/${id}`, user, body), withId(id));

  it("lets the author edit and records the edit time", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.findFirst.mockResolvedValueOnce({ authorId: member.id }).mockResolvedValueOnce(
      row("m1", "2026-11-01T10:00:00Z", {
        authorId: member.id,
        content: "better",
        editedAt: T("2026-11-01T10:05:00Z"),
      })
    );
    const response = await edit(member, { content: " better " });
    expect(response.status).toBe(200);
    expect(db.chatMessage.updateMany).toHaveBeenCalledWith({
      where: { id: "m1", authorId: member.id, deletedAt: null },
      data: { content: "better", editedAt: expect.any(Date), updatedAt: expect.any(Date) },
    });
    expect((await response.json()).message).toMatchObject({ content: "better", edited: true });
  });

  it("forbids editing someone else's message, even for an admin", async () => {
    const db = makeDb();
    db.chatMessage.findFirst.mockResolvedValue({ authorId: "author-1" });
    persisted(db, member);
    expect((await edit(member, { content: "x" })).status).toBe(403);
    persisted(db, admin);
    expect((await edit(admin, { content: "x" })).status).toBe(403);
    expect(db.chatMessage.updateMany).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing or deleted message", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.findFirst.mockResolvedValue(null);
    expect((await edit(member, { content: "x" })).status).toBe(404);
    expect(db.chatMessage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "m1", deletedAt: null } })
    );
  });

  it.each([
    ["blank", { content: " " }],
    ["extra field", { content: "x", pinned: true }],
    ["too long", { content: "a".repeat(501) }],
  ])("rejects a %s edit", async (_label, body) => {
    const db = makeDb();
    persisted(db, member);
    expect((await edit(member, body)).status).toBe(400);
    expect(db.chatMessage.updateMany).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/chat/messages/[id]", () => {
  const remove = (user: SessionUser, id = "m1") =>
    removeMessage(request("DELETE", `/api/chat/messages/${id}`, user), withId(id));

  it("soft-deletes the author's own message", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.findFirst.mockResolvedValue({ authorId: member.id });
    const response = await remove(member);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(db.chatMessage.updateMany).toHaveBeenCalledWith({
      where: { id: "m1", deletedAt: null, authorId: member.id },
      data: { deletedAt: expect.any(Date), updatedAt: expect.any(Date) },
    });
  });

  it("forbids a member from deleting someone else's message", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.findFirst.mockResolvedValue({ authorId: "author-1" });
    expect((await remove(member)).status).toBe(403);
    expect(db.chatMessage.updateMany).not.toHaveBeenCalled();
  });

  it("lets a persisted admin remove any message", async () => {
    const db = makeDb();
    persisted(db, admin);
    db.chatMessage.findFirst.mockResolvedValue({ authorId: "author-1" });
    expect((await remove(admin)).status).toBe(204);
    expect(db.chatMessage.updateMany).toHaveBeenCalledWith({
      where: { id: "m1", deletedAt: null },
      data: { deletedAt: expect.any(Date), updatedAt: expect.any(Date) },
    });
  });

  it("does not trust an ADMIN cookie when the persisted role is MEMBER", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.findFirst.mockResolvedValue({ authorId: "author-1" });
    expect((await remove({ ...member, role: "ADMIN" })).status).toBe(403);
    expect(db.chatMessage.updateMany).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing or already deleted message", async () => {
    const db = makeDb();
    persisted(db, admin);
    expect((await remove(admin)).status).toBe(404);
  });
});

describe("POST /api/chat/messages/[id]/pin", () => {
  const pin = (user: SessionUser, body: unknown, id = "m1") =>
    pinMessage(request("POST", `/api/chat/messages/${id}/pin`, user, body), withId(id));

  it("is reserved for admins: a member is refused before any query", async () => {
    const db = makeDb();
    persisted(db, member);
    const response = await pin(member, { pinned: true });
    expect(response.status).toBe(403);
    expect(mock.getPrismaClient).not.toHaveBeenCalled();
    expect(db.chatMessage.updateMany).not.toHaveBeenCalled();
  });

  it("does not trust an ADMIN cookie when the persisted role is MEMBER", async () => {
    const db = makeDb();
    persisted(db, member);
    expect((await pin({ ...member, role: "ADMIN" }, { pinned: true })).status).toBe(403);
    expect(db.chatMessage.updateMany).not.toHaveBeenCalled();
  });

  it("pins and unpins for a persisted admin", async () => {
    const db = makeDb();
    persisted(db, admin);
    db.chatMessage.findFirst.mockResolvedValue(row("m1", "2026-11-01T10:00:00Z", { pinned: true }));
    const response = await pin(admin, { pinned: true });
    expect(response.status).toBe(200);
    expect(db.chatMessage.updateMany).toHaveBeenCalledWith({
      where: { id: "m1", deletedAt: null },
      data: { pinned: true, updatedAt: expect.any(Date) },
    });
    expect((await response.json()).message.pinned).toBe(true);
    db.chatMessage.findFirst.mockResolvedValue(row("m1", "2026-11-01T10:00:00Z"));
    await pin(admin, { pinned: false });
    expect(db.chatMessage.updateMany).toHaveBeenLastCalledWith({
      where: { id: "m1", deletedAt: null },
      data: { pinned: false, updatedAt: expect.any(Date) },
    });
  });

  it.each([
    ["non-boolean", { pinned: "yes" }],
    ["missing", {}],
    ["extra field", { pinned: true, x: 1 }],
  ])("rejects a %s body", async (_label, body) => {
    const db = makeDb();
    persisted(db, admin);
    expect((await pin(admin, body)).status).toBe(400);
    expect(db.chatMessage.updateMany).not.toHaveBeenCalled();
  });

  it("returns 404 when the message does not exist or is deleted", async () => {
    const db = makeDb();
    persisted(db, admin);
    db.chatMessage.updateMany.mockResolvedValue({ count: 0 });
    expect((await pin(admin, { pinned: true })).status).toBe(404);
  });
});

describe("POST /api/chat/messages/[id]/reactions", () => {
  const react = (user: SessionUser, body: unknown, id = "m1") =>
    reactToMessage(request("POST", `/api/chat/messages/${id}/reactions`, user, body), withId(id));

  it.each([
    ["an emoji outside the palette", { emoji: "💩" }],
    ["text", { emoji: "thumbs up" }],
    ["no emoji", {}],
    ["an extra field", { emoji: "🎉", userId: "x" }],
  ])("rejects %s", async (_label, body) => {
    const db = makeDb();
    persisted(db, member);
    expect((await react(member, body)).status).toBe(400);
    expect(db.messageReaction.create).not.toHaveBeenCalled();
  });

  it("adds the caller's reaction, bumps the message and returns the counts", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.findFirst.mockResolvedValue({ id: "m1" });
    db.messageReaction.deleteMany.mockResolvedValue({ count: 0 });
    db.messageReaction.findMany.mockResolvedValue([
      { emoji: "🎉", userId: member.id },
      { emoji: "🎉", userId: "other-member" },
    ]);
    const response = await react(member, { emoji: "🎉" });
    expect(response.status).toBe(200);
    expect(db.messageReaction.deleteMany).toHaveBeenCalledWith({
      where: { messageId: "m1", userId: member.id, emoji: "🎉" },
    });
    expect(db.messageReaction.create).toHaveBeenCalledWith({
      data: { messageId: "m1", userId: member.id, emoji: "🎉" },
    });
    expect(db.chatMessage.update).toHaveBeenCalledWith({
      where: { id: "m1" },
      data: { updatedAt: expect.any(Date) },
    });
    expect(await response.json()).toEqual({
      messageId: "m1",
      reactions: [{ emoji: "🎉", count: 2, reacted: true }],
    });
  });

  it("removes the caller's reaction when it already exists", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.findFirst.mockResolvedValue({ id: "m1" });
    db.messageReaction.deleteMany.mockResolvedValue({ count: 1 });
    const response = await react(member, { emoji: "🎉" });
    expect(db.messageReaction.create).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ messageId: "m1", reactions: [] });
  });

  it("tolerates a concurrent duplicate create (unique constraint)", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.findFirst.mockResolvedValue({ id: "m1" });
    db.messageReaction.create.mockRejectedValue({ code: "P2002" });
    expect((await react(member, { emoji: "👍" })).status).toBe(200);
  });

  it("returns 404 for a missing or deleted message", async () => {
    const db = makeDb();
    persisted(db, member);
    db.chatMessage.findFirst.mockResolvedValue(null);
    expect((await react(member, { emoji: "👍" })).status).toBe(404);
    expect(db.messageReaction.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/chat/rules/accept", () => {
  const accept = (user: SessionUser, body: unknown = {}, init = {}) =>
    acceptRules(request("POST", "/api/chat/rules/accept", user, body, init));

  it("records the first acceptance", async () => {
    const db = makeDb();
    persisted(db, member);
    db.userPreferences.updateMany.mockResolvedValue({ count: 1 });
    const response = await accept(member);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rulesAccepted: true });
    expect(db.userPreferences.updateMany).toHaveBeenCalledWith({
      where: { userId: member.id, chatRulesAcceptedAt: null },
      data: { chatRulesAcceptedAt: expect.any(Date) },
    });
    expect(db.userPreferences.create).not.toHaveBeenCalled();
  });

  it("never overwrites an earlier acceptance", async () => {
    const db = makeDb();
    persisted(db, member);
    db.userPreferences.updateMany.mockResolvedValue({ count: 0 });
    db.userPreferences.findUnique.mockResolvedValue({ userId: member.id });
    expect((await accept(member)).status).toBe(200);
    expect(db.userPreferences.create).not.toHaveBeenCalled();
  });

  it("creates the preferences row when the member has none", async () => {
    const db = makeDb();
    persisted(db, member);
    db.userPreferences.updateMany.mockResolvedValue({ count: 0 });
    db.userPreferences.findUnique.mockResolvedValue(null);
    await accept(member);
    expect(db.userPreferences.create).toHaveBeenCalledWith({
      data: { userId: member.id, chatRulesAcceptedAt: expect.any(Date) },
    });
  });

  it("ignores a lost race on creation", async () => {
    const db = makeDb();
    persisted(db, member);
    db.userPreferences.updateMany.mockResolvedValue({ count: 0 });
    db.userPreferences.findUnique.mockResolvedValue(null);
    db.userPreferences.create.mockRejectedValue({ code: "P2002" });
    expect((await accept(member)).status).toBe(200);
  });

  it("takes no input and rejects cross-origin calls", async () => {
    const db = makeDb();
    persisted(db, member);
    expect((await accept(member, { userId: "other" })).status).toBe(400);
    expect((await accept(member, {}, { origin: "https://evil.example" })).status).toBe(403);
    expect(db.userPreferences.updateMany).not.toHaveBeenCalled();
  });
});
