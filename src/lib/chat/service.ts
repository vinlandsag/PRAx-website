import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { prismaErrorCode } from "@/lib/auth/persistence";
import { apiError, errors } from "@/lib/errors";
import {
  REACTION_EMOJIS,
  type ChatFeed,
  type ChatMessage,
  type ChatReaction,
  type ChatTombstone,
  type ReactionEmoji,
} from "@/lib/workspace/types";

/**
 * Community chat (single shared #general channel). Messages are soft-deleted: a row with
 * `deletedAt` set is never returned to clients except as a `{id, deleted: true}` tombstone, and
 * `updatedAt` is bumped on every edit, pin, delete and reaction so polling clients see changes.
 */

export const CHAT_PAGE_SIZE = 50;
export const CHAT_CONTENT_MAX = 500;
export const CHAT_BODY_MAX_BYTES = 4 * 1024;
const PINNED_LIMIT = 10;
const UPDATES_LIMIT = 100;
const CURSOR_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

export interface ChatAccount {
  id: string;
  role: "MEMBER" | "ADMIN";
}
type Failure = { ok: false; response: Response };
const invalid = (message: string): Failure => ({
  ok: false,
  response: apiError("VALIDATION_ERROR", message, 400),
});

export const isReactionEmoji = (value: unknown): value is ReactionEmoji =>
  typeof value === "string" && (REACTION_EMOJIS as readonly string[]).includes(value);

/** A message body: trimmed, non-blank, within the length limit and free of NUL characters. */
export function parseMessageContent(value: unknown): string | undefined {
  if (typeof value !== "string" || value.includes("\u0000")) return undefined;
  const content = value.trim();
  return content && content.length <= CHAT_CONTENT_MAX ? content : undefined;
}

export interface ChatQuery {
  limit: number;
  before?: string;
  after?: string;
  updatedSince?: Date;
}

export function parseChatQuery(params: URLSearchParams): { ok: true; value: ChatQuery } | Failure {
  const bad = invalid("Chat query parameters are invalid.");
  const read = (key: string) => {
    const values = params.getAll(key);
    return values.length > 1 ? null : values[0];
  };
  const limitText = read("limit");
  const before = read("before");
  const after = read("after");
  const since = read("updatedSince");
  if (limitText === null || before === null || after === null || since === null) return bad;
  let limit = CHAT_PAGE_SIZE;
  if (limitText !== undefined) {
    limit = /^\d{1,3}$/.test(limitText) ? Number(limitText) : 0;
    if (limit < 1 || limit > CHAT_PAGE_SIZE) return bad;
  }
  if (before !== undefined && !CURSOR_PATTERN.test(before)) return bad;
  if (after !== undefined && !CURSOR_PATTERN.test(after)) return bad;
  if (before !== undefined && after !== undefined) return bad;
  let updatedSince: Date | undefined;
  if (since !== undefined) {
    if (after === undefined || !ISO_PATTERN.test(since)) return bad;
    updatedSince = new Date(since);
    if (Number.isNaN(updatedSince.getTime())) return bad;
  }
  return { ok: true, value: { limit, before, after, updatedSince } };
}

const messageSelect = {
  id: true,
  authorId: true,
  content: true,
  pinned: true,
  editedAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { name: true, avatarUrl: true } },
  reactions: { select: { emoji: true, userId: true } },
} satisfies Prisma.ChatMessageSelect;

type MessageRow = Prisma.ChatMessageGetPayload<{ select: typeof messageSelect }>;

/** Counts reactions per palette emoji and marks the viewer's own. Reactor ids are never returned. */
export function aggregateReactions(
  rows: Array<{ emoji: string; userId: string }>,
  viewerId: string
): ChatReaction[] {
  const out: ChatReaction[] = [];
  for (const emoji of REACTION_EMOJIS) {
    const matching = rows.filter((row) => row.emoji === emoji);
    if (matching.length)
      out.push({
        emoji,
        count: matching.length,
        reacted: matching.some((row) => row.userId === viewerId),
      });
  }
  return out;
}

export function toChatMessage(row: MessageRow, viewerId: string): ChatMessage {
  return {
    id: row.id,
    authorId: row.authorId,
    author: row.author.name,
    authorAvatarUrl: row.author.avatarUrl,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    edited: row.editedAt !== null,
    pinned: row.pinned,
    reactions: aggregateReactions(row.reactions, viewerId),
  };
}

