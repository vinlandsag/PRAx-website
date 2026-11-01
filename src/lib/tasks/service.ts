import {
  Prisma,
  type PrismaClient,
  type SubmissionStatus,
  type TaskLifecycle,
  type TaskThumbnailType,
  type User,
} from "@/generated/prisma/client";
import { apiError, errors } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/types";
import type { TaskItem } from "@/lib/workspace/catalog";
import { memberTaskStatus, type TaskListQuery } from "./query";

const MAX_INT = 2_147_483_647;

export interface TaskWriteInput {
  title: string;
  description: string;
  category: string;
  pointsMax: number;
  dueAt: Date | null;
  checklist: string[];
}

export type TaskPatchInput = Partial<TaskWriteInput>;

export type TaskInputResult =
  { ok: true; value: TaskWriteInput | TaskPatchInput } | { ok: false; response: Response };

const invalidTask = () => ({
  ok: false as const,
  response: apiError("VALIDATION_ERROR", "Task fields are invalid.", 400),
});

function parseDate(value: unknown): Date | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? undefined
    : date;
}

export function parseTaskWriteInput(
  input: Record<string, unknown>,
  partial: false
): { ok: true; value: TaskWriteInput } | { ok: false; response: Response };
export function parseTaskWriteInput(
  input: Record<string, unknown>,
  partial: true
): { ok: true; value: TaskPatchInput } | { ok: false; response: Response };
export function parseTaskWriteInput(
  input: Record<string, unknown>,
  partial: boolean
): TaskInputResult;
export function parseTaskWriteInput(
  input: Record<string, unknown>,
  partial: boolean
): TaskInputResult {
  const allowed = new Set(["title", "description", "category", "pointsMax", "dueAt", "checklist"]);
  if (
    Object.keys(input).some((key) => !allowed.has(key)) ||
    (partial && !Object.keys(input).length)
  )
    return invalidTask();

  const result: TaskPatchInput = {};
  const strings = [
    ["title", 120],
    ["description", 8000],
    ["category", 64],
  ] as const;
  for (const [key, max] of strings) {
    if (!(key in input)) {
      if (!partial) return invalidTask();
      continue;
    }
    const value = input[key];
    if (typeof value !== "string" || !value.trim() || value.length > max) return invalidTask();
    result[key] = value.trim();
  }

  if ("pointsMax" in input) {
    const value = input.pointsMax;
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > MAX_INT)
      return invalidTask();
    result.pointsMax = value;
  } else if (!partial) return invalidTask();

  if ("dueAt" in input) {
    const value = parseDate(input.dueAt);
    if (value === undefined) return invalidTask();
    result.dueAt = value;
  } else if (!partial) result.dueAt = null;

  if ("checklist" in input) {
    const value = input.checklist;
    if (
      !Array.isArray(value) ||
      value.length > 50 ||
      value.some((item) => typeof item !== "string" || !item.trim() || item.length > 500)
    )
      return invalidTask();
    result.checklist = value.map((item) => item.trim());
  } else if (!partial) result.checklist = [];

  if (partial) return { ok: true, value: result };
  return {
    ok: true,
    value: {
      title: result.title!,
      description: result.description!,
      category: result.category!,
      pointsMax: result.pointsMax!,
      dueAt: result.dueAt ?? null,
      checklist: result.checklist ?? [],
    },
  };
}

type PersistedAccount = Pick<User, "id" | "name" | "role" | "status">;

export type PersistedAccountResult =
  { ok: true; account: PersistedAccount } | { ok: false; response: Response };

export async function requirePersistedAccount(
  prisma: PrismaClient,
  sessionUser: SessionUser
): Promise<PersistedAccountResult> {
  const account = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, role: true, status: true },
  });
  if (!account || account.status !== "APPROVED")
    return { ok: false, response: errors.accountNotActive() };
  if (account.role !== sessionUser.role || account.name !== sessionUser.name)
    return { ok: false, response: errors.forbidden() };
  return { ok: true, account };
}

type TaskSqlRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  pointsMax: number;
  dueAt: Date | null;
  checklist: string[];
  lifecycle: TaskLifecycle;
  thumbnailType: TaskThumbnailType;
  createdAt: Date;
  status: string;
  statusNote: string | null;
};

function toTaskItem(row: TaskSqlRow, isAdmin: boolean): TaskItem {
  const status = row.status.toLowerCase();
  const memberStatus =
    status === "pending" || status === "submitted"
      ? "Pending"
      : status === "approved"
        ? "Approved"
        : status === "rejected"
          ? "Rejected"
          : "Open";
  const dueAt = row.dueAt?.toISOString().slice(0, 10);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    pointsMax: row.pointsMax,
    deadline: dueAt ?? "",
    ...(dueAt ? { dueAt } : {}),
    createdAt: row.createdAt.toISOString(),
    checklist: row.checklist,
    status: memberStatus,
    ...(row.statusNote ? { statusNote: row.statusNote } : {}),
    thumbnailType: row.thumbnailType.toLowerCase() as TaskItem["thumbnailType"],
    ...(isAdmin ? { lifecycle: row.lifecycle } : {}),
  };
}

