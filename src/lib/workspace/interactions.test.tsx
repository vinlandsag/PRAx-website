// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { WorkspaceData } from "./types";
import Tasks from "@/app/tasks/page";
import Space from "@/app/space/page";
import Leaderboard from "@/app/leaderboard/page";
import Chat from "@/app/chat/page";
import Settings from "@/app/settings/page";
import { EditableProfile } from "@/components/profile/EditableProfile";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { ThemeSync } from "@/components/layout/ThemeSync";
import MemberProfile from "@/app/members/[id]/page";
import TaskDetail from "@/app/tasks/[id]/page";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  params: "",
  pathname: "/settings",
  paramId: "usr_member_01",
  data: null as WorkspaceData | null,
}));
vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useParams: () => ({ id: mocks.paramId }),
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, refresh: mocks.refresh }),
  useSearchParams: () => new URLSearchParams(mocks.params),
}));
vi.mock("./use-workspace", () => ({
  useWorkspace: () => ({
    data: mocks.data,
    error: "",
    saving: false,
    mutate: mocks.mutate,
    refresh: mocks.refresh,
  }),
}));
function fixture(): WorkspaceData {
  return {
    user: {
      id: "usr_member_01",
      name: "Test Builder",
      email: "builder@example.test",
      role: "MEMBER",
      status: "APPROVED",
    },
    profile: {
      name: "Test Builder",
      handle: "@builder",
      bio: "Building",
      skills: ["React"],
      currentProject: "",
      portfolioUrl: "",
      githubUrl: "",
      linkedinUrl: "",
      avatarUrl: "",
    },
    settings: {
      theme: "light",
      reviewNotifications: true,
      streakReminder: true,
      chatNotifications: false,
      showPortfolio: true,
    },
    todos: [
      {
        id: "todo-1",
        title: "Polish forms",
        description: "Focus and errors",
        difficulty: "Hard",
        priority: "High",
        dueDate: "2026-11-01",
        completed: false,
      },
    ],
    notes: [{ id: "note-1", title: "Research", content: "Useful notes", updatedAt: "2026-10-29" }],
    goals: [
      { id: "goal-1", title: "Ship toolkit", description: "Reusable controls", progress: 30 },
    ],
    messages: [
      {
        id: "message-1",
        authorId: "usr_member_01",
        author: "Test Builder",
        content: "My update",
        createdAt: "2026-10-29T10:00:00Z",
        edited: false,
        pinned: false,
      },
      {
        id: "message-2",
        authorId: "someone",
        author: "Other builder",
        content: "Other update",
        createdAt: "2026-10-29T10:00:00Z",
        edited: false,
        pinned: false,
      },
    ],
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.mutate.mockResolvedValue(true);
  mocks.params = "";
  mocks.pathname = "/settings";
  mocks.paramId = "usr_member_01";
  mocks.data = fixture();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
});