type Cursor = { id: string; createdAt: Date };
const olderThan = (c: Cursor) => [
  { createdAt: { lt: c.createdAt } },
  { createdAt: c.createdAt, id: { lt: c.id } },
];
const newerThan = (c: Cursor) => [
  { createdAt: { gt: c.createdAt } },
  { createdAt: c.createdAt, id: { gt: c.id } },
];
const notNewerThan = (c: Cursor) => [
  { createdAt: { lt: c.createdAt } },
  { createdAt: c.createdAt, id: { lte: c.id } },
];

async function loadMessage(prisma: PrismaClient, id: string, viewerId: string) {
  const row = await prisma.chatMessage.findFirst({
    where: { id, deletedAt: null },
    select: messageSelect,
  });
  return row ? toChatMessage(row, viewerId) : null;
}

/**
 * One poll/page of the channel. No cursor: the latest page. `before`: an older page.
 * `after`: newer messages (plus, with `updatedSince`, changes to messages already delivered).
 */
export async function getChatFeed(
  prisma: PrismaClient,
  account: ChatAccount,
  query: ChatQuery
): Promise<{ ok: true; feed: ChatFeed } | Failure> {
  // Taken before reading so a change made while we query is returned again next time, not lost.
  const serverTime = new Date();
  const cursorId = query.before ?? query.after;
  let cursor: Cursor | null = null;
  if (cursorId) {
    cursor = await prisma.chatMessage.findUnique({
      where: { id: cursorId },
      select: { id: true, createdAt: true },
    });
    if (!cursor) return invalid("That message cursor is not valid.");
  }

  const [pinnedRows, preferences] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { pinned: true, deletedAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PINNED_LIMIT,
      select: messageSelect,
    }),
    prisma.userPreferences.findUnique({
      where: { userId: account.id },
      select: { chatRulesAcceptedAt: true },
    }),
  ]);

  let rows: MessageRow[];
  let hasMore = false;
  if (query.after && cursor) {
    rows = await prisma.chatMessage.findMany({
      where: { deletedAt: null, OR: newerThan(cursor) },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: query.limit,
      select: messageSelect,
    });
  } else {
    const older = await prisma.chatMessage.findMany({
      where: { deletedAt: null, ...(cursor ? { OR: olderThan(cursor) } : {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      select: messageSelect,
    });
    hasMore = older.length > query.limit;
    rows = older.slice(0, query.limit).reverse();
  }

  let updates: Array<ChatMessage | ChatTombstone> = [];
  let resync = false;
  if (query.after && query.updatedSince && cursor) {
    const changed = await prisma.chatMessage.findMany({
      where: { updatedAt: { gt: query.updatedSince }, OR: notNewerThan(cursor) },
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
      take: UPDATES_LIMIT + 1,
      select: messageSelect,
    });
    if (changed.length > UPDATES_LIMIT) resync = true;
    else
      updates = changed.map((row) =>
        row.deletedAt ? { id: row.id, deleted: true as const } : toChatMessage(row, account.id)
      );
  }

  return {
    ok: true,
    feed: {
      messages: rows.map((row) => toChatMessage(row, account.id)),
      updates,
      pinned: pinnedRows.map((row) => toChatMessage(row, account.id)),
      hasMore,
      nextBefore: hasMore && rows.length ? rows[0].id : null,
      rulesAccepted: !!preferences?.chatRulesAcceptedAt,
      viewer: { id: account.id, role: account.role },
      serverTime: serverTime.toISOString(),
      ...(resync ? { resync: true } : {}),
    },
  };
}

type MessageResult = { ok: true; message: ChatMessage } | Failure;

/** Posting requires the member to have accepted the community rules. */
export async function createMessage(
  prisma: PrismaClient,
  account: ChatAccount,
  content: string
): Promise<MessageResult> {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: account.id },
    select: { chatRulesAcceptedAt: true },
  });
  if (!preferences?.chatRulesAcceptedAt)
    return {
      ok: false,
      response: apiError(
        "CHAT_RULES_NOT_ACCEPTED",
        "Accept the community rules before you post.",
        403
      ),
    };
  const row = await prisma.chatMessage.create({
    data: { authorId: account.id, content },
    select: messageSelect,
  });
  return { ok: true, message: toChatMessage(row, account.id) };
}

