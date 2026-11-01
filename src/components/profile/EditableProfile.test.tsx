// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EditableProfile } from "./EditableProfile";

vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const profile = {
  name: "Milan Member",
  handle: "@milanbuilds",
  bio: "",
  skills: [],
  currentProject: "",
  portfolioUrl: "",
  githubUrl: "",
  linkedinUrl: "",
  avatarUrl: "",
};
const stats = { totalPoints: 1234, weeklyRank: 2, dayStreak: 6, tasksApproved: 8 };

describe("EditableProfile API states", () => {
  it("loads persisted fields, shows optional-field empty states, saves, and displays success", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ profile, stats }))
      .mockResolvedValueOnce(
        Response.json({ profile: { ...profile, name: "Milan Updated" }, stats })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<EditableProfile />);
    expect(screen.getByLabelText("Loading profile")).toBeDefined();
    expect(await screen.findByRole("heading", { level: 2, name: "Milan Member" })).toBeDefined();
    expect(screen.getByText("Add your skills and interests with Edit.")).toBeDefined();
    expect(screen.getByText("Add what you are building")).toBeDefined();
    expect(screen.getByText("1,234")).toBeDefined();
    expect(screen.getByText("#2")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
    await screen.findByRole("dialog");
    fireEvent.change(screen.getByRole("textbox", { name: /Display name/ }), {
      target: { value: "Milan Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Your profile has been saved.")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: "Milan Updated" })).toBeDefined();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/users/me/profile",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          name: "Milan Updated",
          handle: "@milanbuilds",
          bio: "",
          githubUrl: "",
          linkedinUrl: "",
          avatarUrl: "",
        }),
      })
    );
  });

  it("shows a read error and retries the existing endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          { error: { code: "BACKEND_NOT_CONFIGURED", message: "Profile unavailable." } },
          { status: 503 }
        )
      )
      .mockResolvedValueOnce(Response.json({ profile, stats }));
    vi.stubGlobal("fetch", fetchMock);

    render(<EditableProfile />);
    expect(await screen.findByText("Profile unavailable.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.getByRole("heading", { level: 2, name: "Milan Member" })).toBeDefined());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
