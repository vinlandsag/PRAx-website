// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Login from "@/app/login/page";
import Tasks from "@/app/tasks/page";
import Dashboard from "@/app/dashboard/page";
import { ProfileView } from "@/components/profile/ProfileView";
import { useResource } from "./use-resource";
const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), query: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => new URLSearchParams(navigation.query),
}));
vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
beforeEach(() => {
  navigation.query = "";
  vi.clearAllMocks();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          Response.json(
            { error: { code: "BACKEND_NOT_CONFIGURED", message: "Service not connected" } },
            { status: 503 }
          )
        )
      )
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function fillSignIn() {
  fireEvent.change(screen.getByLabelText(/Email address/), {
    target: { value: "builder@example.test" },
  });
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "test-password" } });
}
describe("backend handoff frontend", () => {
  it("starts login fields blank without demo credentials or incomplete magic-link controls", () => {
    render(<Login />);
    expect((screen.getByLabelText(/Email address/) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/^Password/) as HTMLInputElement).value).toBe("");
    expect(screen.queryByText(/magic link/i)).toBeNull();
    expect(screen.queryByText(/Dev token/i)).toBeNull();
  });
  it("does not claim successful sign-in when the backend is disconnected", async () => {
    render(<Login />);
    fillSignIn();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Service not connected")).toBeDefined();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(screen.queryByText(/sent to your email/i)).toBeNull();
  });
  it("does not prefill invitation or personal details", () => {
    render(<Login />);
    fireEvent.click(screen.getByRole("radio", { name: "Invite code" }));
    expect((screen.getByLabelText(/Full name/) as HTMLInputElement).value).toBe("");
    expect((screen.getByRole("textbox", { name: /^Invite code/ }) as HTMLInputElement).value).toBe(
      ""
    );
    expect((screen.getByLabelText(/Create password/) as HTMLInputElement).required).toBe(true);
  });
  it("honors safe callback navigation only after real sign-in succeeds", async () => {
    navigation.query = "callbackUrl=%2Fsubmissions";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ user: { id: "real-id", role: "MEMBER", status: "APPROVED" } })
        )
    );
    render(<Login />);
    fillSignIn();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/submissions"));
  });
  it.each(["https://example.test", "//example.test", "/\\example.test", "/login"])(
    "rejects unsafe callback %s",
    async (callback) => {
      navigation.query = new URLSearchParams({ callbackUrl: callback }).toString();
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            Response.json({ user: { id: "real-id", role: "MEMBER", status: "APPROVED" } })
          )
      );
      render(<Login />);
      fillSignIn();
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
      await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/dashboard"));
    }
  );
  it("ends task loading on error without substituting canned tasks or a zero count", async () => {
    render(<Tasks />);
    expect(await screen.findByText("Content unavailable")).toBeDefined();
    expect(screen.queryByText("Optimise one slow SQL query")).toBeNull();
    expect(screen.queryByText("0 matching tasks")).toBeNull();
    expect(screen.queryByLabelText("Loading content")).toBeNull();
  });
  it("does not render dashboard metrics when their source fails", async () => {
    render(<Dashboard />);
    expect(await screen.findByText("Content unavailable")).toBeDefined();
    expect(screen.queryByText("1,240")).toBeNull();
    expect(screen.queryByText("Total points")).toBeNull();
  });
  it("does not invent a profile identity, metrics, skills or activity", () => {
    render(<ProfileView />);
    expect(screen.getByRole("heading", { name: "Member", level: 2 })).toBeDefined();
    expect(screen.queryByText("Arjun Varma")).toBeNull();
    expect(screen.queryByText("1,240")).toBeNull();
    expect(screen.queryByText("Frontend")).toBeNull();
    expect(screen.getAllByText("—")).toHaveLength(4);
  });
});
function ResourceProbe({ path }: { path: string }) {
  const resource = useResource<{ value: string }>(path);
  return (
    <>
      <span>{resource.loading ? "Loading" : resource.error || resource.data?.value}</span>
      <button onClick={() => void resource.refresh()}>Retry</button>
    </>
  );
}
describe("resource lifecycle", () => {
  it("does not show stale responses after changing resource paths", async () => {
    let resolveFirst!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn((path) =>
        path === "/first"
          ? new Promise<Response>((resolve) => {
              resolveFirst = resolve;
            })
          : Promise.resolve(Response.json({ value: "Second result" }))
      )
    );
    const view = render(<ResourceProbe path="/first" />);
    view.rerender(<ResourceProbe path="/second" />);
    expect(await screen.findByText("Second result")).toBeDefined();
    resolveFirst(Response.json({ value: "Old result" }));
    await waitFor(() => expect(screen.queryByText("Old result")).toBeNull());
    expect(screen.getByText("Second result")).toBeDefined();
  });
  it("retries a failed service and renders only the new response", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ error: { message: "Disconnected" } }, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ value: "Connected result" }));
    vi.stubGlobal("fetch", fetcher);
    render(<ResourceProbe path="/resource" />);
    expect(await screen.findByText("Disconnected")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Connected result")).toBeDefined();
  });
});
