import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { apiError, errors } from "@/lib/errors";
import type { Difficulty, Goal, Note, SpaceData, SpaceResource, Todo } from "@/lib/workspace/types";

/**
 * Personal Space (to-dos, notes, goals). Everything here belongs to ONE member.
 *
 * Isolation rule (D-039): the owner id is a parameter supplied by the route from the persisted,
 * approved session account. It is part of the `where` clause of every query below, no function
 * accepts an owner id from a request body, and nothing here is reachable from an admin route.
 */

export const SPACE_ITEM_LIMIT = 100;
export const SPACE_BODY_MAX_BYTES = 32 * 1024;
const TITLE_MAX = 200;
const TEXT_MAX = 5000;
const ID_MAX = 100;
const LABEL: Record<SpaceResource, string> = { todos: "to-dos", notes: "notes", goals: "goals" };

type Failure = { ok: false; response: Response };
const invalid = (message: string): Failure => ({
  ok: false,
  response: apiError("VALIDATION_ERROR", message, 400),
});

type TodoDifficultyValue = "EASY" | "MEDIUM" | "HARD";
type TodoPriorityValue = "LOW" | "MEDIUM" | "HIGH";
export interface TodoFields {
  title?: string;
  description?: string;
  difficulty?: TodoDifficultyValue;
  priority?: TodoPriorityValue;
  dueDate?: Date | null;
  completed?: boolean;
  taskId?: string | null;
}
export interface NoteFields {
  title?: string;
  content?: string;
}
export interface GoalFields {
  title?: string;
  description?: string;
  progress?: number;
}
export type ParsedMutation =
  | { resource: "todos"; operation: "create" | "update"; id?: string; data: TodoFields }
  | { resource: "notes"; operation: "create" | "update"; id?: string; data: NoteFields }
  | { resource: "goals"; operation: "create" | "update"; id?: string; data: GoalFields }
  | { resource: SpaceResource; operation: "delete"; id: string };

const DIFFICULTY_IN: Record<string, TodoDifficultyValue> = {
  Easy: "EASY",
  Medium: "MEDIUM",
  Hard: "HARD",
};
const PRIORITY_IN: Record<string, TodoPriorityValue> = {
  Low: "LOW",
  Medium: "MEDIUM",
  High: "HIGH",
};
const DIFFICULTY_OUT: Record<TodoDifficultyValue, Difficulty> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};
const PRIORITY_OUT: Record<TodoPriorityValue, Todo["priority"]> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** PostgreSQL text cannot hold NUL, so reject it as bad input rather than failing later. */
function readText(value: unknown, max: number, options: { allowEmpty: boolean; trim: boolean }) {
  if (typeof value !== "string" || value.length > max || value.includes("\u0000")) return undefined;
  const text = options.trim ? value.trim() : value;
  return !options.allowEmpty && !text.trim() ? undefined : text;
}

function readDate(value: unknown): Date | null | undefined {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? undefined
    : date;
}

function onlyKeys(data: Record<string, unknown>, allowed: string[], partial: boolean) {
  const keys = Object.keys(data);
  return keys.every((key) => allowed.includes(key)) && (!partial || keys.length > 0);
}

function parseTodo(data: Record<string, unknown>, partial: boolean): TodoFields | Failure {
  const bad = invalid("To-do fields are invalid.");
  if (
    !onlyKeys(
      data,
      ["title", "description", "difficulty", "priority", "dueDate", "completed", "taskId"],
      partial
    )
  )
    return bad;
  if (!partial && !("title" in data)) return bad;
  const out: TodoFields = {};
  if ("title" in data) {
    const title = readText(data.title, TITLE_MAX, { allowEmpty: false, trim: true });
    if (title === undefined) return bad;
    out.title = title;
  }
  if ("description" in data) {
    const description = readText(data.description, TEXT_MAX, { allowEmpty: true, trim: false });
    if (description === undefined) return bad;
    out.description = description;
  }
  if ("difficulty" in data) {
    const key = typeof data.difficulty === "string" ? data.difficulty : "";
    if (!Object.hasOwn(DIFFICULTY_IN, key)) return bad;
    out.difficulty = DIFFICULTY_IN[key];
  }
  if ("priority" in data) {
    const key = typeof data.priority === "string" ? data.priority : "";
    if (!Object.hasOwn(PRIORITY_IN, key)) return bad;
    out.priority = PRIORITY_IN[key];
  }
  if ("dueDate" in data) {
    const dueDate = readDate(data.dueDate);
    if (dueDate === undefined) return bad;
    out.dueDate = dueDate;
  }
  if ("completed" in data) {
    if (typeof data.completed !== "boolean") return bad;
    out.completed = data.completed;
  }
  if ("taskId" in data) {
    if (
      data.taskId !== null &&
      (typeof data.taskId !== "string" || !data.taskId || data.taskId.length > ID_MAX)
    )
      return bad;
    out.taskId = data.taskId;
  }
  return out;
}

