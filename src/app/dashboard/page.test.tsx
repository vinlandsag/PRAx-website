// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import DashboardPage from "./page";

vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Dashboard page API states", () => {
  it("shows loading, then empty activity and persisted summary metrics", async () => {
    let resolveFetch!: (response: Response) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<DashboardPage />);

    expect(screen.getByRole("status", { name: "Loading content" })).toBeDefined();
    resolveFetch(
      Response.json({
        totalPoints: 0,
        weeklyRank: null,
        dayStreak: 0,
        tasksApproved: 0,
        activity: [],
      })
    );

    expect(await screen.findByText("No activity yet")).toBeDefined();
    expect(screen.getAllByText("0")).toHaveLength(3);
    expect(screen.getByText("—")).toBeDefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/dashboard", { cache: "no-store" });
  });

  it("shows API errors and Retry repeats the dashboard request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          { error: { code: "INTERNAL_ERROR", message: "Dashboard is temporarily unavailable." } },
          { status: 500 }
        )
      )
      .mockResolvedValueOnce(
        Response.json({
          totalPoints: 45,
          weeklyRank: 2,
          dayStreak: 3,
          tasksApproved: 4,
          activity: [
            {
              id: "approval-1",
              title: "Approved: Example task",
              createdAt: "2026-11-01T10:00:00.000Z",
            },
          ],
        })
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<DashboardPage />);

    expect(await screen.findByText("Dashboard is temporarily unavailable.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Approved: Example task")).toBeDefined();
    expect(screen.getByText("45")).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