describe("functional member controls", () => {
  it("opens profiles from chat and leaderboard without a Members directory", () => {
    const chat = render(<Chat />);
    expect(
      screen.getByRole("link", { name: "View profile of Other builder" }).getAttribute("href")
    ).toBe("/members/someone?from=chat");
    chat.unmount();
    render(<Leaderboard />);
    expect(
      screen.getByRole("link", { name: "View profile of Kabir Nair" }).getAttribute("href")
    ).toBe("/members/demo_kabir?from=leaderboard");
    expect(screen.queryByRole("link", { name: "Members" })).toBeNull();
  });
  it("labels a sample profile and returns to its originating leaderboard", async () => {
    mocks.params = "from=leaderboard";
    mocks.paramId = "demo_meera";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ profile: fixture().profile, isDemo: true }),
      })
    );
    render(<MemberProfile />);
    expect(await screen.findByText(/Sample profile/)).toBeDefined();
    expect(screen.getByRole("link", { name: "← Back to leaderboard" }).getAttribute("href")).toBe(
      "/leaderboard"
    );
  });
  it("offers community pinning to an admin through the action dialog", async () => {
    mocks.data!.user = { ...mocks.data!.user, id: "usr_admin_01", role: "ADMIN" };
    render(<Chat />);
    fireEvent.click(screen.getByRole("button", { name: "Message actions for Other builder" }));
    fireEvent.click(screen.getByRole("button", { name: "Pin" }));
    await waitFor(() =>
      expect(mocks.mutate).toHaveBeenCalledWith({
        resource: "messages",
        operation: "pin",
        id: "message-2",
        data: {},
      })
    );
  });
  it("loads the requested public profile without private edit actions", async () => {
    const profile = { ...fixture().profile, portfolioUrl: "" };
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ profile }) });
    vi.stubGlobal("fetch", fetcher);
    render(<MemberProfile />);
    expect(await screen.findByRole("heading", { name: "Test Builder", level: 2 })).toBeDefined();
    expect(fetcher).toHaveBeenCalledWith("/api/workspace?memberId=usr_member_01", {
      cache: "no-store",
    });
    expect(screen.getByText("No portfolio shared")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Edit profile" })).toBeNull();
  });
  it("uses the selected task id for detail content and handles unknown ids", () => {
    mocks.paramId = "2";
    const view = render(<TaskDetail />);
    expect(
      screen.getByRole("heading", { name: "Ship a landing page in 3 hours", level: 1 })
    ).toBeDefined();
    expect(screen.getByText("40 points maximum")).toBeDefined();
    mocks.paramId = "unknown";
    view.rerender(<TaskDetail />);
    expect(screen.getByText("Task not found")).toBeDefined();
  });
  it("syncs saved themes, mutation events and account changes on navigation", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ settings: { theme: "dark" } }) });
    vi.stubGlobal("fetch", fetcher);
    const view = render(<ThemeSync />);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    fireEvent(
      window,
      new CustomEvent("prax:workspace", { detail: { settings: { theme: "light" } } })
    );
    expect(document.documentElement.dataset.theme).toBe("light");
    fetcher.mockResolvedValue({ ok: true, json: async () => ({ settings: { theme: "light" } }) });
    mocks.pathname = "/dashboard";
    view.rerender(<ThemeSync />);
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    expect(document.documentElement.dataset.theme).toBe("light");
  });
  it("updates task category, status, sort and empty results through controls", () => {
    render(<Tasks />);
    fireEvent.change(screen.getByRole("combobox", { name: "Task category" }), {
      target: { value: "Backend" },
    });
    fireEvent.click(screen.getByRole("tab", { name: /Approved\s*1/ }));
    expect(screen.getByRole("heading", { name: "Build a REST API for habits" })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Optimise one slow SQL query" })).toBeNull();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search tasks" }), {
      target: { value: "absent" },
    });
    expect(screen.getByText("No matching tasks")).toBeDefined();
  });
  it("opens a to-do's information, edits custom fields and requests removal", async () => {
    render(<Space />);
    fireEvent.click(screen.getByRole("button", { name: /Polish forms\s*Due/ }));
    expect(screen.getByRole("dialog", { name: "View to-do" })).toBeDefined();
    expect(screen.getByText("Focus and errors")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Difficulty" }), {
      target: { value: "Easy" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Updated details" },
    });
    fireEvent.input(screen.getByLabelText("Due date"), { target: { value: "2026-11-03" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mocks.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "todos",
          operation: "update",
          id: "todo-1",
          data: expect.objectContaining({
            difficulty: "Easy",
            description: "Updated details",
            dueDate: "2026-11-03",
          }),
        })
      )
    );
    fireEvent.click(screen.getByRole("button", { name: /Polish forms\s*Due/ }));
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(mocks.mutate).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Confirm removal" }));
    await waitFor(() =>
      expect(mocks.mutate).toHaveBeenLastCalledWith({
        resource: "todos",
        operation: "delete",
        id: "todo-1",
      })
    );
  });
  it("switches goals, opens quick notes and honors item deep links", () => {
    mocks.params = "tab=notes&item=note-1";
    render(<Space />);
    expect(screen.getByRole("dialog", { name: "View note" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Open all" }));
    expect(screen.getByRole("tab", { name: /Goals\s*1/ }).getAttribute("aria-selected")).toBe(
      "true"
    );
    fireEvent.click(screen.getByRole("button", { name: "New note" }));
    expect(screen.getByRole("dialog", { name: "New note" })).toBeDefined();
  });
  it("switches leaderboard podium and own standing together", () => {
    render(<Leaderboard />);
    expect(screen.getByText("185 points this week")).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: "All-time" }));
    expect(screen.getByText("1,240 points all time")).toBeDefined();
    expect(screen.getByText("#5")).toBeDefined();
    expect(screen.getByLabelText("All-time podium").textContent).toContain("Meera Shah");
  });
  it("edits own chat messages through three dots and disables foreign edits", async () => {
    render(<Chat />);
    fireEvent.click(screen.getByRole("button", { name: "Message actions for Test Builder" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "Revised update" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save message" }));
    await waitFor(() =>
      expect(mocks.mutate).toHaveBeenCalledWith({
        resource: "messages",
        operation: "update",
        id: "message-1",
        data: { content: "Revised update" },
      })
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Message actions for Other builder" }));
    expect((screen.getByRole("button", { name: "Edit" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Pin" }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("connects profile and skill editors and offers missing portfolio setup", async () => {
    render(<EditableProfile />);
    fireEvent.click(screen.getAllByRole("button", { name: /Add portfolio/ })[0]);
    fireEvent.change(screen.getByRole("textbox", { name: "Project title" }), {
      target: { value: "My toolkit" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Portfolio URL" }), {
      target: { value: "https://example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mocks.mutate).toHaveBeenCalledWith({
        resource: "profile",
        operation: "update",
        data: { currentProject: "My toolkit", portfolioUrl: "https://example.test" },
      })
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Edit →" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Skills & interests" }), {
      target: { value: "React, CSS" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mocks.mutate).toHaveBeenLastCalledWith({
        resource: "profile",
        operation: "update",
        data: { skills: ["React", "CSS"] },
      })
    );
  });
  it("previews dark mode and saves settings without losing the active section", async () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole("button", { name: "appearance" }));
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mocks.mutate).toHaveBeenCalledWith({
        resource: "settings",
        operation: "update",
        data: expect.objectContaining({ theme: "dark" }),
      })
    );
    expect(await screen.findByText("Your settings are saved.")).toBeDefined();
    expect((screen.getByRole("radio", { name: "Dark" }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "notifications" }));
    expect(screen.getByRole("switch", { name: "Streak reminder" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "security" }));
    expect(screen.getByRole("button", { name: "Sign out of this session" })).toBeDefined();
  });
  it("search supports keyboard navigation, escape and opening the selected result", () => {
    render(<GlobalSearch />);
    fireEvent.click(screen.getByRole("button", { name: "Search platform" }));
    const input = screen.getByRole("combobox", { name: "Search" });
    fireEvent.change(input, { target: { value: "landing" } });
    expect(within(screen.getByRole("listbox")).getByRole("option").textContent).toContain(
      "landing"
    );
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mocks.push).toHaveBeenCalledWith("/tasks/2");
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Search platform" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
