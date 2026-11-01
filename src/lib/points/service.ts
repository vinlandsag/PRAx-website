import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { apiError } from "@/lib/errors";
import { paginationMeta, parsePagination, type Pagination } from "@/lib/api/pagination";
import type { PointsBoundaryResult, PointsTransactionPayload } from "./types";

const MAX_INT = 2_147_483_647;
const REVIEWABLE_STATUSES = ["SUBMITTED", "UNDER_REVIEW"] as const;

function invalid(idempotencyKey: string, error: string): PointsBoundaryResult {
  return { success: false, idempotencyKey, pointsAwarded: 0, alreadyProcessed: false, error };
}

function sameAward(
  record: {
    submissionId: string;
    userId: string;
    reviewedById: string;
    amount: number;
    rubricVersion: string;
    idempotencyKey: string;
  },
  expected: {
    submissionId: string;
    userId: string;
    reviewedById: string;
    amount: number;
    rubricVersion: string;
    idempotencyKey: string;
  }
) {
  return (
    record.submissionId === expected.submissionId &&
    record.userId === expected.userId &&
    record.reviewedById === expected.reviewedById &&
    record.amount === expected.amount &&
    record.rubricVersion === expected.rubricVersion &&
    record.idempotencyKey === expected.idempotencyKey
  );
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Atomically transitions a submitted attempt to APPROVED and records its immutable points log.
 * Call this boundary from the admin review flow. It intentionally accepts no recipient or
 * maximum score: those values come from the persisted submission and task.
 */
export async function dispatchApprovedPoints(
  prisma: PrismaClient,
  payload: PointsTransactionPayload
): Promise<PointsBoundaryResult> {
  const { submissionId, pointsAwarded, rubricVersion, reviewedById, idempotencyKey } = payload;
  const expectedKey = `pts_${submissionId}_${rubricVersion}`;
  if (
    !submissionId ||
    !reviewedById ||
    typeof rubricVersion !== "string" ||
    !rubricVersion.trim() ||
    rubricVersion.length > 64 ||
    !Number.isSafeInteger(pointsAwarded) ||
    pointsAwarded < 0 ||
    pointsAwarded > MAX_INT ||
    idempotencyKey !== expectedKey
  ) {
    return invalid(idempotencyKey ?? "", "INVALID_AWARD");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.findUnique({
        where: { id: submissionId },
        select: {
          id: true,
          userId: true,
          status: true,
          pointsAwarded: true,
          rubricVersion: true,
          reviewedById: true,
          task: { select: { pointsMax: true } },
          author: { select: { status: true } },
        },
      });
      if (!submission || submission.author.status !== "APPROVED")
        return invalid(idempotencyKey, "SUBMISSION_NOT_ELIGIBLE");

      const expected = {
        submissionId,
        userId: submission.userId,
        reviewedById,
        amount: pointsAwarded,
        rubricVersion,
        idempotencyKey,
      };
      const prior = await tx.pointTransaction.findFirst({
        where: { OR: [{ submissionId }, { idempotencyKey }] },
      });
      if (prior) {
        return sameAward(prior, expected)
          ? {
              success: true,
              transactionId: prior.id,
              idempotencyKey,
              pointsAwarded: prior.amount,
              alreadyProcessed: true,
            }
          : invalid(idempotencyKey, "IDEMPOTENCY_CONFLICT");
      }

      if (pointsAwarded > submission.task.pointsMax)
        return invalid(idempotencyKey, "SCORE_OUT_OF_RANGE");

      const reviewer = await tx.user.findUnique({
        where: { id: reviewedById },
        select: { role: true, status: true },
      });
      if (!reviewer || reviewer.role !== "ADMIN" || reviewer.status !== "APPROVED")
        return invalid(idempotencyKey, "REVIEWER_NOT_AUTHORIZED");

      if (!REVIEWABLE_STATUSES.includes(submission.status as (typeof REVIEWABLE_STATUSES)[number]))
        return invalid(idempotencyKey, "INVALID_STATE_TRANSITION");

      // Use a millisecond-truncated PostgreSQL transaction timestamp. Submission.reviewedAt
      // is TIMESTAMPTZ(3); assigning the microsecond transaction timestamp directly can round
      // it forward by <1ms and make the streak function's <= CURRENT_TIMESTAMP check fail.
      const transitioned = await tx.$executeRaw`
        UPDATE "Submission"
        SET "status" = 'APPROVED'::"SubmissionStatus",
            "pointsAwarded" = ${pointsAwarded},
            "rubricVersion" = ${rubricVersion},
            "reviewedById" = ${reviewedById},
            "reviewedAt" = date_trunc('milliseconds', CURRENT_TIMESTAMP),
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${submissionId}
          AND "status" IN ('SUBMITTED'::"SubmissionStatus", 'UNDER_REVIEW'::"SubmissionStatus")
      `;
      if (transitioned !== 1) {
        const concurrentAward = await tx.pointTransaction.findFirst({
          where: { OR: [{ submissionId }, { idempotencyKey }] },
        });
        if (concurrentAward && sameAward(concurrentAward, expected)) {
          return {
            success: true,
            transactionId: concurrentAward.id,
            idempotencyKey,
            pointsAwarded: concurrentAward.amount,
            alreadyProcessed: true,
          };
        }
        return invalid(idempotencyKey, "INVALID_STATE_TRANSITION");
      }

      const transaction = await tx.pointTransaction.create({
        data: {
          submissionId,
          userId: submission.userId,
          reviewedById,
          amount: pointsAwarded,
          maxPoints: submission.task.pointsMax,
          rubricVersion,
          idempotencyKey,
        },
        select: { id: true },
      });
      // The database derives the member and IST activity date from the persisted approval.
      // This remains in the approval transaction, so a failed streak write rolls back approval.
      const streakResult = await tx.$queryRaw<Array<{ recorded: boolean }>>`
        SELECT public.record_approved_submission_streak(${submissionId}) AS recorded
      `;
      if (streakResult[0]?.recorded !== true)
        throw new Error("Approved submission streak could not be recorded.");
      return {
        success: true,
        transactionId: transaction.id,
        idempotencyKey,
        pointsAwarded,
        alreadyProcessed: false,
      };
    });
  } catch (error) {
    // A concurrent request may win a unique insert. The transaction has rolled back; query
    // outside it and acknowledge only a byte-for-byte equivalent award.
    if (!isUniqueViolation(error)) throw error;
    const prior = await prisma.pointTransaction.findFirst({
      where: { OR: [{ submissionId }, { idempotencyKey }] },
    });
    if (!prior) throw error;
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { userId: true },
    });
    if (
      submission &&
      sameAward(prior, {
        submissionId,
        userId: submission.userId,
        reviewedById,
        amount: pointsAwarded,
        rubricVersion,
        idempotencyKey,
      })
    ) {
      return {
        success: true,
        transactionId: prior.id,
        idempotencyKey,
        pointsAwarded: prior.amount,
        alreadyProcessed: true,
      };
    }
    return invalid(idempotencyKey, "IDEMPOTENCY_CONFLICT");
  }
}

