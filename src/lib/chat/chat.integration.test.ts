import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import type { ChatFeed } from "@/lib/workspace/types";

// WRITTEN BUT NOT RUN in the environment where it was authored: it needs a separate, migrated
// TEST_DATABASE_URL that includes migration 20261101190000_personal_space_and_chat. It proves the
// chat rules against a real PostgreSQL database through the real route handlers.
const dbState = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("@/lib/db/prisma", () => ({ getPrismaClient: () => dbState.client }));

import { GET as listMessages, POST as postMessage } from "@/app/api/chat/messages/route";
import { DELETE as removeMessage, PATCH as editMessage } from "@/app/api/chat/messages/[id]/route";
import { POST as pinMessage } from "@/app/api/chat/messages/[id]/pin/route";
import { POST as reactToMessage } from "@/app/api/chat/messages/[id]/reactions/route";
import { POST as acceptRules } from "@/app/api/chat/rules/accept/route";

const connectionString = process.env.TEST_DATABASE_URL;
const suite = describe.skipIf(!connectionString);
const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  : null;
const sessionSecret = "synthetic-chat-integration-secret-over-32-characters";
const userIds: string[] = [];

type Person = { session: SessionUser; id: string };
async function createPerson(
  role: "MEMBER" | "ADMIN" = "MEMBER",
  dbStatus: "APPROVED" | "SUSPENDED" = "APPROVED"
): Promise<Person> {
  const suffix = randomUUID();
  const row = await prisma!.user.create({
    data: {
      id: `chat-${role.toLowerCase()}-${suffix}`,
      email: `chat-${role.toLowerCase()}-${suffix}@example.test`,
      name: `Chat ${role} ${suffix.slice(0, 8)}`,
      role,
      status: dbStatus,
    },
  });
  userIds.push(row.id);
  return {
    id: row.id,
    session: { id: row.id, email: row.email, name: row.name, role: row.role, status: "APPROVED" },
  };
}

function req(method: string, path: string, person: Person | null, body?: unknown) {
  const headers = new Headers();
  if (person) headers.set("cookie", `prax_session=${signSession(person.session)}`);
  if (body !== undefined) headers.set("content-type", "application/json");
  if (method !== "GET") headers.set("origin", "http://localhost");
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
const withId = (id: string) => ({ params: Promise.resolve({ id }) });
const feed = async (person: Person, query = ""): Promise<ChatFeed> =>
  (await listMessages(req("GET", `/api/chat/messages${query}`, person))).json();
const post = (person: Person, content: string) =>
  postMessage(req("POST", "/api/chat/messages", person, { content }));
const accept = (person: Person) => acceptRules(req("POST", "/api/chat/rules/accept", person, {}));
const edit = (person: Person, id: string, content: string) =>
  editMessage(req("PATCH", `/api/chat/messages/${id}`, person, { content }), withId(id));
const remove = (person: Person, id: string) =>
  removeMessage(req("DELETE", `/api/chat/messages/${id}`, person), withId(id));
const pin = (person: Person, id: string, pinned: boolean) =>
  pinMessage(req("POST", `/api/chat/messages/${id}/pin`, person, { pinned }), withId(id));
const react = (person: Person, id: string, emoji: string) =>
  reactToMessage(req("POST", `/api/chat/messages/${id}/reactions`, person, { emoji }), withId(id));

/** Messages are created directly with far-future timestamps so they are the newest in a shared test channel. */
async function seed(authorId: string, count: number, startSecond = 0) {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const row = await prisma!.chatMessage.create({
      data: {
        authorId,
        content: `seeded ${i}`,
        createdAt: new Date(Date.UTC(2099, 0, 1, 0, 0, startSecond + i)),
      },
    });
    ids.push(row.id);
  }
  return ids;
}
const idsOf = (messages: Array<{ id: string }>, mine: string[]) =>
  messages.map((m) => m.id).filter((id) => mine.includes(id));

