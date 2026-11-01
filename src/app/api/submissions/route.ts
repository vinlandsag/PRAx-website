import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { readJsonObject } from "@/lib/api/request";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import {
  createSubmission,
  isSubmissionUniqueConflict,
  listOwnSubmissions,
  parseSubmissionInput,
  parseSubmissionQuery,
  requireSubmissionAccount,
} from "@/lib/submissions/service";

export async function GET(request: Request) {
  const guard = authorize(request);
  if (!guard.authorized) return guard.errorResponse;

  const query = parseSubmissionQuery(new URL(request.url).searchParams);
  if (!query.ok) return query.response;
  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requireSubmissionAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await listOwnSubmissions(prisma, guard.user, query.value);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}

export async function POST(request: Request) {
  const guard = authorize(request, { requiredRole: "MEMBER" });
  if (!guard.authorized) return guard.errorResponse;

  const body = await readJsonObject(request, {
    message: "Provide a task, proof link, and explanation.",
  });
  if (!body.ok) return body.response;
  const parsed = parseSubmissionInput(body.value);
  if (!parsed.ok) return parsed.response;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requireSubmissionAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await createSubmission(prisma, guard.user, parsed.value);
    if (!result.ok) return result.response;
    return NextResponse.json(
      { submission: result.submission },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (isSubmissionUniqueConflict(error)) {
      return apiError(
        "SUBMISSION_IN_PROGRESS",
        "An active submission already exists for this task.",
        409
      );
    }
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