export type LeaderboardPeriod = "weekly" | "alltime";

export function parseLeaderboardPeriod(value: string | null): LeaderboardPeriod | null {
  if (value === null || value === "weekly") return "weekly";
  if (value === "alltime") return "alltime";
  return null;
}

export interface LeaderboardQuery extends Pagination {
  period: LeaderboardPeriod;
}

export type LeaderboardQueryResult =
  { ok: true; value: LeaderboardQuery } | { ok: false; response: Response };

export function parseLeaderboardQuery(params: URLSearchParams): LeaderboardQueryResult {
  const periods = params.getAll("period");
  if (periods.length > 1) {
    return {
      ok: false,
      response: apiError("VALIDATION_ERROR", "Leaderboard period is invalid.", 400),
    };
  }
  const period = parseLeaderboardPeriod(periods[0] ?? null);
  if (!period) {
    return {
      ok: false,
      response: apiError("VALIDATION_ERROR", "Leaderboard period is invalid.", 400),
    };
  }
  const pagination = parsePagination(params);
  if (!pagination.ok) return pagination;
  return { ok: true, value: { period, ...pagination.value } };
}

/** Monday 00:00 in India Standard Time, represented as a UTC instant. */
export function startOfCurrentISTWeek(now = new Date()): Date {
  const istOffsetMs = 330 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);
  const daysSinceMonday = (istNow.getUTCDay() + 6) % 7;
  istNow.setUTCHours(0, 0, 0, 0);
  istNow.setUTCDate(istNow.getUTCDate() - daysSinceMonday);
  return new Date(istNow.getTime() - istOffsetMs);
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  rank: number;
  streak: number;
}

