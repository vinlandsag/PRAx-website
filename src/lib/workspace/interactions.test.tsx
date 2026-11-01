// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { TaskItem } from "./catalog";
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
const taskFixtures: TaskItem[] = [
  {
    id: "1",
    title: "Optimise one slow SQL query",
    description: "Query performance",
    category: "Backend",
    pointsMax: 35,
    deadline: "",
    status: "Open",
    thumbnailType: "code",
  },
  {
    id: "2",
    title: "Ship a landing page in 3 hours",
    description: "A responsive landing page",
    category: "Frontend",
    pointsMax: 40,
    deadline: "",
    status: "Open",
    thumbnailType: "doc",
  },
  {
    id: "3",
    title: "Build a REST API for habits",
    description: "An API",
    category: "Backend",
    pointsMax: 60,
    deadline: "",
    status: "Approved",
    thumbnailType: "terminal",
  },
];
vi.mock("@/lib/api/use-resource", () => ({
  useResource: (path: string | null) => {
    let data: unknown = null;
    if (path === "/api/users/me/profile")
      data = {
        profile: {
          name: "Test Builder",
          handle: "@testbuilder",
          bio: "",
          skills: [],
          currentProject: "",
          portfolioUrl: "",
          githubUrl: "",
          linkedinUrl: "",
          avatarUrl: "",
        },
        stats: { totalPoints: 0, weeklyRank: null, dayStreak: 0, tasksApproved: 0 },
      };
    else if (path === "/api/users/me/settings")
      data = {
        user: { email: "builder@example.test", role: "MEMBER" },
        profile: fixture().profile,
        settings: fixture().settings,
      };
    else if (path === "/api/tasks") data = { tasks: taskFixtures };
    else if (path?.startsWith("/api/tasks/"))
      data = { task: taskFixtures.find((task) => task.id === path.split("/").at(-1)) };
    else if (path?.startsWith("/api/leaderboard")) {
      const alltime = path.includes("period=alltime");
      const currentUser = alltime
        ? { id: "usr_member_01", name: "Test Builder", points: 1240, rank: 2, streak: 4 }
        : { id: "usr_member_01", name: "Test Builder", points: 185, rank: 2, streak: 4 };
      const offset = Number(new URLSearchParams(path.split("?")[1]).get("offset") ?? 0);
      data = {
        entries:
          offset >= 20
            ? [{ id: "builder-21", name: "Builder 21", points: 20, rank: 21, streak: 1 }]
            : alltime
              ? [
                  { id: "other", name: "Other Builder", points: 1610, rank: 1, streak: 8 },
                  currentUser,
                ]
              : [
                  { id: "other", name: "Other Builder", points: 301, rank: 1, streak: 8 },
                  currentUser,
                ],
        total: 21,
        pagination: { limit: 20, offset, total: 21, hasMore: offset === 0 },
        currentUser,
        userAhead: alltime
          ? { id: "other", name: "Other Builder", points: 1610, rank: 1, streak: 8 }
          : { id: "other", name: "Other Builder", points: 301, rank: 1, streak: 8 },
      };
    }
    return { data, error: "", loading: false, refresh: mocks.refresh };
  },
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
      screen.getByRole("link", { name: "View profile of Other Builder" }).getAttribute("href")
    ).toBe("/members/other?from=leaderboard");
    expect(screen.queryByRole("link", { name: "Members" })).toBeNull();
  });
  it("shows an API-provided profile and returns to its originating leaderboard", async () => {
    mocks.params = "from=leaderboard";
    mocks.paramId = "other";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ profile: fixture().profile }),
      })
    );
    render(<MemberProfile />);
    expect(await screen.findByRole("heading", { name: "Test Builder", level: 2 })).toBeDefined();
    expect(screen.queryByText(/Sample profile/)).toBeNull();
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
    fireEvent(window, new CustomEvent("prax:settings", { detail: { theme: "light" } }));
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
    expect(screen.getByText("#2")).toBeDefined();
    expect(screen.getByLabelText("All-time podium").textContent).toContain("Other Builder");
  });
  it("keeps the current user's standing available while paging leaderboard entries", () => {
    render(<Leaderboard />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Builder 21")).toBeDefined();
    expect(screen.getByText("#2")).toBeDefined();
    expect(screen.getByText("/ 21 builders")).toBeDefined();
    expect(screen.getByText("Showing 21–21 of 21")).toBeDefined();
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
    const savedProfile = {
      name: "Test Builder",
      handle: "@testbuilder",
      bio: "",
      skills: ["React", "CSS"],
      currentProject: "My toolkit",
      portfolioUrl: "https://example.test",
      githubUrl: "",
      linkedinUrl: "",
      avatarUrl: "",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          profile: { ...savedProfile, skills: [] },
          stats: { totalPoints: 0, weeklyRank: null, dayStreak: 0, tasksApproved: 0 },
        })
      )
      .mockResolvedValueOnce(
        Response.json({
          profile: savedProfile,
          stats: { totalPoints: 0, weeklyRank: null, dayStreak: 0, tasksApproved: 0 },
        })
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<EditableProfile />);
    fireEvent.click(screen.getAllByRole("button", { name: /Add portfolio/ })[0]);
    fireEvent.change(screen.getByRole("textbox", { name: "Project title" }), {
      target: { value: "My toolkit" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Portfolio URL" }), {
      target: { value: "https://example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/users/me/profile",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          currentProject: "My toolkit",
          portfolioUrl: "https://example.test",
        }),
      })
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Edit →" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Skills & interests" }), {
      target: { value: "React, CSS" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/users/me/profile",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ skills: ["React", "CSS"] }),
      })
    );
  });
  it("previews dark mode and saves settings without losing the active section", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        user: { email: "builder@example.test", role: "MEMBER" },
        settings: { ...fixture().settings, theme: "dark" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<Settings />);
    fireEvent.click(screen.getByRole("button", { name: "appearance" }));
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/users/me/settings",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ ...fixture().settings, theme: "dark" }),
        })
      )
    );
    expect(await screen.findByText("Your settings are saved.")).toBeDefined();
    expect((screen.getByRole("radio", { name: "Dark" }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "notifications" }));
    expect(screen.getByRole("switch", { name: "Streak reminder" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "security" }));
    expect(screen.getByRole("button", { name: "Sign out of this session" })).toBeDefined();
  });
  it("saves account profile fields through the self-profile API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ profile: { ...fixture().profile, name: "Updated Builder" }, stats: {} })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<Settings />);
    fireEvent.change(screen.getByRole("textbox", { name: "Display name" }), {
      target: { value: "Updated Builder" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/me/profile",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          name: "Updated Builder",
          handle: fixture().profile.handle,
          avatarUrl: fixture().profile.avatarUrl,
        }),
      })
    ));
    expect(await screen.findByText("Your settings are saved.")).toBeDefined();
    expect(screen.getByText("Updated Builder")).toBeDefined();
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
