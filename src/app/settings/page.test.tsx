// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import SettingsPage from "./page";

vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/layout/ThemeSync", () => ({ applyTheme: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const profile = {
  name: "Test Member",
  handle: "@testmember",
  bio: "",
  skills: [],
  currentProject: "",
  portfolioUrl: "",
  githubUrl: "",
  linkedinUrl: "",
  avatarUrl: "",
};

function settingsPayload(theme: "light" | "dark") {
  return {
    user: { email: "member@example.test", role: "MEMBER" },
    profile,
    settings: {
      theme,
      reviewNotifications: true,
      streakReminder: true,
      chatNotifications: false,
      showPortfolio: true,
    },
  };
}

describe("Settings page API states", () => {
  it("loads preferences, saves them, and reads the server value again after remount", async () => {
    let storedTheme: "light" | "dark" = "light";
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        const body = JSON.parse(String(init.body)) as { theme: "light" | "dark" };
        storedTheme = body.theme;
        return Response.json({
          ...settingsPayload(storedTheme),
          settings: settingsPayload(storedTheme).settings,
        });
      }
      return Response.json(settingsPayload(storedTheme));
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = render(<SettingsPage />);
    expect(screen.getByRole("status", { name: "Loading settings" })).toBeDefined();
    expect(await screen.findByText("member@example.test")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "appearance" }));
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Your settings are saved.")).toBeDefined();
    expect(storedTheme).toBe("dark");

    first.unmount();
    render(<SettingsPage />);
    expect(await screen.findByRole("button", { name: "appearance" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "appearance" }));
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveProperty("checked", true);
    expect(fetchMock).toHaveBeenCalledWith("/api/users/me/settings", { cache: "no-store" });
  });

  it("shows a meaningful load failure and Retry repeats the settings request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          { error: { code: "BACKEND_NOT_CONFIGURED", message: "Settings are unavailable." } },
          { status: 503 }
        )
      )
      .mockResolvedValueOnce(Response.json(settingsPayload("light")));
    vi.stubGlobal("fetch", fetchMock);
    render(<SettingsPage />);

    expect(await screen.findByText("Settings are unavailable.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("member@example.test")).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
