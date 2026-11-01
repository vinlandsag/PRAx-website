// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TopNav } from "./TopNav";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/lib/workspace/use-workspace", () => ({ useWorkspace: () => ({ data: null }) }));
vi.mock("./GlobalSearch", () => ({ GlobalSearch: () => null }));
vi.mock("./NotificationBell", () => ({ NotificationBell: () => null }));
vi.mock("../ui/Avatar", () => ({ Avatar: () => <span>Avatar</span> }));

beforeEach(() => {
  replace.mockReset();
  refresh.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TopNav sign out", () => {
  it("clears the existing session and sends the user to login", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    render(<TopNav breadcrumbs={["PRAX", "Profile"]} />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(fetcher).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("shows an error and keeps the current page when logout fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    render(<TopNav breadcrumbs={["PRAX", "Profile"]} />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Could not sign out");
    expect(replace).not.toHaveBeenCalled();
  });
});
