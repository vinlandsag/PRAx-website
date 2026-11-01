import type { PrismaClient, SubmissionStatus } from "@/generated/prisma/client";
import { paginationMeta, parsePagination, type Pagination } from "@/lib/api/pagination";
import { apiError, errors } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/types";
import { toSubmission } from "@/lib/submissions/service";

// Person 2's current review UI uses the built-in 10/15/10 scoring controls. The
// version is assigned by the server because the browser does not submit rubric metadata.
export const MVP_REVIEW_RUBRIC_VERSION = "mvp-default-v1";

const QUEUE_STATUSES = ["SUBMITTED", "UNDER_REVIEW"] as const;
const REVIEWABLE_STATUSES: SubmissionStatus[] = [...QUEUE_STATUSES];

export type ReviewQueueQuery = Pagination & { status: SubmissionStatus | "ALL" };
export type ReviewQueueQueryResult =
  | { ok: true; value: ReviewQueueQuery }
  | { ok: false; response: Response };

export function parseReviewQueueQuery(params: URLSearchParams): ReviewQueueQueryResult {
  const statusValues = params.getAll("status");
  if (statusValues.length > 1) {
    return {
      ok: false,
      response: apiError("VALIDATION_ERROR", "Review queue filters are invalid.", 400),
    };
  }

  const status = (statusValues[0] ?? "SUBMITTED").toUpperCase();
  if (status !== "ALL" && !QUEUE_STATUSES.includes(status as (typeof QUEUE_STATUSES)[number])) {
    return {
      ok: false,
      response: apiError("VALIDATION_ERROR", "Review queue filters are invalid.", 400),
    };
  }

  const pagination = parsePagination(params);
  if (!pagination.ok) return { ok: false, response: pagination.response };
  return {
    ok: true,
    value: { status: status as SubmissionStatus | "ALL", ...pagination.value },
  };
}

export async function listReviewQueue(prisma: PrismaClient, query: ReviewQueueQuery) {
  const where = {
    status: query.status === "ALL" ? { in: [...REVIEWABLE_STATUSES] } : query.status,
  };
  const [total, rows] = await prisma.$transaction([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      include: {
        task: { select: { id: true, title: true, category: true, pointsMax: true } },
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
      take: query.limit,
      skip: query.offset,
    }),
  ]);

  return {
    submissions: rows.map(toSubmission),
    pagination: paginationMeta({ limit: query.limit, offset: query.offset }, total),
  };
}

export type ReviewDecision = "REJECTED" | "REVISION_REQUESTED";

function parseFeedback(value: unknown) {
  if (typeof value !== "string") return null;
  const feedback = value.trim();
  return feedback.length >= 3 && feedback.length <= 8000 ? feedback : null;
}

export async function decideSubmission(
  prisma: PrismaClient,
  submissionId: string,
  reviewer: SessionUser,
  decision: ReviewDecision,
  rawFeedback: unknown
) {
  const feedback = parseFeedback(rawFeedback);
  if (!feedback) {
    return {
      ok: false as const,
      response: apiError("VALIDATION_ERROR", "Provide feedback between 3 and 8000 characters.", 400),
    };
  }

  return prisma.$transaction(async (tx) => {
    const persistedReviewer = await tx.user.findUnique({
      where: { id: reviewer.id },
      select: { name: true, role: true, status: true },
    });
    if (!persistedReviewer || persistedReviewer.status !== "APPROVED") {
      return { ok: false as const, response: errors.accountNotActive() };
    }
    if (
      persistedReviewer.role !== "ADMIN" ||
      persistedReviewer.role !== reviewer.role ||
      persistedReviewer.name !== reviewer.name
    ) {
      return { ok: false as const, response: errors.forbidden() };
    }

    const result = await tx.submission.updateMany({
      where: { id: submissionId, status: { in: REVIEWABLE_STATUSES } },
      data: {
        status: decision,
        feedback,
        reviewedById: reviewer.id,
        reviewedAt: new Date(),
      },
    });
    if (result.count !== 1) {
      const current = await tx.submission.findUnique({
        where: { id: submissionId },
        select: { id: true },
      });
      return {
        ok: false as const,
        response: current
          ? apiError("INVALID_STATE_TRANSITION", "This submission has already been reviewed.", 409)
          : errors.notFound("Submission"),
      };
    }

    const record = await tx.submission.findUnique({
      where: { id: submissionId },
      include: {
        task: { select: { id: true, title: true, category: true, pointsMax: true } },
        author: { select: { id: true, name: true, email: true } },
      },
    });
    if (!record) return { ok: false as const, response: errors.notFound("Submission") };
    return { ok: true as const, submission: toSubmission(record) };
  });
}
