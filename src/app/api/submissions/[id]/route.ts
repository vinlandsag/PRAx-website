import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { readJsonObject } from "@/lib/api/request";
import { getPrismaClient } from "@/lib/db/prisma";
import { errors } from "@/lib/errors";
import {
  getSubmission,
  parseSubmissionInput,
  requireSubmissionAccount,
  updateOwnSubmission,
  withdrawOwnSubmission,
} from "@/lib/submissions/service";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const guard = authorize(request);
  if (!guard.authorized) return guard.errorResponse;
  const { id } = await params;
  if (!id || id.length > 128) return errors.notFound("Submission");

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  try {
    const account = await requireSubmissionAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await getSubmission(prisma, id, guard.user, true);
    if (!result.ok) return result.response;
    return NextResponse.json(
      { submission: result.submission },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const guard = authorize(request, { requiredRole: "MEMBER" });
  if (!guard.authorized) return guard.errorResponse;
  const { id } = await params;
  if (!id || id.length > 128) return errors.notFound("Submission");

  const body = await readJsonObject(request, { message: "Provide valid submission fields." });
  if (!body.ok) return body.response;
  const parsed = parseSubmissionInput(body.value, true);
  if (!parsed.ok) return parsed.response;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  try {
    const account = await requireSubmissionAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await updateOwnSubmission(prisma, id, account.account.id, parsed.value);
    if (!result.ok) return result.response;
    return NextResponse.json(
      { submission: result.submission },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const guard = authorize(request, { requiredRole: "MEMBER" });
  if (!guard.authorized) return guard.errorResponse;
  const { id } = await params;
  if (!id || id.length > 128) return errors.notFound("Submission");

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  try {
    const account = await requireSubmissionAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await withdrawOwnSubmission(prisma, id, account.account.id);
    if (!result.ok) return result.response;
    return NextResponse.json(
      { submission: result.submission },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
