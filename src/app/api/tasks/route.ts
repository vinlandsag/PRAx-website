import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { backendUnavailable } from "@/lib/api/backend";
import { readJsonObject } from "@/lib/api/request";
import { logApiFailure } from "@/lib/api/logger";
import { errors } from "@/lib/errors";
import { getPrismaClient } from "@/lib/db/prisma";
import {
  listTasks,
  parseTaskWriteInput,
  requirePersistedAccount,
  taskCreateData,
} from "@/lib/tasks/service";
import { parseTaskListQuery } from "@/lib/tasks/query";
import { getTaskDetail } from "@/lib/tasks/service";

export async function GET(request: Request) {
  const guard = authorize(request);
  if (!guard.authorized) return guard.errorResponse;

  const url = new URL(request.url);
  const query = parseTaskListQuery(url.searchParams, guard.user.role);
  if (!query.ok) return query.response;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await listTasks(prisma, guard.user, query.value);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}

export async function POST(request: Request) {
  const guard = authorize(request, { requiredRole: "ADMIN" });
  if (!guard.authorized) return guard.errorResponse;

  const body = await readJsonObject(request, { message: "Provide valid task fields." });
  if (!body.ok) return body.response;
  const parsed = parseTaskWriteInput(body.value, false);
  if (!parsed.ok) return parsed.response;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const task = await prisma.task.create({
      data: taskCreateData(parsed.value, account.account.id),
      select: { id: true },
    });
    const detail = await getTaskDetail(prisma, task.id, guard.user);
    if (!detail.ok) return detail.response;
    return NextResponse.json(
      { task: detail.task },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
