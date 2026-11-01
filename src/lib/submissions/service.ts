import { Prisma, type PrismaClient, type SubmissionStatus } from "@/generated/prisma/client";
import type { Submission } from "@/lib/db/submissions";
import type { SessionUser } from "@/lib/auth/types";
import { isSafeUrl } from "@/lib/utils/url";
import { apiError, errors } from "@/lib/errors";
import { paginationMeta, parsePagination, type Pagination } from "@/lib/api/pagination";
import { requirePersistedAccount } from "@/lib/tasks/service";

const ACTIVE_STATUSES: SubmissionStatus[] = ["DRAFT", "SUBMITTED", "UNDER_REVIEW"];
const EDITABLE_STATUSES: SubmissionStatus[] = ["DRAFT", "SUBMITTED"];
const MAX_PROOF_URL_LENGTH = 2048;
const MAX_NOTE_LENGTH = 8000;

const submissionInclude = {
  task: { select: { id: true, title: true, category: true, pointsMax: true } },
  author: { select: { id: true, name: true, email: true } },
} satisfies Prisma.SubmissionInclude;

type SubmissionRecord = Prisma.SubmissionGetPayload<{ include: typeof submissionInclude }>;

export type SubmissionWriteInput = { taskId: string; proofUrl: string; note: string };
export type SubmissionPatchInput = Partial<Pick<SubmissionWriteInput, "proofUrl" | "note">>;
export type SubmissionInputResult =
  | { ok: true; value: SubmissionWriteInput | SubmissionPatchInput }
  | { ok: false; response: Response };
export type SubmissionQuery = Pagination & { status: SubmissionStatus | "ALL" };
export type SubmissionQueryResult =
  { ok: true; value: SubmissionQuery } | { ok: false; response: Response };

function isValidProofUrl(value: string) {
  if (!isSafeUrl(value)) return false;
  try {
    const url = new URL(value);
    return url.hostname.length > 0 && !url.username && !url.password;
  } catch {
    return false;
  }
}

const invalidInput = () => ({
  ok: false as const,
  response: apiError("VALIDATION_ERROR", "Submission fields are invalid.", 400),
});

export function parseSubmissionInput(
  input: Record<string, unknown>,
  partial: false
): { ok: true; value: SubmissionWriteInput } | { ok: false; response: Response };
export function parseSubmissionInput(
  input: Record<string, unknown>,
  partial: true
): { ok: true; value: SubmissionPatchInput } | { ok: false; response: Response };
export function parseSubmissionInput(
  input: Record<string, unknown>
): { ok: true; value: SubmissionWriteInput } | { ok: false; response: Response };
export function parseSubmissionInput(
  input: Record<string, unknown>,
  partial?: boolean
): SubmissionInputResult;
export function parseSubmissionInput(
  input: Record<string, unknown>,
  partial = false
): SubmissionInputResult {
  const allowed = new Set(partial ? ["proofUrl", "note"] : ["taskId", "proofUrl", "note"]);
  if (Object.keys(input).some((key) => !allowed.has(key))) return invalidInput();
  if (
    !partial &&
    (typeof input.taskId !== "string" || !input.taskId.trim() || input.taskId.length > 128)
  )
    return invalidInput();
  if (partial && Object.keys(input).length === 0) return invalidInput();

  const result: Partial<SubmissionWriteInput> = {};
  if (!partial) result.taskId = (input.taskId as string).trim();
  if ("proofUrl" in input || !partial) {
    const value = input.proofUrl;
    if (
      typeof value !== "string" ||
      value.trim().length === 0 ||
      value.trim().length > MAX_PROOF_URL_LENGTH ||
      !isValidProofUrl(value.trim())
    )
      return invalidInput();
    result.proofUrl = value.trim();
  }
  if ("note" in input || !partial) {
    const value = input.note;
    if (typeof value !== "string" || !value.trim() || value.trim().length > MAX_NOTE_LENGTH)
      return invalidInput();
    result.note = value.trim();
  }

  if (
    !partial &&
    (result.taskId === undefined || result.proofUrl === undefined || result.note === undefined)
  )
    return invalidInput();
  return { ok: true, value: result as SubmissionWriteInput | SubmissionPatchInput };
}

const SUBMISSION_STATUSES = new Set<SubmissionStatus>([
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "REVISION_REQUESTED",
  "WITHDRAWN",
]);

export function parseSubmissionQuery(params: URLSearchParams): SubmissionQueryResult {
  const statuses = params.getAll("status");
  if (statuses.length > 1) {
    return {
      ok: false,
      response: apiError("VALIDATION_ERROR", "Submission query parameters are invalid.", 400),
    };
  }
  const statusValue = statuses[0]?.toUpperCase() ?? "ALL";
  if (statusValue !== "ALL" && !SUBMISSION_STATUSES.has(statusValue as SubmissionStatus)) {
    return {
      ok: false,
      response: apiError("VALIDATION_ERROR", "Submission query parameters are invalid.", 400),
    };
  }
  const pagination = parsePagination(params);
  if (!pagination.ok) return { ok: false, response: pagination.response };
  return {
    ok: true,
    value: { ...pagination.value, status: statusValue as SubmissionStatus | "ALL" },
  };
}