type LeaderboardSqlRow = {
  kind: "ENTRY" | "CURRENT" | "AHEAD";
  id: string;
  name: string;
  points: bigint;
  rank: bigint;
  streak: number;
};

function leaderboardCte(period: LeaderboardPeriod, now: Date) {
  const dateFilter =
    period === "weekly"
      ? Prisma.sql`WHERE pt."createdAt" >= ${startOfCurrentISTWeek(now)}`
      : Prisma.empty;
  return Prisma.sql`
    WITH totals AS (
      SELECT
        u."id",
        u."name",
        COALESCE(streak."current", 0)::int AS "streak",
        awards."points"
      FROM "User" AS u
      LEFT JOIN "Streak" AS streak ON streak."userId" = u."id"
      INNER JOIN (
        SELECT pt."userId", SUM(pt."amount")::bigint AS "points"
        FROM "PointTransaction" AS pt
        INNER JOIN "Submission" AS submission
          ON submission."id" = pt."submissionId"
          AND submission."userId" = pt."userId"
          AND submission."status" = 'APPROVED'::"SubmissionStatus"
        ${dateFilter}
        GROUP BY pt."userId"
      ) AS awards ON awards."userId" = u."id"
      WHERE u."status" = 'APPROVED'::"UserStatus"
    ), ranked AS (
      SELECT
        totals.*,
        ROW_NUMBER() OVER (
          ORDER BY totals."points" DESC,
            LOWER(totals."name") COLLATE "C" ASC,
            totals."id" COLLATE "C" ASC
        ) AS "rank"
      FROM totals
    )
  `;
}

function toLeaderboardEntry(row: LeaderboardSqlRow): LeaderboardEntry {
  return {
    id: row.id,
    name: row.name,
    points: Number(row.points),
    rank: Number(row.rank),
    streak: row.streak,
  };
}

/** Paginate ranked approved work while returning the caller's standing independently. */
export async function getLeaderboard(
  prisma: PrismaClient,
  userId: string,
  query: LeaderboardQuery,
  now = new Date()
) {
  const cte = leaderboardCte(query.period, now);
  const [counts, rows] = await prisma.$transaction(
    [
      prisma.$queryRaw<Array<{ total: number }>>(
        Prisma.sql`${cte} SELECT COUNT(*)::int AS "total" FROM ranked`
      ),
      prisma.$queryRaw<LeaderboardSqlRow[]>(Prisma.sql`
        ${cte}
        SELECT 'ENTRY'::text AS "kind", ranked."id", ranked."name", ranked."points", ranked."rank", ranked."streak"
        FROM ranked
        WHERE ranked."rank" > ${query.offset} AND ranked."rank" <= ${query.offset + query.limit}
        UNION ALL
        SELECT 'CURRENT'::text AS "kind", ranked."id", ranked."name", ranked."points", ranked."rank", ranked."streak"
        FROM ranked WHERE ranked."id" = ${userId}
        UNION ALL
        SELECT 'AHEAD'::text AS "kind", ahead."id", ahead."name", ahead."points", ahead."rank", ahead."streak"
        FROM ranked AS ahead
        INNER JOIN ranked AS me ON ahead."rank" = me."rank" - 1
        WHERE me."id" = ${userId}
      `),
    ],
    { isolationLevel: "RepeatableRead" }
  );
  const total = counts[0]?.total ?? 0;
  const entries = rows
    .filter((row) => row.kind === "ENTRY")
    .sort((a, b) => Number(a.rank - b.rank))
    .map(toLeaderboardEntry);
  const currentUserRow = rows.find((row) => row.kind === "CURRENT");
  const aheadRow = rows.find((row) => row.kind === "AHEAD");
  return {
    entries,
    total,
    pagination: paginationMeta({ limit: query.limit, offset: query.offset }, total),
    currentUser: currentUserRow ? toLeaderboardEntry(currentUserRow) : null,
    userAhead: aheadRow ? toLeaderboardEntry(aheadRow) : null,
  };
}
