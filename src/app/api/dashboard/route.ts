import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { getPrismaClient } from "@/lib/db/prisma";
import { errors } from "@/lib/errors";
import { getLeaderboard } from "@/lib/points/service";
import { requirePersistedAccount } from "@/lib/tasks/service";

export async function GET(request: Request) {
  const guard = authorize(request);
  if (!guard.authorized) return guard.errorResponse;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;

    const userId = account.account.id;
    const [points, tasksApproved, streak, activity, leaderboard] = await Promise.all([
      prisma.pointTransaction.aggregate({
        where: { userId, submission: { status: "APPROVED" } },
        _sum: { amount: true },
      }),
      prisma.submission.count({ where: { userId, status: "APPROVED" } }),
      prisma.streak.findUnique({ where: { userId }, select: { current: true } }),
      prisma.submission.findMany({
        where: { userId, status: "APPROVED", reviewedAt: { not: null } },
        orderBy: [{ reviewedAt: "desc" }, { id: "desc" }],
        take: 5,
        select: { id: true, reviewedAt: true, task: { select: { title: true } } },
      }),
      getLeaderboard(prisma, userId, { period: "weekly", limit: 1, offset: 0 }),
    ]);

    return NextResponse.json(
      {
        totalPoints: points._sum.amount ?? 0,
        weeklyRank: leaderboard.currentUser?.rank ?? null,
        dayStreak: streak?.current ?? 0,
        tasksApproved,
        activity: activity.map((item) => ({
          id: item.id,
          title: `Approved: ${item.task.title}`,
          createdAt: item.reviewedAt!.toISOString(),
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined, {
      stage: "dashboard_read",
    });
    return errors.internal();
  }
}