suite("community chat PostgreSQL integration", () => {
  beforeAll(async () => {
    vi.stubEnv("SESSION_SECRET", sessionSecret);
    dbState.client = prisma;
    await prisma!.$connect();
    const tables = await prisma!.$queryRaw<Array<{ chat: string | null }>>`
      SELECT to_regclass('public."ChatMessage"')::text AS chat`;
    if (!tables[0]?.chat)
      throw new Error(
        "Apply migration 20261101190000_personal_space_and_chat to TEST_DATABASE_URL before running this suite."
      );
  });

  afterEach(async () => {
    // Messages, reactions and preferences cascade from the user.
    await prisma!.user.deleteMany({ where: { id: { in: userIds.splice(0) } } });
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await prisma!.$disconnect();
  });

  it("lets a member post only after accepting the rules, and keeps the first acceptance time", async () => {
    const member = await createPerson();
    const before = await post(member, "too early");
    expect(before.status).toBe(403);
    expect((await before.json()).error.code).toBe("CHAT_RULES_NOT_ACCEPTED");
    expect((await feed(member)).rulesAccepted).toBe(false);

    expect((await accept(member)).status).toBe(200);
    const first = await prisma!.userPreferences.findUniqueOrThrow({ where: { userId: member.id } });
    expect(first.chatRulesAcceptedAt).not.toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect((await accept(member)).status).toBe(200);
    const second = await prisma!.userPreferences.findUniqueOrThrow({
      where: { userId: member.id },
    });
    expect(second.chatRulesAcceptedAt?.getTime()).toBe(first.chatRulesAcceptedAt?.getTime());
    expect((await feed(member)).rulesAccepted).toBe(true);

    const posted = await post(member, "  hello from the test  ");
    expect(posted.status).toBe(201);
    const { message } = await posted.json();
    expect(message).toMatchObject({
      content: "hello from the test",
      authorId: member.id,
      edited: false,
    });
    expect(await prisma!.chatMessage.count({ where: { authorId: member.id } })).toBe(1);
  });

  it("creates the preferences row with the Settings defaults when rules are accepted first", async () => {
    const member = await createPerson();
    await accept(member);
    const prefs = await prisma!.userPreferences.findUniqueOrThrow({ where: { userId: member.id } });
    expect(prefs).toMatchObject({
      theme: "LIGHT",
      reviewNotifications: true,
      streakReminder: true,
      chatNotifications: false,
      showPortfolio: true,
    });
  });

  it("pages newest-first with cursors and never lists deleted messages", async () => {
    const author = await createPerson();
    const viewer = await createPerson();
    const mine = await seed(author.id, 5);
    await prisma!.chatMessage.update({ where: { id: mine[2] }, data: { deletedAt: new Date() } });

    const latest = await feed(viewer, "?limit=2");
    expect(latest.messages.map((m) => m.id)).toEqual([mine[3], mine[4]]);
    expect(latest.hasMore).toBe(true);
    expect(latest.nextBefore).toBe(mine[3]);

    const older = await feed(viewer, `?limit=2&before=${latest.nextBefore}`);
    expect(older.messages.map((m) => m.id)).toEqual([mine[0], mine[1]]);
    expect(idsOf(older.messages, mine)).not.toContain(mine[2]);

    const everything = await feed(viewer, "?limit=50");
    expect(idsOf(everything.messages, mine)).toEqual([mine[0], mine[1], mine[3], mine[4]]);
  });

  it("polls forward: new messages, edits, pins, reactions and removals reach a client that already holds the page", async () => {
    const author = await createPerson();
    const reader = await createPerson();
    const admin = await createPerson("ADMIN");
    await Promise.all([accept(author), accept(reader)]);
    const [m1, m2] = await seed(author.id, 2);

    // Everything below happens after this instant, so it must show up as a change.
    await new Promise((resolve) => setTimeout(resolve, 25));
    const since = new Date().toISOString();
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect((await edit(author, m1, "edited text")).status).toBe(200);
    expect((await react(reader, m1, "🎉")).status).toBe(200);
    expect((await pin(admin, m2, true)).status).toBe(200);
    expect((await remove(author, m2)).status).toBe(204);
    const [m3] = await seed(author.id, 1, 10);

    const update = await feed(reader, `?limit=50&after=${m2}&updatedSince=${since}`);
    expect(idsOf(update.messages, [m1, m2, m3])).toEqual([m3]);
    const changed = update.updates.find((u) => u.id === m1);
    expect(changed).toMatchObject({
      content: "edited text",
      edited: true,
      reactions: [{ emoji: "🎉", count: 1, reacted: true }],
    });
    expect(update.updates.find((u) => u.id === m2)).toEqual({ id: m2, deleted: true });
    expect(update.pinned.map((m) => m.id)).not.toContain(m2);
  });

  it("soft-deletes: the row stays, the message disappears, and it can no longer be changed", async () => {
    const author = await createPerson();
    const other = await createPerson();
    const [id] = await seed(author.id, 1);
    expect((await remove(other, id)).status).toBe(403);
    expect((await remove(author, id)).status).toBe(204);
    const row = await prisma!.chatMessage.findUniqueOrThrow({ where: { id } });
    expect(row.deletedAt).not.toBeNull();
    expect(row.content).toBe("seeded 0");
    expect(idsOf((await feed(other, "?limit=50")).messages, [id])).toEqual([]);
    expect((await edit(author, id, "revive")).status).toBe(404);
    expect((await react(other, id, "👍")).status).toBe(404);
    expect((await remove(author, id)).status).toBe(404);
  });

  it("lets an admin remove anyone's message but never edit it", async () => {
    const author = await createPerson();
    const admin = await createPerson("ADMIN");
    const [id] = await seed(author.id, 1);
    expect((await edit(admin, id, "admin edit")).status).toBe(403);
    expect((await prisma!.chatMessage.findUniqueOrThrow({ where: { id } })).content).toBe(
      "seeded 0"
    );
    expect((await remove(admin, id)).status).toBe(204);
  });

  it("allows only admins to pin, and lists pinned messages separately", async () => {
    const author = await createPerson();
    const admin = await createPerson("ADMIN");
    const [id] = await seed(author.id, 1);
    expect((await pin(author, id, true)).status).toBe(403);
    expect((await prisma!.chatMessage.findUniqueOrThrow({ where: { id } })).pinned).toBe(false);
    expect((await pin(admin, id, true)).status).toBe(200);
    expect((await feed(author)).pinned.map((m) => m.id)).toContain(id);
    expect((await pin(admin, id, false)).status).toBe(200);
    expect((await feed(author)).pinned.map((m) => m.id)).not.toContain(id);
  });

  it("allows one reaction per member per emoji and toggles it off", async () => {
    const author = await createPerson();
    const [a, b] = await Promise.all([createPerson(), createPerson()]);
    const [id] = await seed(author.id, 1);

    const added = await (await react(a, id, "🎉")).json();
    expect(added.reactions).toEqual([{ emoji: "🎉", count: 1, reacted: true }]);
    await react(b, id, "🎉");
    await react(b, id, "👍");
    const asA = (await feed(a, "?limit=50")).messages.find((m) => m.id === id)!;
    expect(asA.reactions).toEqual([
      { emoji: "👍", count: 1, reacted: false },
      { emoji: "🎉", count: 2, reacted: true },
    ]);

    expect((await (await react(a, id, "🎉")).json()).reactions).toEqual([
      { emoji: "👍", count: 1, reacted: false },
      { emoji: "🎉", count: 1, reacted: false },
    ]);
    expect(await prisma!.messageReaction.count({ where: { messageId: id, userId: a.id } })).toBe(0);

    // The unique index is the real guarantee, even if two requests race past the toggle.
    await prisma!.messageReaction.create({ data: { messageId: id, userId: a.id, emoji: "😂" } });
    await expect(
      prisma!.messageReaction.create({ data: { messageId: id, userId: a.id, emoji: "😂" } })
    ).rejects.toMatchObject({ code: "P2002" });
    expect((await react(a, id, "💩")).status).toBe(400);
  });

  it("removes a user's messages and reactions when the user is deleted, and keeps others' reactions elsewhere", async () => {
    const author = await createPerson();
    const fan = await createPerson();
    const [id] = await seed(author.id, 1);
    await react(fan, id, "🙌");
    expect(await prisma!.messageReaction.count({ where: { messageId: id } })).toBe(1);

    await prisma!.user.delete({ where: { id: author.id } });
    userIds.splice(userIds.indexOf(author.id), 1);
    expect(await prisma!.chatMessage.count({ where: { id } })).toBe(0);
    expect(await prisma!.messageReaction.count({ where: { messageId: id } })).toBe(0);
  });

  it("refuses stale sessions whose database account is no longer approved", async () => {
    const stale = await createPerson("MEMBER", "SUSPENDED");
    expect((await listMessages(req("GET", "/api/chat/messages", stale))).status).toBe(403);
    expect((await post(stale, "should not post")).status).toBe(403);
    expect((await accept(stale)).status).toBe(403);
    expect(await prisma!.chatMessage.count({ where: { authorId: stale.id } })).toBe(0);
    expect(await prisma!.userPreferences.count({ where: { userId: stale.id } })).toBe(0);
  });
});