export function toSubmission(record: SubmissionRecord): Submission {
  return {
    id: record.id,
    taskId: record.taskId,
    taskTitle: record.task.title,
    category: record.task.category,
    maxPoints: record.task.pointsMax,
    userId: record.userId,
    authorName: record.author.name,
    authorEmail: record.author.email,
    proofUrl: record.proofUrl,
    note: record.note,
    ...(record.codeSnippet ? { codeSnippet: record.codeSnippet } : {}),
    ...(record.checklist.length ? { checklist: record.checklist } : {}),
    status: record.status,
    ...(record.pointsAwarded !== null ? { pointsAwarded: record.pointsAwarded } : {}),
    ...(record.rubricVersion ? { rubricVersion: record.rubricVersion } : {}),
    ...(record.feedback ? { feedback: record.feedback } : {}),
    ...(record.reviewedById ? { reviewedById: record.reviewedById } : {}),
    ...(record.reviewedAt ? { reviewedAt: record.reviewedAt.toISOString() } : {}),
    submittedAt: record.submittedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listOwnSubmissions(
  prisma: PrismaClient,
  user: SessionUser,
  query: SubmissionQuery
) {
  const where = {
    userId: user.id,
    ...(query.status === "ALL" ? {} : { status: query.status }),
  };
  const [total, records] = await prisma.$transaction([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      include: submissionInclude,
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      take: query.limit,
      skip: query.offset,
    }),
  ]);
  return {
    submissions: records.map(toSubmission),
    pagination: paginationMeta({ limit: query.limit, offset: query.offset }, total),
  };
}

export async function getSubmission(
  prisma: PrismaClient,
  id: string,
  user: SessionUser,
  allowAdmin: boolean
) {
  const canReviewAnySubmission = allowAdmin && user.role === "ADMIN";
  const record = await prisma.submission.findFirst({
    where: {
      id,
      ...(canReviewAnySubmission ? {} : { userId: user.id }),
    },
    include: submissionInclude,
  });
  if (!record) {
    return { ok: false as const, response: errors.notFound("Submission") };
  }
  return { ok: true as const, submission: toSubmission(record) };
}

export async function requireSubmissionAccount(prisma: PrismaClient, user: SessionUser) {
  return requirePersistedAccount(prisma, user);
}

export async function createSubmission(
  prisma: PrismaClient,
  user: SessionUser,
  input: SubmissionWriteInput
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: input.taskId, lifecycle: "PUBLISHED" },
        select: { id: true },
      });
      if (!task) return { ok: false as const, response: errors.notFound("Task") };

      const active = await tx.submission.findFirst({
        where: { userId: user.id, taskId: task.id, status: { in: ACTIVE_STATUSES } },
        select: { id: true },
      });
      if (active) return activeSubmissionConflict();

      const record = await tx.submission.create({
        data: {
          taskId: task.id,
          userId: user.id,
          proofUrl: input.proofUrl,
          note: input.note,
          status: "SUBMITTED",
        },
        include: submissionInclude,
      });
      return { ok: true as const, submission: toSubmission(record) };
    });
  } catch (error) {
    if (isSubmissionUniqueConflict(error)) return activeSubmissionConflict();
    throw error;
  }
}

function activeSubmissionConflict() {
  return {
    ok: false as const,
    response: apiError(
      "SUBMISSION_IN_PROGRESS",
      "An active submission already exists for this task.",
      409
    ),
  };
}

function transitionConflict(status: SubmissionStatus | null) {
  if (status === "UNDER_REVIEW") {
    return apiError("SUBMISSION_IN_PROGRESS", "This submission is already under review.", 409);
  }
  return apiError("INVALID_STATE_TRANSITION", "This submission can no longer be changed.", 422);
}

async function ownedStatus(prisma: PrismaClient, id: string, userId: string) {
  return prisma.submission.findFirst({
    where: { id, userId },
    select: { status: true },
  });
}

export async function updateOwnSubmission(
  prisma: PrismaClient,
  id: string,
  userId: string,
  patch: SubmissionPatchInput
) {
  const result = await prisma.submission.updateMany({
    where: { id, userId, status: { in: EDITABLE_STATUSES } },
    data: patch,
  });
  if (result.count === 0) {
    const current = await ownedStatus(prisma, id, userId);
    if (!current) return { ok: false as const, response: errors.notFound("Submission") };
    return { ok: false as const, response: transitionConflict(current.status) };
  }
  const record = await prisma.submission.findFirst({
    where: { id, userId },
    include: submissionInclude,
  });
  if (!record) return { ok: false as const, response: errors.notFound("Submission") };
  return { ok: true as const, submission: toSubmission(record) };
}

export async function withdrawOwnSubmission(prisma: PrismaClient, id: string, userId: string) {
  const result = await prisma.submission.updateMany({
    where: { id, userId, status: { in: EDITABLE_STATUSES } },
    data: { status: "WITHDRAWN" },
  });
  if (result.count === 0) {
    const current = await ownedStatus(prisma, id, userId);
    if (!current) return { ok: false as const, response: errors.notFound("Submission") };
    return { ok: false as const, response: transitionConflict(current.status) };
  }
  const record = await prisma.submission.findFirst({
    where: { id, userId },
    include: submissionInclude,
  });
  if (!record) return { ok: false as const, response: errors.notFound("Submission") };
  return { ok: true as const, submission: toSubmission(record) };
}

export function isSubmissionUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
