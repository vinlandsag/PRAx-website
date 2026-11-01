// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { applyUpdates, CHAT_PAGE_SIZE, CHAT_POLL_MS, mergeMessages, useChat } from "./use-chat";
import type { ChatFeed, ChatMessage } from "./types";

// The /api/chat routes are built in a later stage. These tests stub fetch with the contract
// documented in src/lib/workspace/types.ts; the application itself simulates nothing.
const T0 = "2026-11-02T10:00:00.000Z";
const msg = (id: string, createdAt: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  authorId: "u1",
  author: "Ada",
  authorAvatarUrl: "",
  content: `message ${id}`,
  createdAt,
  edited: false,
  pinned: false,
  reactions: [],
  ...extra,
});
const feed = (overrides: Partial<ChatFeed> = {}): ChatFeed => ({
  messages: [],
  updates: [],
  pinned: [],
  hasMore: false,
  nextBefore: null,
  rulesAccepted: true,
  viewer: { id: "u1", role: "MEMBER" },
  serverTime: T0,
  ...overrides,
});
const m1 = msg("m1", "2026-11-02T09:00:00.000Z");
const m2 = msg("m2", "2026-11-02T09:01:00.000Z");
// Plain objects with the parts apiRequest reads; real Response streams do not mix with fake timers.
const reply = (body: unknown, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => body,
});
const ok = (body: unknown) => reply(body);
const failure = (code = "INTERNAL_ERROR", message = "Service unavailable", status = 500) =>
  reply({ error: { code, message, status } }, status);
const ids = (list: ChatMessage[]) => list.map((m) => m.id);
const query = (call: unknown[]) => new URLSearchParams(String(call[0]).split("?")[1]);

const fetchMock = vi.fn();
const tick = (ms = 0) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function mountLoaded(initial: ChatFeed = feed({ messages: [m1, m2] })) {
  fetchMock.mockResolvedValueOnce(ok(initial));
  const hook = renderHook(() => useChat());
  await tick();
  return hook;
}

describe("chat helpers", () => {
  it("merges by id and keeps oldest-first order", () => {
    const edited = { ...m2, content: "edited" };
    const m3 = msg("m3", "2026-11-02T09:02:00.000Z");
    const merged = mergeMessages([m2, m1], [m3, edited]);
    expect(ids(merged)).toEqual(["m1", "m2", "m3"]);
    expect(merged[1].content).toBe("edited");
  });

  it("applies edits and removals only to messages that are already held", () => {
    const stranger = msg("elsewhere", "2026-11-02T08:00:00.000Z");
    const result = applyUpdates(
      [m1, m2],
      [{ ...m1, content: "changed" }, { id: "m2", deleted: true }, stranger]
    );
    expect(ids(result)).toEqual(["m1"]);
    expect(result[0].content).toBe("changed");
  });
});

