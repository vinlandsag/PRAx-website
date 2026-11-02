import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  aggregateReactions,
  CHAT_PAGE_SIZE,
  deleteMessage,
  isReactionEmoji,
  parseChatQuery,
  parseMessageContent,
  setPinned,
} from "./service";
import { REACTION_EMOJIS } from "@/lib/workspace/types";

const query = (qs: string) => parseChatQuery(new URLSearchParams(qs));

describe("parseChatQuery", () => {
  it("defaults to a full page with no cursors", () => {
    expect(query("")).toEqual({
      ok: true,
      value: {
        limit: CHAT_PAGE_SIZE,
        before: undefined,
        after: undefined,
        updatedSince: undefined,
      },
    });
  });

  it("accepts the cursors the client sends while polling", () => {
    const result = query("limit=50&after=cm1abc&updatedSince=2026-11-01T10:00:00.000Z");
    expect(result).toMatchObject({
      ok: true,
      value: { limit: 50, after: "cm1abc", updatedSince: new Date("2026-11-01T10:00:00.000Z") },
    });
  });

  it("accepts a before cursor on its own", () => {
    expect(query("before=cm1abc")).toMatchObject({ ok: true, value: { before: "cm1abc" } });
  });

  it.each([
    "limit=0",
    "limit=51",
    "limit=-1",
    "limit=1.5",
    "before=a&after=b",
    "updatedSince=2026-11-01T10:00:00.000Z",
    "after=a&updatedSince=2026-13-45T00:00:00Z",
    "after=a&updatedSince=2026-11-01",
    "after=a%2Fb",
  ])("rejects %s", (qs) => expect(query(qs).ok).toBe(false));
});

describe("parseMessageContent", () => {
  it("trims and accepts text up to 500 characters", () => {
    expect(parseMessageContent("  hi  ")).toBe("hi");
    expect(parseMessageContent("a".repeat(500))).toHaveLength(500);
  });
  it.each([
    ["blank", "   "],
    ["empty", ""],
    ["too long", "a".repeat(501)],
    ["NUL", "a\u0000"],
    ["number", 1],
    ["null", null],
  ])("rejects %s", (_label, value) => expect(parseMessageContent(value)).toBeUndefined());
});

describe("reactions", () => {
  it("knows exactly the six-emoji palette", () => {
    expect(REACTION_EMOJIS).toHaveLength(6);
    for (const emoji of REACTION_EMOJIS) expect(isReactionEmoji(emoji)).toBe(true);
    for (const other of ["💩", "", "👍👍", 5, null, undefined])
      expect(isReactionEmoji(other)).toBe(false);
  });

  it("counts per emoji in palette order and marks only the viewer's own", () => {
    expect(
      aggregateReactions(
        [
          { emoji: "🙌", userId: "a" },
          { emoji: "👍", userId: "me" },
          { emoji: "👍", userId: "b" },
          { emoji: "unknown", userId: "me" },
        ],
        "me"
      )
    ).toEqual([
      { emoji: "👍", count: 2, reacted: true },
      { emoji: "🙌", count: 1, reacted: false },
    ]);
  });
});

// The routes already require the admin permission and a role that matches the database. These
// tests pin down the service's own persisted-role check, which is the last line of defence.
describe("moderation checks inside the service", () => {
  const prismaWith = (authorId = "author-1") =>
    ({
      chatMessage: {
        findFirst: vi.fn().mockResolvedValue({ authorId }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    }) as unknown as PrismaClient & {
      chatMessage: { updateMany: ReturnType<typeof vi.fn> };
    };

  it("pinning is refused for a member without touching the database", async () => {
    const prisma = prismaWith();
    const result = await setPinned(prisma, { id: "member-1", role: "MEMBER" }, "m1", true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
    expect(prisma.chatMessage.updateMany).not.toHaveBeenCalled();
  });

  it("deleting someone else's message is refused for a member", async () => {
    const prisma = prismaWith("author-1");
    const result = await deleteMessage(prisma, { id: "member-1", role: "MEMBER" }, "m1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
    expect(prisma.chatMessage.updateMany).not.toHaveBeenCalled();
  });
});
