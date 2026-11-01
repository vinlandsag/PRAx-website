import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { readJsonObject } from "@/lib/api/request";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import { dispatchApprovedPoints } from "@/lib/points/service";
import { MVP_REVIEW_RUBRIC_VERSION } from "@/lib/reviews/service";
import { requirePersistedAccount } from "@/lib/tasks/service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const guard = authorize(request, { requiredRole: "ADMIN" });
  if (!guard.authorized) return guard.errorResponse;

  const { id } = await params;
  if (!id || id.length > 128) return errors.notFound("Submission");
  const body = await readJsonObject(request, {
    maxBytes: 4096,
    message: "Provide the approved score.",
  });
  if (!body.ok) return body.response;
  if (
    Object.keys(body.value).some((key) => key !== "pointsAwarded") ||
    typeof body.value.pointsAwarded !== "number" ||
    !Number.isSafeInteger(body.value.pointsAwarded) ||
    body.value.pointsAwarded < 0
  ) {
    return apiError("VALIDATION_ERROR", "The awarded score must be a non-negative integer.", 400);
  }

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    if (account.account.role !== "ADMIN") return errors.forbidden();

    const result = await dispatchApprovedPoints(prisma, {
      submissionId: id,
      pointsAwarded: body.value.pointsAwarded,
      rubricVersion: MVP_REVIEW_RUBRIC_VERSION,
      reviewedById: account.account.id,
      idempotencyKey: `pts_${id}_${MVP_REVIEW_RUBRIC_VERSION}`,
    });
    if (!result.success) {
      if (result.error === "INVALID_AWARD" || result.error === "SCORE_OUT_OF_RANGE") {
        return apiError("VALIDATION_ERROR", "The score must be within the task's point limit.", 400);
      }
      if (result.error === "REVIEWER_NOT_AUTHORIZED") return errors.forbidden();
      if (result.error === "SUBMISSION_NOT_ELIGIBLE") return errors.notFound("Submission");
      if (result.error === "INVALID_STATE_TRANSITION" || result.error === "IDEMPOTENCY_CONFLICT") {
        return apiError("INVALID_STATE_TRANSITION", "This submission has already been reviewed.", 409);
      }
      return errors.internal();
    }
    return NextResponse.json(
      {
        success: true,
        transactionId: result.transactionId,
        pointsAwarded: result.pointsAwarded,
        alreadyProcessed: result.alreadyProcessed,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
