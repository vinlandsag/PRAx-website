import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { getPrismaClient } from "@/lib/db/prisma";
import { requirePersistedAccount } from "@/lib/tasks/service";
import { errors } from "@/lib/errors";
import { getLeaderboard, parseLeaderboardQuery } from "@/lib/points/service";

export async function GET(request: Request) {
  const guard = authorize(request);
  if (!guard.authorized) return guard.errorResponse;

  const query = parseLeaderboardQuery(new URL(request.url).searchParams);
  if (!query.ok) return query.response;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await getLeaderboard(prisma, guard.user.id, query.value);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
