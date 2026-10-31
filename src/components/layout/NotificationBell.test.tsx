// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NotificationBell } from "./NotificationBell";
const item = {
  id: "notice-1",
  title: "Review completed",
  message: "Your submission has been reviewed.",
  createdAt: "2026-10-29T10:00:00Z",
  readAt: null,
  href: "/submissions",
};
const response = (notifications: unknown[]) => Response.json({ notifications });
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([])));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("notification bell", () => {
  it("opens a named dialog without a fabricated unread badge", async () => {
    render(<NotificationBell />);
    const trigger = screen.getByRole("button", { name: "Notifications" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(await screen.findByText("You're all caught up")).toBeDefined();
    const dialog = screen.getByRole("dialog", { name: "Notifications" });
    expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);
    expect(screen.queryByText("Unread ·")).toBeNull();
  });
  it("shows loading until the feed completes", async () => {
    let resolve!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        () =>
          new Promise<Response>((r) => {
            resolve = r;
          })
      )
    );
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByLabelText("Loading notifications")).toBeDefined();
    resolve(response([]));
    expect(await screen.findByText("You're all caught up")).toBeDefined();
  });
  it("shows a service error and retries without fake updates", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ error: { message: "Service not connected" } }, { status: 503 })
      )
      .mockImplementation(() => Promise.resolve(response([])));
    vi.stubGlobal("fetch", fetcher);
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(await screen.findByText("Notifications unavailable")).toBeDefined();
    expect(screen.getByText("Service not connected")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("You're all caught up")).toBeDefined();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("renders supplied notifications and marks them read only after the server accepts", async () => {
    let read = false;
    const fetcher = vi.fn((_path, options) => {
      if (options?.method === "PATCH") {
        read = true;
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(response([{ ...item, readAt: read ? "2026-10-29T10:10:00Z" : null }]));
    });
    vi.stubGlobal("fetch", fetcher);
    render(<NotificationBell />);
    await screen.findByRole("button", { name: "Notifications, 1 unread" });
    fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
    expect(await screen.findByText("Review completed")).toBeDefined();
    expect(screen.getByRole("link", { name: "View update" }).getAttribute("href")).toBe(
      "/submissions"
    );
    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Mark all read" })).toBeNull());
    expect(fetcher).toHaveBeenCalledWith(
      "/api/notifications",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ operation: "mark-all-read" }),
      })
    );
  });
  it("keeps unread state when marking read fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_path, options) =>
        Promise.resolve(
          options?.method === "PATCH"
            ? Response.json({ error: { message: "Could not save" } }, { status: 503 })
            : response([item])
        )
      )
    );
    render(<NotificationBell />);
    const trigger = await screen.findByRole("button", { name: "Notifications, 1 unread" });
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole("button", { name: "Mark all read" }));
    expect(await screen.findByText("Could not save")).toBeDefined();
    expect(screen.getByText("Unread ·")).toBeDefined();
  });
  it("dismisses with Escape and restores focus to the trigger", async () => {
    render(<NotificationBell />);
    const trigger = screen.getByRole("button", { name: "Notifications" });
    trigger.focus();
    fireEvent.click(trigger);
    await screen.findByRole("dialog", { name: "Notifications" });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
  it("traps keyboard focus and dismisses through its close control or backdrop", async () => {
    render(<NotificationBell />);
    const trigger = screen.getByRole("button", { name: "Notifications" });
    trigger.focus();
    fireEvent.click(trigger);
    await screen.findByText("You're all caught up");
    const dialog = screen.getByRole("dialog");
    const link = within(dialog).getByRole("link", { name: "Notification preferences" });
    link.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close dialog" }));
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("does not render external or executable notification links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          response([
            { ...item, href: "javascript:alert(1)" },
            { ...item, id: "notice-2", href: "//example.test" },
          ])
        )
      )
    );
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    await screen.findAllByText("Review completed");
    expect(screen.queryByRole("link", { name: "View update" })).toBeNull();
  });
});
