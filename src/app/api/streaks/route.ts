import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { getPrismaClient } from "@/lib/db/prisma";
import { errors } from "@/lib/errors";
import { requirePersistedAccount } from "@/lib/tasks/service";

function activityWindowStart(now: Date): Date {
  const istOffsetMs = 330 * 60 * 1000;
  const istToday = new Date(now.getTime() + istOffsetMs);
  istToday.setUTCHours(0, 0, 0, 0);
  istToday.setUTCDate(istToday.getUTCDate() - 41);
  // Prisma represents a PostgreSQL DATE as a UTC-midnight Date.
  return istToday;
}

export async function GET(request: Request) {
  const guard = authorize(request);
  if (!guard.authorized) return guard.errorResponse;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const [streak, activeDays] = await Promise.all([
      prisma.streak.findUnique({ where: { userId: account.account.id } }),
      prisma.streakDay.findMany({
        where: {
          userId: account.account.id,
          activityDate: { gte: activityWindowStart(new Date()) },
        },
        orderBy: { activityDate: "asc" },
        select: { activityDate: true },
      }),
    ]);

    return NextResponse.json(
      {
        current: streak?.current ?? 0,
        longest: streak?.longest ?? 0,
        activeDays: activeDays.map(({ activityDate }) => activityDate.toISOString().slice(0, 10)),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
