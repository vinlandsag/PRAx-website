// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ProfileView } from "./ProfileView";

// Route authorization and navigation are tested separately. Keep these tests focused
// on profile content surviving header layout changes; browser tests own CSS geometry.
vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

afterEach(cleanup);

describe("ProfileView header content", () => {
  it("preserves the member identity, accessible avatar and edit action", () => {
    render(
      <ProfileView
        name="Arjun Varma"
        handle="@arjunbuilds"
        bio="Building useful things, learning in public, and sharing the process."
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "My profile" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: "Arjun Varma" })).toBeDefined();
    expect(screen.getByRole("img", { name: "Arjun Varma" })).toBeDefined();
    expect(screen.getByText("@arjunbuilds")).toBeDefined();
    expect(
      screen.getByText("Building useful things, learning in public, and sharing the process.")
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Edit profile" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "View portfolio" })).toBeNull();
  });

  it("preserves public profile content without showing member edit actions", () => {
    render(
      <ProfileView
        isPublic
        name="Meera Shah"
        handle="@meerashah"
        portfolioUrl="https://example.com"
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Member profile" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: "Meera Shah" })).toBeDefined();
    expect(screen.getByRole("img", { name: "Meera Shah" })).toBeDefined();
    expect(screen.getByRole("link", { name: "View portfolio" })).toBeDefined();
    expect(screen.queryByRole("button", { name: /Edit/ })).toBeNull();
  });

  it("retains complete long identity text through the responsive header composition", () => {
    const name = "Alexandria Catherine Montgomery-Wellington";
    const handle = "@alexandria_builds_accessible_community_tools";
    const bio =
      "Building accessible community tools with clear documentation and sharing each measured improvement.";
    render(<ProfileView name={name} handle={handle} bio={bio} />);

    expect(screen.getByRole("heading", { level: 2, name }).textContent).toBe(name);
    expect(screen.getByRole("img", { name })).toBeDefined();
    expect(screen.getByText(handle).textContent).toBe(handle);
    expect(screen.getByText(bio).textContent).toBe(bio);
    expect(screen.getByRole("button", { name: "Edit profile" })).toBeDefined();
  });

  it("keeps existing social links and profile metrics available after header restructuring", () => {
    render(
      <ProfileView
        portfolioUrl="https://portfolio.dev"
        githubUrl="https://github.com"
        linkedinUrl="https://linkedin.com"
        totalPoints="2,345"
        weeklyRank="#3"
        dayStreak="17"
        tasksApproved="41"
      />
    );

    for (const [name, href] of [
      [/^Portfolio/, "https://portfolio.dev"],
      [/^GitHub/, "https://github.com"],
      [/^LinkedIn/, "https://linkedin.com"],
    ] as const) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("href")).toBe(href);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noreferrer");
    }
    for (const value of ["2,345", "#3", "17", "41"]) {
      expect(screen.getByText(value)).toBeDefined();
    }
  });
});

describe("Profile edit actions", () => {
  it("offers portfolio setup when missing and routes edit actions", () => {
    const edit = vi.fn(),
      skills = vi.fn(),
      project = vi.fn();
    render(
      <ProfileView skills={[]} onEditProfile={edit} onEditSkills={skills} onEditProject={project} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit →" }));
    fireEvent.click(screen.getAllByRole("button", { name: /Add portfolio/ })[0]);
    expect(edit).toHaveBeenCalledOnce();
    expect(skills).toHaveBeenCalledOnce();
    expect(project).toHaveBeenCalledOnce();
  });
  it("does not invent a portfolio on public profiles", () => {
    render(<ProfileView isPublic />);
    expect(screen.getByText("No portfolio shared")).toBeDefined();
    expect(screen.queryByRole("link", { name: /View portfolio/ })).toBeNull();
  });
});