describe("useChat polling", () => {
  it("loads the latest page of messages", async () => {
    const { result } = await mountLoaded(
      feed({ messages: [m1, m2], hasMore: true, nextBefore: "m1", pinned: [m1] })
    );
    expect(fetchMock).toHaveBeenCalledWith(`/api/chat/messages?limit=${CHAT_PAGE_SIZE}`, {
      cache: "no-store",
    });
    expect(result.current.loaded).toBe(true);
    expect(ids(result.current.messages)).toEqual(["m1", "m2"]);
    expect(ids(result.current.pinned)).toEqual(["m1"]);
    expect(result.current.viewer).toEqual({ id: "u1", role: "MEMBER" });
    expect(result.current.hasMore).toBe(true);
  });

  it("asks only for newer messages and changes since the last response", async () => {
    const { result } = await mountLoaded();
    const m3 = msg("m3", "2026-11-02T09:02:00.000Z");
    fetchMock.mockResolvedValueOnce(
      ok(
        feed({
          messages: [m3],
          updates: [
            { ...m1, content: "edited", edited: true },
            { id: "m2", deleted: true },
          ],
          pinned: [m3],
          serverTime: "2026-11-02T10:00:15.000Z",
        })
      )
    );
    await tick(CHAT_POLL_MS);
    const params = query(fetchMock.mock.calls[1]);
    expect(params.get("after")).toBe("m2");
    expect(params.get("updatedSince")).toBe("2026-11-02T09:59:58.000Z");
    expect(params.get("limit")).toBe(String(CHAT_PAGE_SIZE));
    expect(ids(result.current.messages)).toEqual(["m1", "m3"]);
    expect(result.current.messages[0]).toMatchObject({ content: "edited", edited: true });
    expect(ids(result.current.pinned)).toEqual(["m3"]);
  });

  it("keeps the messages on screen and keeps polling after a failed poll", async () => {
    const { result } = await mountLoaded();
    fetchMock.mockResolvedValueOnce(failure());
    await tick(CHAT_POLL_MS);
    expect(result.current.connectionLost).toBe(true);
    expect(result.current.error).toBe("");
    expect(result.current.loaded).toBe(true);
    expect(ids(result.current.messages)).toEqual(["m1", "m2"]);

    const m3 = msg("m3", "2026-11-02T09:02:00.000Z");
    fetchMock.mockResolvedValueOnce(ok(feed({ messages: [m3] })));
    await tick(CHAT_POLL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.current.connectionLost).toBe(false);
    expect(ids(result.current.messages)).toEqual(["m1", "m2", "m3"]);
  });

  it("keeps polling after a network error", async () => {
    const { result } = await mountLoaded();
    fetchMock.mockRejectedValueOnce(new TypeError("network down"));
    await tick(CHAT_POLL_MS);
    expect(result.current.connectionLost).toBe(true);
    fetchMock.mockResolvedValueOnce(ok(feed()));
    await tick(CHAT_POLL_MS);
    expect(result.current.connectionLost).toBe(false);
    expect(ids(result.current.messages)).toEqual(["m1", "m2"]);
  });

  it("reports a failed first load and recovers on the next poll", async () => {
    fetchMock.mockResolvedValueOnce(failure("INTERNAL_ERROR", "Service unavailable"));
    const { result } = renderHook(() => useChat());
    await tick();
    expect(result.current.loaded).toBe(false);
    expect(result.current.error).toBe("Service unavailable");
    fetchMock.mockResolvedValueOnce(ok(feed({ messages: [m1] })));
    await tick(CHAT_POLL_MS);
    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBe("");
    expect(ids(result.current.messages)).toEqual(["m1"]);
  });

  it("can be retried on demand", async () => {
    fetchMock.mockResolvedValueOnce(failure());
    const { result } = renderHook(() => useChat());
    await tick();
    fetchMock.mockResolvedValueOnce(ok(feed({ messages: [m1] })));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.loaded).toBe(true);
  });

  it("never sends overlapping requests", async () => {
    let release: () => void = () => {};
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve(ok(feed({ messages: [m1] })));
        })
    );
    const { result } = renderHook(() => useChat());
    await tick(CHAT_POLL_MS * 3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    release();
    await tick();
    expect(result.current.loaded).toBe(true);
    fetchMock.mockResolvedValueOnce(ok(feed()));
    await tick(CHAT_POLL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reloads the latest page when the server asks for a resync", async () => {
    const { result } = await mountLoaded();
    const m9 = msg("m9", "2026-11-02T09:30:00.000Z");
    fetchMock
      .mockResolvedValueOnce(ok(feed({ resync: true })))
      .mockResolvedValueOnce(ok(feed({ messages: [m9], hasMore: true, nextBefore: "m9" })));
    await tick(CHAT_POLL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(query(fetchMock.mock.calls[2]).get("after")).toBeNull();
    expect(ids(result.current.messages)).toEqual(["m9"]);
  });

  it("fetches again at once when a poll returns a full page", async () => {
    const { result } = await mountLoaded();
    const full = Array.from({ length: CHAT_PAGE_SIZE }, (_, i) =>
      msg(
        `n${String(i).padStart(2, "0")}`,
        `2026-11-02T09:${String(10 + i).padStart(2, "0")}:00.000Z`
      )
    );
    const last = full.at(-1)!;
    const extra = msg("tail", "2026-11-02T09:59:30.000Z");
    fetchMock
      .mockResolvedValueOnce(ok(feed({ messages: full })))
      .mockResolvedValueOnce(ok(feed({ messages: [extra] })));
    await tick(CHAT_POLL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(query(fetchMock.mock.calls[2]).get("after")).toBe(last.id);
    expect(result.current.messages).toHaveLength(2 + CHAT_PAGE_SIZE + 1);
  });

  it("stops polling after unmount", async () => {
    const { unmount } = await mountLoaded();
    unmount();
    await tick(CHAT_POLL_MS * 4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("loads older messages with the before cursor", async () => {
    const older = msg("m0", "2026-11-02T08:00:00.000Z");
    const { result } = await mountLoaded(
      feed({ messages: [m1, m2], hasMore: true, nextBefore: "m1" })
    );
    fetchMock.mockResolvedValueOnce(ok(feed({ messages: [older], hasMore: false })));
    await act(async () => {
      await result.current.loadOlder();
    });
    expect(query(fetchMock.mock.calls[1]).get("before")).toBe("m1");
    expect(ids(result.current.messages)).toEqual(["m0", "m1", "m2"]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loadingOlder).toBe(false);
  });
});

describe("useChat actions", () => {
  const post = (path: string, body: unknown, method = "POST") => [
    path,
    {
      cache: "no-store",
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  ];

  it("sends a message and shows the saved copy without waiting for a poll", async () => {
    const { result } = await mountLoaded();
    const created = msg("m3", "2026-11-02T09:05:00.000Z", { content: "hello" });
    fetchMock.mockResolvedValueOnce(ok({ message: created }));
    let done = false;
    await act(async () => {
      done = await result.current.send("hello", []);
    });
    expect(done).toBe(true);
    expect(fetchMock).toHaveBeenLastCalledWith(...post("/api/chat/messages", { content: "hello" }));
    expect(ids(result.current.messages)).toEqual(["m1", "m2", "m3"]);
  });

  it("includes attachment ids only when there are some", async () => {
    const { result } = await mountLoaded();
    fetchMock.mockResolvedValueOnce(ok({ message: msg("m3", "2026-11-02T09:05:00.000Z") }));
    await act(async () => {
      await result.current.send("with file", ["a1"]);
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      ...post("/api/chat/messages", { content: "with file", attachmentIds: ["a1"] })
    );
  });

  it("reopens the rules prompt when the server refuses a post", async () => {
    const { result } = await mountLoaded();
    fetchMock.mockResolvedValueOnce(
      failure("CHAT_RULES_NOT_ACCEPTED", "Accept the community rules first.", 403)
    );
    let done = true;
    await act(async () => {
      done = await result.current.send("hi", []);
    });
    expect(done).toBe(false);
    expect(result.current.rulesAccepted).toBe(false);
    expect(result.current.rulesPrompt).toBe(1);
    expect(result.current.actionError).toBe("Accept the community rules first.");
    expect(ids(result.current.messages)).toEqual(["m1", "m2"]);
  });

  it("records rule acceptance", async () => {
    const { result } = await mountLoaded(feed({ messages: [m1], rulesAccepted: false }));
    expect(result.current.rulesAccepted).toBe(false);
    fetchMock.mockResolvedValueOnce(ok({ rulesAccepted: true }));
    await act(async () => {
      await result.current.acceptRules();
    });
    expect(fetchMock).toHaveBeenLastCalledWith(...post("/api/chat/rules/accept", {}));
    expect(result.current.rulesAccepted).toBe(true);
  });

  it("edits a message", async () => {
    const { result } = await mountLoaded();
    fetchMock.mockResolvedValueOnce(ok({ message: { ...m1, content: "better", edited: true } }));
    await act(async () => {
      await result.current.edit("m1", "better");
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      ...post("/api/chat/messages/m1", { content: "better" }, "PATCH")
    );
    expect(result.current.messages[0]).toMatchObject({ content: "better", edited: true });
  });

  it("removes a message from the list and the pinned strip", async () => {
    const { result } = await mountLoaded(feed({ messages: [m1, m2], pinned: [m2] }));
    fetchMock.mockResolvedValueOnce({ ok: true, status: 204 });
    await act(async () => {
      await result.current.remove("m2");
    });
    expect(fetchMock).toHaveBeenLastCalledWith("/api/chat/messages/m2", {
      cache: "no-store",
      method: "DELETE",
    });
    expect(ids(result.current.messages)).toEqual(["m1"]);
    expect(result.current.pinned).toEqual([]);
  });

  it("pins and unpins a message", async () => {
    const { result } = await mountLoaded();
    fetchMock.mockResolvedValueOnce(ok({ message: { ...m2, pinned: true } }));
    await act(async () => {
      await result.current.pin("m2", true);
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      ...post("/api/chat/messages/m2/pin", { pinned: true })
    );
    expect(ids(result.current.pinned)).toEqual(["m2"]);
    expect(result.current.messages[1].pinned).toBe(true);

    fetchMock.mockResolvedValueOnce(ok({ message: { ...m2, pinned: false } }));
    await act(async () => {
      await result.current.pin("m2", false);
    });
    expect(result.current.pinned).toEqual([]);
  });

  it("toggles a reaction using the server's counts", async () => {
    const { result } = await mountLoaded();
    const reactions = [{ emoji: "🎉" as const, count: 2, reacted: true }];
    fetchMock.mockResolvedValueOnce(ok({ messageId: "m1", reactions }));
    await act(async () => {
      await result.current.react("m1", "🎉");
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      ...post("/api/chat/messages/m1/reactions", { emoji: "🎉" })
    );
    expect(result.current.messages[0].reactions).toEqual(reactions);
    expect(result.current.reacting).toBe(false);
  });

  it("keeps messages and reports the error when an action fails", async () => {
    const { result } = await mountLoaded();
    fetchMock.mockResolvedValueOnce(failure("FORBIDDEN", "You cannot edit this message.", 403));
    let done = true;
    await act(async () => {
      done = await result.current.edit("m2", "nope");
    });
    expect(done).toBe(false);
    expect(result.current.actionError).toBe("You cannot edit this message.");
    expect(ids(result.current.messages)).toEqual(["m1", "m2"]);
  });
});
