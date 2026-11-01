import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { backendUnavailable } from "@/lib/api/backend";
import { readJsonObject } from "@/lib/api/request";
import { logApiFailure } from "@/lib/api/logger";
import { errors } from "@/lib/errors";
import { getPrismaClient } from "@/lib/db/prisma";
import { getTaskDetail, parseTaskWriteInput, requirePersistedAccount } from "@/lib/tasks/service";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const guard = authorize(request);
  if (!guard.authorized) return guard.errorResponse;
  const { id } = await params;
  if (!id || id.length > 128) return errors.notFound("Task");

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await getTaskDetail(prisma, id, guard.user);
    if (!result.ok) return result.response;
    return NextResponse.json({ task: result.task }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const guard = authorize(request, { requiredRole: "ADMIN" });
  if (!guard.authorized) return guard.errorResponse;
  const { id } = await params;
  if (!id || id.length > 128) return errors.notFound("Task");

  const body = await readJsonObject(request, { message: "Provide valid task fields." });
  if (!body.ok) return body.response;
  const parsed = parseTaskWriteInput(body.value, true);
  if (!parsed.ok) return parsed.response;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const existing = await prisma.task.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return errors.notFound("Task");
    await prisma.task.update({ where: { id }, data: parsed.value });
    const result = await getTaskDetail(prisma, id, guard.user);
    if (!result.ok) return result.response;
    return NextResponse.json({ task: result.task }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
