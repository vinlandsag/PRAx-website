"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestError, apiRequest } from "@/lib/api/client";
import type {
  ChatFeed,
  ChatMessage,
  ChatReaction,
  ChatTombstone,
  ChatViewer,
  ReactionEmoji,
} from "./types";

export const CHAT_PAGE_SIZE = 50;
export const CHAT_POLL_MS = 15_000;
/** Re-ask for changes slightly before the last server time to tolerate clock skew. */
const OVERLAP_MS = 2_000;
/** A poll that returns a full page is repeated at once, up to this many times per tick. */
const MAX_CATCH_UP = 5;
export const CHAT_RULES_ERROR = "CHAT_RULES_NOT_ACCEPTED";

const MESSAGES_PATH = "/api/chat/messages";

export interface ChatState {
  loaded: boolean;
  messages: ChatMessage[];
  pinned: ChatMessage[];
  viewer: ChatViewer | null;
  rulesAccepted: boolean;
  hasMore: boolean;
  nextBefore: string | null;
  serverTime: string | null;
  /** Set only while nothing has loaded yet. Loaded messages are never hidden by an error. */
  error: string;
  /** True after a failed refresh when messages are still on screen. */
  connectionLost: boolean;
}

export const initialChatState: ChatState = {
  loaded: false,
  messages: [],
  pinned: [],
  viewer: null,
  rulesAccepted: true,
  hasMore: false,
  nextBefore: null,
  serverTime: null,
  error: "",
  connectionLost: false,
};

const isTombstone = (item: ChatMessage | ChatTombstone): item is ChatTombstone =>
  "deleted" in item && item.deleted === true;

const byAge = (a: ChatMessage, b: ChatMessage) =>
  a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id < b.id ? -1 : 1;

/** Adds or replaces messages by id and keeps oldest-first order. */
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) map.set(m.id, m);
  return [...map.values()].sort(byAge);
}

/** Applies edits, pins, reaction changes and removals to messages that are already held. */
export function applyUpdates(
  current: ChatMessage[],
  updates: Array<ChatMessage | ChatTombstone>
): ChatMessage[] {
  const removed = new Set(updates.filter(isTombstone).map((u) => u.id));
  const changed = updates.filter((u): u is ChatMessage => !isTombstone(u));
  const known = new Set(current.map((m) => m.id));
  return mergeMessages(
    current.filter((m) => !removed.has(m.id)),
    changed.filter((m) => known.has(m.id))
  );
}

export function reduceFeed(state: ChatState, feed: ChatFeed, mode: "replace" | "after"): ChatState {
  const messages =
    mode === "replace"
      ? mergeMessages([], feed.messages)
      : mergeMessages(applyUpdates(state.messages, feed.updates), feed.messages);
  return {
    loaded: true,
    messages,
    pinned: feed.pinned,
    viewer: feed.viewer,
    rulesAccepted: feed.rulesAccepted,
    hasMore: mode === "replace" ? feed.hasMore : state.hasMore,
    nextBefore: mode === "replace" ? feed.nextBefore : state.nextBefore,
    serverTime: feed.serverTime,
    error: "",
    connectionLost: false,
  };
}

function messagesUrl(params: { before?: string; after?: string; updatedSince?: string } = {}) {
  const query = new URLSearchParams({ limit: String(CHAT_PAGE_SIZE) });
  if (params.before) query.set("before", params.before);
  if (params.after) query.set("after", params.after);
  if (params.updatedSince) query.set("updatedSince", params.updatedSince);
  return `${MESSAGES_PATH}?${query}`;
}

function sinceServerTime(serverTime: string | null) {
  const time = serverTime ? Date.parse(serverTime) : NaN;
  return Number.isNaN(time) ? undefined : new Date(time - OVERLAP_MS).toISOString();
}

const replaceIn = (list: ChatMessage[], message: ChatMessage) =>
  list.map((m) => (m.id === message.id ? message : m));
const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);
const post = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/**
 * Community chat state with cursor polling.
 *
 * Calls /api/chat/messages and related routes, which are implemented in a later stage. Until then
 * requests fail and are reported; nothing is simulated or stored locally.
 *
 * A failed poll never clears loaded messages and never stops polling: the interval does not depend
 * on loaded data, requests do not overlap, and a later success clears the connection notice.
 */
