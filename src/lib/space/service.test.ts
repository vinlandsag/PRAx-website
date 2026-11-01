import { describe, expect, it } from "vitest";
import { parseSpaceMutation } from "./service";

const parsed = (input: Record<string, unknown>) => {
  const result = parseSpaceMutation(input);
  if (!result.ok) throw new Error("expected a valid mutation");
  return result.value;
};

describe("parseSpaceMutation", () => {
  it("converts a todo create into database values", () => {
    expect(
      parsed({
        resource: "todos",
        operation: "create",
        data: {
          title: "  Write tests ",
          description: "  keep spaces  ",
          difficulty: "Easy",
          priority: "Low",
          dueDate: "2026-12-31",
          completed: true,
          taskId: "task-1",
        },
      })
    ).toEqual({
      resource: "todos",
      operation: "create",
      id: undefined,
      data: {
        title: "Write tests",
        description: "  keep spaces  ",
        difficulty: "EASY",
        priority: "LOW",
        dueDate: new Date("2026-12-31T00:00:00.000Z"),
        completed: true,
        taskId: "task-1",
      },
    });
  });

  it("turns an empty or null due date into null (an undated to-do)", () => {
    for (const dueDate of ["", null])
      expect(
        parsed({ resource: "todos", operation: "update", id: "t1", data: { dueDate } })
      ).toMatchObject({ data: { dueDate: null } });
  });

  it("keeps partial updates partial", () => {
    expect(
      parsed({ resource: "goals", operation: "update", id: "g1", data: { progress: 55 } })
    ).toEqual({ resource: "goals", operation: "update", id: "g1", data: { progress: 55 } });
    expect(
      parsed({ resource: "notes", operation: "update", id: "n1", data: { content: "" } })
    ).toMatchObject({ data: { content: "" } });
  });

  it("allows an empty description and empty note content but never an empty title", () => {
    expect(
      parsed({ resource: "notes", operation: "create", data: { title: "Idea", content: "" } })
    ).toMatchObject({ data: { title: "Idea", content: "" } });
    expect(
      parseSpaceMutation({ resource: "notes", operation: "create", data: { title: " " } }).ok
    ).toBe(false);
  });

  it("parses deletes with only an id", () => {
    expect(parsed({ resource: "notes", operation: "delete", id: "n1" })).toEqual({
      resource: "notes",
      operation: "delete",
      id: "n1",
    });
  });

  it("accepts the limits exactly and rejects one past them", () => {
    const limit = (resource: "todos" | "notes" | "goals", field: string, size: number) =>
      parseSpaceMutation({
        resource,
        operation: "create",
        data: { title: "t", [field]: "a".repeat(size) },
      }).ok;
    expect(limit("todos", "description", 5000)).toBe(true);
    expect(limit("todos", "description", 5001)).toBe(false);
    expect(limit("notes", "content", 5000)).toBe(true);
    expect(limit("notes", "content", 5001)).toBe(false);
    expect(
      parseSpaceMutation({
        resource: "goals",
        operation: "create",
        data: { title: "a".repeat(200) },
      }).ok
    ).toBe(true);
    expect(
      parseSpaceMutation({
        resource: "goals",
        operation: "create",
        data: { title: "a".repeat(201) },
      }).ok
    ).toBe(false);
  });
});
