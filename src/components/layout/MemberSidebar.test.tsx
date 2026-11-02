// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemberSidebar } from "./MemberSidebar";

const state = vi.hoisted(() => ({ currentUser: null as unknown }));

vi.mock("next/navigation", () => ({ usePathname: () => "/settings" }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/lib/workspace/use-workspace", () => ({ useWorkspace: () => ({ data: null }) }));
vi.mock("@/lib/api/use-resource", () => ({
  useResource: () => ({ data: state.currentUser }),
}));

afterEach(() => {
  cleanup();
  state.currentUser = null;
});

describe("MemberSidebar role-aware admin link", () => {
  it("shows the admin workspace link for an authenticated admin when workspace data is unavailable", async () => {
    state.currentUser = {
      user: {
        id: "admin-id",
        email: "admin@example.test",
        name: "Workspace Admin",
        role: "ADMIN",
        status: "APPROVED",
      },
    };

    render(<MemberSidebar />);

    const adminLink = await screen.findByRole("link", { name: "Admin" });
    expect(adminLink.getAttribute("href")).toBe("/admin");
    expect(await screen.findByText("Workspace Admin")).not.toBeNull();
    expect(screen.getByText("Administrator")).not.toBeNull();
  });

  it("does not show the admin workspace link for members", async () => {
    state.currentUser = {
      user: {
        id: "member-id",
        email: "member@example.test",
        name: "Workspace Member",
        role: "MEMBER",
        status: "APPROVED",
      },
    };

    render(<MemberSidebar />);

    expect(await screen.findByText("Workspace Member")).not.toBeNull();
    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
    expect(screen.getByText("Builder")).not.toBeNull();
  });
});