function parseNote(data: Record<string, unknown>, partial: boolean): NoteFields | Failure {
  const bad = invalid("Note fields are invalid.");
  if (!onlyKeys(data, ["title", "content"], partial)) return bad;
  if (!partial && !("title" in data)) return bad;
  const out: NoteFields = {};
  if ("title" in data) {
    const title = readText(data.title, TITLE_MAX, { allowEmpty: false, trim: true });
    if (title === undefined) return bad;
    out.title = title;
  }
  if ("content" in data) {
    const content = readText(data.content, TEXT_MAX, { allowEmpty: true, trim: false });
    if (content === undefined) return bad;
    out.content = content;
  }
  return out;
}

function parseGoal(data: Record<string, unknown>, partial: boolean): GoalFields | Failure {
  const bad = invalid("Goal fields are invalid.");
  if (!onlyKeys(data, ["title", "description", "progress"], partial)) return bad;
  if (!partial && !("title" in data)) return bad;
  const out: GoalFields = {};
  if ("title" in data) {
    const title = readText(data.title, TITLE_MAX, { allowEmpty: false, trim: true });
    if (title === undefined) return bad;
    out.title = title;
  }
  if ("description" in data) {
    const description = readText(data.description, TEXT_MAX, { allowEmpty: true, trim: false });
    if (description === undefined) return bad;
    out.description = description;
  }
  if ("progress" in data) {
    const progress = data.progress;
    if (
      typeof progress !== "number" ||
      !Number.isInteger(progress) ||
      progress < 0 ||
      progress > 100
    )
      return bad;
    out.progress = progress;
  }
  return out;
}

const isFailure = (value: object): value is Failure => "response" in value;

/**
 * Validates a `{resource, operation, id?, data?}` request. Unknown fields are rejected, so a
 * client-supplied `userId` can never be read, and `id` is never accepted on create.
 */
export function parseSpaceMutation(
  input: Record<string, unknown>
): { ok: true; value: ParsedMutation } | Failure {
  const bad = invalid("Personal Space request is invalid.");
  if (Object.keys(input).some((key) => !["resource", "operation", "id", "data"].includes(key)))
    return bad;
  const { resource, operation, id, data } = input;
  if (resource !== "todos" && resource !== "notes" && resource !== "goals") return bad;
  if (operation !== "create" && operation !== "update" && operation !== "delete") return bad;
  if (operation === "create") {
    if (id !== undefined) return bad;
  } else if (typeof id !== "string" || !id || id.length > ID_MAX) {
    return invalid("Choose an item to change.");
  }
  if (operation === "delete") {
    if (data !== undefined) return bad;
    return { ok: true, value: { resource, operation, id: id as string } };
  }
  if (!isRecord(data)) return bad;
  const partial = operation === "update";
  const itemId = partial ? (id as string) : undefined;
  if (resource === "todos") {
    const fields = parseTodo(data, partial);
    return isFailure(fields)
      ? fields
      : { ok: true, value: { resource, operation, id: itemId, data: fields } };
  }
  if (resource === "notes") {
    const fields = parseNote(data, partial);
    return isFailure(fields)
      ? fields
      : { ok: true, value: { resource, operation, id: itemId, data: fields } };
  }
  const fields = parseGoal(data, partial);
  return isFailure(fields)
    ? fields
    : { ok: true, value: { resource, operation, id: itemId, data: fields } };
}

const todoInclude = {
  task: { select: { id: true, title: true, lifecycle: true } },
} satisfies Prisma.TodoInclude;

type TodoRow = Prisma.TodoGetPayload<{ include: typeof todoInclude }>;

