// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OnboardingPage from "./page";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), apiRequest: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@/lib/api/client", () => ({ apiRequest: mocks.apiRequest }));
vi.mock("@/lib/api/use-resource", () => ({
  useResource: () => ({
    data: {
      user: {
        id: "pending-member",
        email: "member@example.test",
        name: "Pending Member",
        role: "MEMBER",
        status: "PENDING_APPROVAL",
      },
    },
    loading: false,
    error: "",
    refresh: vi.fn(),
  }),
}));

describe("pending account onboarding", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.replace.mockReset();
    mocks.refresh.mockReset();
    mocks.apiRequest.mockReset().mockResolvedValue({
      user: { id: "pending-member", role: "MEMBER", status: "PENDING_APPROVAL" },
    });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows the waiting state and opens the dashboard only after approval is returned", async () => {
    render(<OnboardingPage />);
    expect(screen.getByText(/checks for approval automatically/).textContent).toContain(
      "workspace access will be available after an administrator approves"
    );

    mocks.apiRequest.mockResolvedValueOnce({
      user: { id: "pending-member", role: "MEMBER", status: "APPROVED" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(mocks.apiRequest).toHaveBeenCalledWith("/api/users/me");
    expect(mocks.replace).toHaveBeenCalledWith("/dashboard");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
});
