import { describe, expect, it } from "vitest";
import { filterTodos, searchWorkspace } from "./filter";
import type { SpaceData, Todo } from "./types";

const today = "2026-11-02";
let sequence = 0;
const todo = (overrides: Partial<Todo> = {}): Todo => ({
  id: `todo-${++sequence}`,
  title: "Task",
  description: "",
  difficulty: "Medium",
  priority: "Medium",
  dueDate: "",
  completed: false,
  taskId: null,
  taskTitle: null,
  ...overrides,
});
const ids = (list: Todo[]) => list.map((t) => t.id);

describe("filterTodos", () => {
  const overdue = todo({ id: "overdue", dueDate: "2026-11-01" });
  const dueToday = todo({ id: "due-today", dueDate: today });
  const later = todo({ id: "later", dueDate: "2026-11-09" });
  const undated = todo({ id: "undated" });
  const finished = todo({ id: "finished", dueDate: "2026-11-09", completed: true });
  const finishedUndated = todo({ id: "finished-undated", completed: true });
  const all = [overdue, dueToday, later, undated, finished, finishedUndated];

  it("shows overdue and due-today open to-dos under Today", () => {
    expect(ids(filterTodos(all, "today", "all", "", today))).toEqual(["overdue", "due-today"]);
  });

  it("shows future and undated open to-dos under Upcoming", () => {
    expect(ids(filterTodos(all, "upcoming", "all", "", today))).toEqual(["later", "undated"]);
  });

  it("shows only completed to-dos under Done, dated or not", () => {
    expect(ids(filterTodos(all, "done", "all", "", today))).toEqual([
      "finished",
      "finished-undated",
    ]);
  });

  it("shows everything under All", () => {
    expect(filterTodos(all, "all", "all", "", today)).toHaveLength(all.length);
  });

  it("places every open to-do in exactly one of Today and Upcoming", () => {
    const open = all.filter((t) => !t.completed);
    const inToday = filterTodos(all, "today", "all", "", today);
    const inUpcoming = filterTodos(all, "upcoming", "all", "", today);
    expect(inToday.length + inUpcoming.length).toBe(open.length);
    expect(ids(inToday).filter((id) => ids(inUpcoming).includes(id))).toEqual([]);
  });

  it("combines tabs with difficulty and text filters", () => {
    const hard = todo({ id: "hard", title: "Refactor", difficulty: "Hard" });
    const easy = todo({ id: "easy", title: "Refactor docs", difficulty: "Easy" });
    expect(ids(filterTodos([hard, easy], "upcoming", "Hard", "", today))).toEqual(["hard"]);
    expect(ids(filterTodos([hard, easy], "upcoming", "all", "DOCS", today))).toEqual(["easy"]);
  });
});

describe("searchWorkspace", () => {
  const space: SpaceData = {
    todos: [todo({ id: "t1", title: "Polish forms" })],
    notes: [{ id: "n1", title: "Research", content: "forms and focus", updatedAt: "2026-11-01" }],
    goals: [{ id: "g1", title: "Ship toolkit", description: "", progress: 10 }],
  };

  it("finds the member's own plans and links to the item", () => {
    expect(searchWorkspace("forms", space).map((r) => [r.section, r.href])).toEqual([
      ["Your to-dos", "/space?tab=todos&item=t1"],
      ["Your notes", "/space?tab=notes&item=n1"],
    ]);
  });

  it("works before space data has loaded", () => {
    expect(searchWorkspace("chat", null).map((r) => r.href)).toEqual(["/chat"]);
  });

  it("offers admin pages only to admins", () => {
    expect(searchWorkspace("review", null, [], "MEMBER")).toEqual([]);
    expect(searchWorkspace("review", null, [], "ADMIN").map((r) => r.href)).toEqual(["/admin"]);
  });
});