function toTodo(row: TodoRow): Todo {
  // A linked task is shown only while it is published; members never see unpublished task data.
  const task = row.task && row.task.lifecycle === "PUBLISHED" ? row.task : null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    difficulty: DIFFICULTY_OUT[row.difficulty],
    priority: PRIORITY_OUT[row.priority],
    dueDate: row.dueDate ? row.dueDate.toISOString().slice(0, 10) : "",
    completed: row.completed,
    taskId: task?.id ?? null,
    taskTitle: task?.title ?? null,
  };
}

const toNote = (row: { id: string; title: string; content: string; updatedAt: Date }): Note => ({
  id: row.id,
  title: row.title,
  content: row.content,
  updatedAt: row.updatedAt.toISOString(),
});

const toGoal = (row: {
  id: string;
  title: string;
  description: string;
  progress: number;
}): Goal => ({
  id: row.id,
  title: row.title,
  description: row.description,
  progress: row.progress,
});

/** Reads the owner's Personal Space. Every query is filtered by `userId`. */
export async function loadSpace(prisma: PrismaClient, userId: string): Promise<SpaceData> {
  const [todos, notes, goals] = await Promise.all([
    prisma.todo.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: SPACE_ITEM_LIMIT,
      include: todoInclude,
    }),
    prisma.note.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: SPACE_ITEM_LIMIT,
    }),
    prisma.goal.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: SPACE_ITEM_LIMIT,
    }),
  ]);
  return { todos: todos.map(toTodo), notes: notes.map(toNote), goals: goals.map(toGoal) };
}

async function countOwned(tx: Prisma.TransactionClient, resource: SpaceResource, userId: string) {
  if (resource === "todos") return tx.todo.count({ where: { userId } });
  if (resource === "notes") return tx.note.count({ where: { userId } });
  return tx.goal.count({ where: { userId } });
}

const publishedTask = (tx: Prisma.TransactionClient, id: string) =>
  tx.task.findFirst({ where: { id, lifecycle: "PUBLISHED" }, select: { id: true } });

/**
 * Applies one validated change for `userId`. Creates take a row lock on the owner so the item cap
 * cannot be exceeded by concurrent requests; updates and deletes are scoped by owner, so another
 * member's (or an admin's) item id simply matches nothing and returns 404.
 */
export async function applySpaceMutation(
  prisma: PrismaClient,
  userId: string,
  mutation: ParsedMutation
): Promise<{ ok: true } | Failure> {
  return prisma.$transaction(
    async (tx): Promise<{ ok: true } | Failure> => {
      if (mutation.operation === "create") {
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
        if ((await countOwned(tx, mutation.resource, userId)) >= SPACE_ITEM_LIMIT)
          return invalid(`You can keep up to ${SPACE_ITEM_LIMIT} ${LABEL[mutation.resource]}.`);
      }

      if (mutation.operation === "delete") {
        const where = { id: mutation.id, userId };
        const result =
          mutation.resource === "todos"
            ? await tx.todo.deleteMany({ where })
            : mutation.resource === "notes"
              ? await tx.note.deleteMany({ where })
              : await tx.goal.deleteMany({ where });
        return result.count === 0 ? { ok: false, response: errors.notFound("Item") } : { ok: true };
      }

      if (mutation.resource === "todos") {
        const { data } = mutation;
        if (data.taskId && !(await publishedTask(tx, data.taskId)))
          return invalid("Choose a published task to link.");
        if (mutation.operation === "create") {
          await tx.todo.create({ data: { ...data, title: data.title!, userId } });
          return { ok: true };
        }
        const result = await tx.todo.updateMany({ where: { id: mutation.id!, userId }, data });
        return result.count === 0 ? { ok: false, response: errors.notFound("Item") } : { ok: true };
      }

      if (mutation.resource === "notes") {
        const { data } = mutation;
        if (mutation.operation === "create") {
          await tx.note.create({ data: { ...data, title: data.title!, userId } });
          return { ok: true };
        }
        const result = await tx.note.updateMany({ where: { id: mutation.id!, userId }, data });
        return result.count === 0 ? { ok: false, response: errors.notFound("Item") } : { ok: true };
      }

      const { data } = mutation;
      if (mutation.operation === "create") {
        await tx.goal.create({ data: { ...data, title: data.title!, userId } });
        return { ok: true };
      }
      const result = await tx.goal.updateMany({ where: { id: mutation.id!, userId }, data });
      return result.count === 0 ? { ok: false, response: errors.notFound("Item") } : { ok: true };
    },
    { maxWait: 10_000, timeout: 15_000 }
  );
}