export function useChat() {
  const [state, setState] = useState<ChatState>(initialChatState),
    [saving, setSaving] = useState(false),
    [reacting, setReacting] = useState(false),
    [loadingOlder, setLoadingOlder] = useState(false),
    [actionError, setActionError] = useState(""),
    [rulesPrompt, setRulesPrompt] = useState(0);
  const latest = useRef(initialChatState),
    inFlight = useRef(false),
    mounted = useRef(true);
  const commit = useCallback((change: (current: ChatState) => ChatState) => {
    latest.current = change(latest.current);
    setState(latest.current);
  }, []);

  const poll = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      let reload = !latest.current.loaded;
      for (let round = 0; round < MAX_CATCH_UP; round++) {
        const current = latest.current;
        const newest = current.messages.at(-1)?.id;
        const full = reload || !newest;
        const feed = await apiRequest<ChatFeed>(
          full
            ? messagesUrl()
            : messagesUrl({ after: newest, updatedSince: sinceServerTime(current.serverTime) })
        );
        if (!mounted.current) return;
        if (!full && feed.resync) {
          reload = true;
          continue;
        }
        commit((s) => reduceFeed(s, feed, full ? "replace" : "after"));
        if (full || feed.messages.length < CHAT_PAGE_SIZE) break;
      }
    } catch (e) {
      if (!mounted.current) return;
      commit((s) =>
        s.loaded
          ? { ...s, connectionLost: true }
          : { ...s, error: message(e, "Could not load community messages.") }
      );
    } finally {
      inFlight.current = false;
    }
  }, [commit]);

  useEffect(() => {
    mounted.current = true;
    void poll();
    const timer = window.setInterval(() => void poll(), CHAT_POLL_MS);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [poll]);

  const run = useCallback(
    async <T>(
      request: () => Promise<T>,
      onSuccess: (result: T) => void,
      flag: (value: boolean) => void = setSaving
    ) => {
      flag(true);
      setActionError("");
      try {
        const result = await request();
        if (mounted.current) onSuccess(result);
        return true;
      } catch (e) {
        if (!mounted.current) return false;
        if (e instanceof ApiRequestError && e.code === CHAT_RULES_ERROR) {
          commit((s) => ({ ...s, rulesAccepted: false }));
          setRulesPrompt((n) => n + 1);
        }
        setActionError(message(e, "Could not save changes."));
        return false;
      } finally {
        if (mounted.current) flag(false);
      }
    },
    [commit]
  );

  const replaceMessage = useCallback(
    (updated: ChatMessage) =>
      commit((s) => ({
        ...s,
        messages: replaceIn(s.messages, updated),
        pinned: replaceIn(s.pinned, updated),
      })),
    [commit]
  );

  const send = useCallback(
    (content: string, attachmentIds: string[] = []) =>
      run(
        () =>
          apiRequest<{ message: ChatMessage }>(
            MESSAGES_PATH,
            post({ content, ...(attachmentIds.length ? { attachmentIds } : {}) })
          ),
        ({ message: created }) =>
          commit((s) => ({ ...s, messages: mergeMessages(s.messages, [created]) }))
      ),
    [run, commit]
  );

  const edit = useCallback(
    (id: string, content: string) =>
      run(
        () =>
          apiRequest<{ message: ChatMessage }>(`${MESSAGES_PATH}/${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          }),
        ({ message: updated }) => replaceMessage(updated)
      ),
    [run, replaceMessage]
  );

  const remove = useCallback(
    (id: string) =>
      run(
        () => apiRequest<void>(`${MESSAGES_PATH}/${encodeURIComponent(id)}`, { method: "DELETE" }),
        () =>
          commit((s) => ({
            ...s,
            messages: s.messages.filter((m) => m.id !== id),
            pinned: s.pinned.filter((m) => m.id !== id),
          }))
      ),
    [run, commit]
  );

  const pin = useCallback(
    (id: string, pinned: boolean) =>
      run(
        () =>
          apiRequest<{ message: ChatMessage }>(
            `${MESSAGES_PATH}/${encodeURIComponent(id)}/pin`,
            post({ pinned })
          ),
        ({ message: updated }) =>
          commit((s) => ({
            ...s,
            messages: replaceIn(s.messages, updated),
            pinned: updated.pinned
              ? mergeMessages(s.pinned, [updated]).reverse()
              : s.pinned.filter((m) => m.id !== id),
          }))
      ),
    [run, commit]
  );

  const react = useCallback(
    (id: string, emoji: ReactionEmoji) =>
      run(
        () =>
          apiRequest<{ messageId: string; reactions: ChatReaction[] }>(
            `${MESSAGES_PATH}/${encodeURIComponent(id)}/reactions`,
            post({ emoji })
          ),
        ({ messageId, reactions }) =>
          commit((s) => {
            const apply = (m: ChatMessage) => (m.id === messageId ? { ...m, reactions } : m);
            return { ...s, messages: s.messages.map(apply), pinned: s.pinned.map(apply) };
          }),
        setReacting
      ),
    [run, commit]
  );

  const acceptRules = useCallback(
    () =>
      run(
        () => apiRequest<{ rulesAccepted: boolean }>("/api/chat/rules/accept", post({})),
        () => commit((s) => ({ ...s, rulesAccepted: true }))
      ),
    [run, commit]
  );

  const loadOlder = useCallback(async () => {
    const before = latest.current.nextBefore;
    if (!before || !latest.current.hasMore) return false;
    return run(
      () => apiRequest<ChatFeed>(messagesUrl({ before })),
      (feed) =>
        commit((s) => ({
          ...s,
          messages: mergeMessages(s.messages, feed.messages),
          hasMore: feed.hasMore,
          nextBefore: feed.nextBefore,
        })),
      setLoadingOlder
    );
  }, [run, commit]);

  const clearActionError = useCallback(() => setActionError(""), []);

  return {
    loaded: state.loaded,
    messages: state.messages,
    pinned: state.pinned,
    viewer: state.viewer,
    rulesAccepted: state.rulesAccepted,
    hasMore: state.hasMore,
    error: state.error,
    connectionLost: state.connectionLost,
    saving,
    reacting,
    loadingOlder,
    actionError,
    /** Increases each time the server refuses a post because the rules are not accepted. */
    rulesPrompt,
    clearActionError,
    refresh: poll,
    loadOlder,
    send,
    edit,
    remove,
    pin,
    react,
    acceptRules,
  };
}
