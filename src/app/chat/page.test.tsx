// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ChatPage from "./page";
import type { ChatMessage } from "@/lib/workspace/types";

// The chat routes (/api/chat/messages and friends) are built in a later stage. This test replaces
// the useChat hook; the page itself is exercised for real and nothing is simulated in the app.
const state = vi.hoisted(() => ({ chat: {} as Record<string, unknown> }));
vi.mock("@/lib/workspace/use-chat", () => ({ useChat: () => state.chat }));
vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

const msg = (id: string, authorId: string, author: string, extra: Partial<ChatMessage> = {}) =>
  ({
    id,
    authorId,
    author,
    authorAvatarUrl: "",
    content: `${author}'s update`,
    createdAt: "2026-11-02T10:00:00Z",
    edited: false,
    pinned: false,
    reactions: [],
    ...extra,
  }) satisfies ChatMessage;

function makeChat(overrides: Record<string, unknown> = {}) {
  return {
    loaded: true,
    messages: [msg("m1", "me", "Test Builder"), msg("m2", "other", "Other builder")],
    pinned: [],
    viewer: { id: "me", role: "MEMBER" },
    rulesAccepted: true,
    hasMore: false,
    error: "",
    connectionLost: false,
    saving: false,
    reacting: false,
    loadingOlder: false,
    actionError: "",
    rulesPrompt: 0,
    clearActionError: vi.fn(),
    refresh: vi.fn(),
    loadOlder: vi.fn().mockResolvedValue(true),
    send: vi.fn().mockResolvedValue(true),
    edit: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
    pin: vi.fn().mockResolvedValue(true),
    react: vi.fn().mockResolvedValue(true),
    acceptRules: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}
const chat = () => state.chat as ReturnType<typeof makeChat>;
const open = (author: string) =>
  fireEvent.click(screen.getByRole("button", { name: `Message actions for ${author}` }));

beforeEach(() => {
  state.chat = makeChat();
});
afterEach(cleanup);

describe("community chat page", () => {
  it("links every author to their profile and shows avatar images when provided", () => {
    state.chat = makeChat({
      messages: [
        msg("m1", "me", "Test Builder", { authorAvatarUrl: "https://example.test/me.png" }),
        msg("m2", "other", "Other builder"),
      ],
    });
    const { container } = render(<ChatPage />);
    expect(
      screen.getByRole("link", { name: "View profile of Other builder" }).getAttribute("href")
    ).toBe("/members/other?from=chat");
    expect(container.querySelector('img[src="https://example.test/me.png"]')).not.toBeNull();
    const other = screen.getByRole("article", { name: "Message by Other builder" });
    expect(other.querySelector("img")).toBeNull();
  });

  it("shows timestamps, edited marks and the pinned strip", () => {
    state.chat = makeChat({
      messages: [msg("m1", "me", "Test Builder", { edited: true, pinned: true })],
      pinned: [msg("m1", "me", "Test Builder", { pinned: true })],
    });
    const { container } = render(<ChatPage />);
    expect(container.querySelector("time")?.getAttribute("datetime")).toBe("2026-11-02T10:00:00Z");
    expect(screen.getByText("Edited")).toBeDefined();
    expect(screen.getByText(/Pinned ·/)).toBeDefined();
  });

  it("reacts to a message from the palette", () => {
    render(<ChatPage />);
    fireEvent.click(
      screen.getByRole("button", { name: "Add reaction to message by Other builder" })
    );
    fireEvent.click(screen.getByRole("button", { name: "React with 🎉" }));
    expect(chat().react).toHaveBeenCalledWith("m2", "🎉");
  });

  it("sends a typed message through the chat hook", async () => {
    render(<ChatPage />);
    fireEvent.change(screen.getByRole("textbox", { name: /Message #general/ }), {
      target: { value: "hello team" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(chat().send).toHaveBeenCalledWith("hello team", []));
  });

  it("asks for the rules on the first visit and records acceptance", async () => {
    state.chat = makeChat({ rulesAccepted: false });
    render(<ChatPage />);
    const dialog = screen.getByRole("dialog", { name: "Community rules" });
    expect(within(dialog).getByText(/read and accept the rules/)).toBeDefined();
    fireEvent.click(within(dialog).getByRole("button", { name: "I agree to these rules" }));
    await waitFor(() => expect(chat().acceptRules).toHaveBeenCalledTimes(1));
  });

  it("lets a member postpone the rules but keeps the notice and can reopen them", () => {
    state.chat = makeChat({ rulesAccepted: false });
    render(<ChatPage />);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(/Accept the community rules to post/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Review rules" }));
    expect(screen.getByRole("dialog", { name: "Community rules" })).toBeDefined();
  });

  it("reopens the rules when the server refuses a post", () => {
    state.chat = makeChat({ rulesAccepted: false });
    const view = render(<ChatPage />);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    state.chat = makeChat({ rulesAccepted: false, rulesPrompt: 1 });
    view.rerender(<ChatPage />);
    expect(screen.getByRole("dialog", { name: "Community rules" })).toBeDefined();
  });

  it("does not interrupt members who already accepted, but still shows the rules on request", () => {
    render(<ChatPage />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Community rules" }));
    const dialog = screen.getByRole("dialog", { name: "Community rules" });
    expect(within(dialog).getByRole("button", { name: "Got it" })).toBeDefined();
    expect(within(dialog).queryByRole("button", { name: "I agree to these rules" })).toBeNull();
  });

  it("keeps the messages visible while the connection is being restored", () => {
    state.chat = makeChat({ connectionLost: true });
    render(<ChatPage />);
    expect(screen.getByText(/Reconnecting/)).toBeDefined();
    expect(screen.getByRole("article", { name: "Message by Other builder" })).toBeDefined();
  });

  it("shows a load error with a retry and no messages", () => {
    state.chat = makeChat({ loaded: false, error: "Could not load community messages." });
    render(<ChatPage />);
    expect(screen.getByText(/Could not load community messages/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(chat().refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("article")).toBeNull();
  });

  it("loads older messages on request", () => {
    state.chat = makeChat({ hasMore: true });
    render(<ChatPage />);
    fireEvent.click(screen.getByRole("button", { name: "Load older messages" }));
    expect(chat().loadOlder).toHaveBeenCalledTimes(1);
  });

  it("edits the member's own message and disables edit and pin for others", async () => {
    render(<ChatPage />);
    open("Test Builder");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "Revised update" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save message" }));
    await waitFor(() => expect(chat().edit).toHaveBeenCalledWith("m1", "Revised update"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    open("Other builder");
    expect((screen.getByRole("button", { name: "Edit" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement).disabled).toBe(
      true
    );
    expect((screen.getByRole("button", { name: "Pin" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("says a deleted message is removed for everyone, without promising permanent erasure", async () => {
    render(<ChatPage />);
    open("Test Builder");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(
      screen.getByText("This removes the message from the community channel for everyone.")
    ).toBeDefined();
    expect(document.body.textContent).not.toMatch(/permanently/i);
    fireEvent.click(screen.getByRole("button", { name: "Delete message" }));
    await waitFor(() => expect(chat().remove).toHaveBeenCalledWith("m1"));
  });

  it("lets an admin remove and pin other members' messages", async () => {
    state.chat = makeChat({ viewer: { id: "admin", role: "ADMIN" } });
    render(<ChatPage />);
    open("Other builder");
    expect((screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement).disabled).toBe(
      false
    );
    fireEvent.click(screen.getByRole("button", { name: "Pin" }));
    await waitFor(() => expect(chat().pin).toHaveBeenCalledWith("m2", true));
  });

  it("offers Unpin for a pinned message", async () => {
    state.chat = makeChat({
      viewer: { id: "admin", role: "ADMIN" },
      messages: [msg("m2", "other", "Other builder", { pinned: true })],
    });
    render(<ChatPage />);
    open("Other builder");
    fireEvent.click(screen.getByRole("button", { name: "Unpin" }));
    await waitFor(() => expect(chat().pin).toHaveBeenCalledWith("m2", false));
  });

  it("gives the touched controls at least a 44px target", () => {
    render(<ChatPage />);
    for (const name of [
      "Community rules",
      "Message actions for Test Builder",
      "Message actions for Other builder",
    ]) {
      const button = screen.getByRole("button", { name });
      expect(button.className).toContain("min-h-11");
    }
  });
});