function listWhere(query: TaskListQuery, user: SessionUser) {
  let where = Prisma.sql`TRUE`;
  if (user.role !== "ADMIN")
    where = Prisma.sql`${where} AND t."lifecycle" = 'PUBLISHED'::"TaskLifecycle"`;
  else if (query.status !== "all")
    where = Prisma.sql`${where} AND t."lifecycle" = ${query.status.toUpperCase()}::"TaskLifecycle"`;

  if (query.category) where = Prisma.sql`${where} AND t."category" = ${query.category}`;
  if (query.search) {
    const term = query.search.replace(/[\\%_]/g, "\\$&");
    where = Prisma.sql`${where} AND (t."title" ILIKE '%' || ${term} || '%' ESCAPE E'\\\\' OR t."description" ILIKE '%' || ${term} || '%' ESCAPE E'\\\\' OR t."category" ILIKE '%' || ${term} || '%' ESCAPE E'\\\\')`;
  }
  return where;
}

function statusWhere(query: TaskListQuery, user: SessionUser) {
  if (user.role === "ADMIN" || query.status === "all") return Prisma.sql`TRUE`;
  return Prisma.sql`v."memberStatus" = ${query.status}`;
}

function listCte(user: SessionUser, where: Prisma.Sql) {
  return Prisma.sql`
  WITH latest_submission AS (
    SELECT DISTINCT ON (s."taskId") s."taskId", s."status", s."feedback"
    FROM "Submission" s
    WHERE s."userId" = ${user.id}
    ORDER BY s."taskId", s."submittedAt" DESC, s."id" DESC
  ), visible AS (
    SELECT
      t."id", t."title", t."description", t."category", t."pointsMax", t."dueAt",
      t."checklist", t."lifecycle", t."thumbnailType", t."createdAt",
      CASE
        WHEN latest.status = 'APPROVED' THEN 'approved'
        WHEN latest.status = 'REJECTED' THEN 'rejected'
        WHEN latest.status IN ('SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED') THEN 'submitted'
        ELSE 'open'
      END AS "memberStatus",
      latest."feedback" AS "statusNote"
    FROM "Task" t
    LEFT JOIN latest_submission latest ON latest."taskId" = t."id"
    WHERE ${where}
  )
`;
}

export async function listTasks(prisma: PrismaClient, user: SessionUser, query: TaskListQuery) {
  const where = listWhere(query, user);
  const filter = statusWhere(query, user);
  const order =
    query.sort === "points"
      ? Prisma.sql`v."pointsMax" DESC, v."createdAt" DESC, v."id" ASC`
      : Prisma.sql`v."createdAt" DESC, v."id" ASC`;
  const cte = listCte(user, where);

  const countQuery = Prisma.sql`${cte}
    SELECT COUNT(*)::int AS "total" FROM visible v WHERE ${filter}`;
  const taskQuery = Prisma.sql`${cte}
    SELECT v.*,
      CASE WHEN v."memberStatus" = 'submitted' THEN 'Pending' ELSE v."memberStatus" END AS "status"
    FROM visible v
    WHERE ${filter}
    ORDER BY ${order}
    LIMIT ${query.limit} OFFSET ${query.offset}`;

  const [counts, rows] = await prisma.$transaction(
    [
      prisma.$queryRaw<Array<{ total: number }>>(countQuery),
      prisma.$queryRaw<TaskSqlRow[]>(taskQuery),
    ],
    { isolationLevel: "RepeatableRead" }
  );
  const total = counts[0]?.total ?? 0;
  return {
    tasks: rows.map((row) => toTaskItem(row, user.role === "ADMIN")),
    pagination: {
      limit: query.limit,
      offset: query.offset,
      total,
      hasMore: query.offset + query.limit < total,
    },
  };
}

export async function getTaskDetail(prisma: PrismaClient, id: string, user: SessionUser) {
  const task = await prisma.task.findFirst({
    where: {
      id,
      ...(user.role === "ADMIN" ? {} : { lifecycle: "PUBLISHED" }),
    },
    include: {
      submissions: {
        where: { userId: user.id },
        orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
        take: 1,
        select: { status: true, feedback: true },
      },
    },
  });
  if (!task) return { ok: false as const, response: errors.notFound("Task") };
  const latest = task.submissions[0];
  const status = memberTaskStatus((latest?.status as SubmissionStatus | undefined) ?? null);
  const row: TaskSqlRow = {
    ...task,
    status: status === "submitted" ? "Pending" : status,
    statusNote: latest?.feedback ?? null,
  };
  return { ok: true as const, task: toTaskItem(row, user.role === "ADMIN") };
}

export function taskCreateData(input: TaskWriteInput, createdById: string) {
  return {
    ...input,
    lifecycle: "PUBLISHED" as const,
    publishedAt: new Date(),
    createdById,
  };
}
