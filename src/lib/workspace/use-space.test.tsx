// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useSpace } from "./use-space";
import type { SpaceData } from "./types";

// GET/PATCH /api/space is built in a later stage. These tests stub fetch; the application
// does not simulate the route or keep any data of its own.
const space = (title = "Polish forms"): SpaceData => ({
  todos: [
    {
      id: "todo-1",
      title,
      description: "",
      difficulty: "Medium",
      priority: "Medium",
      dueDate: "",
      completed: false,
      taskId: null,
      taskTitle: null,
    },
  ],
  notes: [],
  goals: [],
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useSpace", () => {
  it("loads the member's space from /api/space", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(space()));
    vi.stubGlobal("fetch", fetcher);
    const { result } = renderHook(() => useSpace());
    await waitFor(() => expect(result.current.data?.todos[0].title).toBe("Polish forms"));
    expect(fetcher).toHaveBeenCalledWith("/api/space", { cache: "no-store" });
    expect(result.current.error).toBe("");
  });

  it("reports a failed load without inventing data", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: { code: "NOT_FOUND", message: "Not connected" } }, { status: 404 })
        )
    );
    const { result } = renderHook(() => useSpace());
    await waitFor(() => expect(result.current.error).toBe("Not connected"));
    expect(result.current.data).toBeNull();
  });

  it("sends a mutation and replaces the data with the server's answer", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(space()))
      .mockResolvedValueOnce(Response.json(space("Renamed")));
    vi.stubGlobal("fetch", fetcher);
    const { result } = renderHook(() => useSpace());
    await waitFor(() => expect(result.current.data).not.toBeNull());
    const mutation = {
      resource: "todos" as const,
      operation: "update" as const,
      id: "todo-1",
      data: { title: "Renamed" },
    };
    let ok = false;
    await act(async () => {
      ok = await result.current.mutate(mutation);
    });
    expect(ok).toBe(true);
    expect(fetcher).toHaveBeenLastCalledWith("/api/space", {
      cache: "no-store",
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mutation),
    });
    expect(result.current.data?.todos[0].title).toBe("Renamed");
    expect(result.current.saving).toBe(false);
  });

  it("keeps the loaded data and reports a failed save", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(space()))
      .mockResolvedValueOnce(
        Response.json(
          { error: { code: "VALIDATION_ERROR", message: "Title is required." } },
          { status: 400 }
        )
      );
    vi.stubGlobal("fetch", fetcher);
    const { result } = renderHook(() => useSpace());
    await waitFor(() => expect(result.current.data).not.toBeNull());
    let ok = true;
    await act(async () => {
      ok = await result.current.mutate({ resource: "todos", operation: "create", data: {} });
    });
    expect(ok).toBe(false);
    expect(result.current.error).toBe("Title is required.");
    expect(result.current.data?.todos[0].title).toBe("Polish forms");
  });
});