/** Only the author may edit, and only while the message still exists. */
export async function editMessage(
  prisma: PrismaClient,
  account: ChatAccount,
  id: string,
  content: string
): Promise<MessageResult> {
  const existing = await prisma.chatMessage.findFirst({
    where: { id, deletedAt: null },
    select: { authorId: true },
  });
  if (!existing) return { ok: false, response: errors.notFound("Message") };
  if (existing.authorId !== account.id) return { ok: false, response: errors.forbidden() };
  const now = new Date();
  const updated = await prisma.chatMessage.updateMany({
    where: { id, authorId: account.id, deletedAt: null },
    data: { content, editedAt: now, updatedAt: now },
  });
  if (updated.count === 0) return { ok: false, response: errors.notFound("Message") };
  const message = await loadMessage(prisma, id, account.id);
  return message ? { ok: true, message } : { ok: false, response: errors.notFound("Message") };
}

/** Soft delete by the author or by a persisted ADMIN. */
export async function deleteMessage(
  prisma: PrismaClient,
  account: ChatAccount,
  id: string
): Promise<{ ok: true } | Failure> {
  const existing = await prisma.chatMessage.findFirst({
    where: { id, deletedAt: null },
    select: { authorId: true },
  });
  if (!existing) return { ok: false, response: errors.notFound("Message") };
  if (existing.authorId !== account.id && account.role !== "ADMIN")
    return { ok: false, response: errors.forbidden() };
  const now = new Date();
  const updated = await prisma.chatMessage.updateMany({
    where: {
      id,
      deletedAt: null,
      ...(account.role === "ADMIN" ? {} : { authorId: account.id }),
    },
    data: { deletedAt: now, updatedAt: now },
  });
  return updated.count === 0 ? { ok: false, response: errors.notFound("Message") } : { ok: true };
}

/** Pinning is reserved for a persisted ADMIN. */
export async function setPinned(
  prisma: PrismaClient,
  account: ChatAccount,
  id: string,
  pinned: boolean
): Promise<MessageResult> {
  if (account.role !== "ADMIN") return { ok: false, response: errors.forbidden() };
  const updated = await prisma.chatMessage.updateMany({
    where: { id, deletedAt: null },
    data: { pinned, updatedAt: new Date() },
  });
  if (updated.count === 0) return { ok: false, response: errors.notFound("Message") };
  const message = await loadMessage(prisma, id, account.id);
  return message ? { ok: true, message } : { ok: false, response: errors.notFound("Message") };
}

/**
 * Toggles the caller's reaction (one per user per emoji). The message's `updatedAt` is bumped so
 * polling clients pick the change up.
 */
export async function toggleReaction(
  prisma: PrismaClient,
  account: ChatAccount,
  id: string,
  emoji: ReactionEmoji
): Promise<{ ok: true; messageId: string; reactions: ChatReaction[] } | Failure> {
  return prisma.$transaction(
    async (tx): Promise<{ ok: true; messageId: string; reactions: ChatReaction[] } | Failure> => {
      const message = await tx.chatMessage.findFirst({
        where: { id, deletedAt: null },
        select: { id: true },
      });
      if (!message) return { ok: false, response: errors.notFound("Message") };
      const removed = await tx.messageReaction.deleteMany({
        where: { messageId: id, userId: account.id, emoji },
      });
      if (removed.count === 0) {
        try {
          await tx.messageReaction.create({ data: { messageId: id, userId: account.id, emoji } });
        } catch (error) {
          if (prismaErrorCode(error) !== "P2002") throw error;
        }
      }
      await tx.chatMessage.update({ where: { id }, data: { updatedAt: new Date() } });
      const rows = await tx.messageReaction.findMany({
        where: { messageId: id },
        select: { emoji: true, userId: true },
      });
      return { ok: true, messageId: id, reactions: aggregateReactions(rows, account.id) };
    },
    { maxWait: 10_000, timeout: 15_000 }
  );
}

/** Records the first acceptance and never overwrites an earlier timestamp. */
export async function acceptRules(prisma: PrismaClient, userId: string): Promise<void> {
  const now = new Date();
  const updated = await prisma.userPreferences.updateMany({
    where: { userId, chatRulesAcceptedAt: null },
    data: { chatRulesAcceptedAt: now },
  });
  if (updated.count > 0) return;
  const existing = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { userId: true },
  });
  if (existing) return;
  try {
    await prisma.userPreferences.create({ data: { userId, chatRulesAcceptedAt: now } });
  } catch (error) {
    if (prismaErrorCode(error) !== "P2002") throw error;
  }
}
