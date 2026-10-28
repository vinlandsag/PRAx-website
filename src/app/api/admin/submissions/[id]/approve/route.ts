/**
 * src/app/api/admin/submissions/[id]/approve/route.ts
 *
 * POST /api/admin/submissions/:id/approve
 * Approves a submission and awards points through the Person 3 transactional boundary.
 * Protected: ADMIN only.
 */

import { NextResponse } from "next/server";
import { createAuditEvent } from "@/lib/audit/audit";
import { authorize } from "@/lib/auth/guard";
import { submissionsStore } from "@/lib/db/submissions-store";
import { apiError, errors } from "@/lib/errors";
import { pointsBoundary } from "@/lib/points/points-boundary";
import { rubricStore } from "@/lib/rubric/rubric-store";

function validateAwardedPoints(
  pointsAwarded: unknown,
  maxPoints: number
): { valid: boolean; points: number; error?: string } {
  if (pointsAwarded === undefined || pointsAwarded === null) {
    return { valid: true, points: maxPoints };
  }
  if (
    typeof pointsAwarded !== "number" ||
    Number.isNaN(pointsAwarded) ||
    !Number.isFinite(pointsAwarded)
  ) {
    return { valid: false, points: 0, error: "pointsAwarded must be a valid integer number." };
  }
  if (!Number.isInteger(pointsAwarded)) {
    return {
      valid: false,
      points: 0,
      error: "pointsAwarded must be an integer. Fractional points are not allowed.",
    };
  }
  if (pointsAwarded < 0) {
    return { valid: false, points: 0, error: "pointsAwarded cannot be negative." };
  }
  if (pointsAwarded > maxPoints) {
    return {
      valid: false,
      points: 0,
      error: `pointsAwarded (${pointsAwarded}) cannot exceed task maximum (${maxPoints}).`,
    };
  }
  return { valid: true, points: pointsAwarded };
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const guard = authorize(request, { allowedRoles: ["ADMIN"] });
  if (!guard.authorized) {
    return guard.errorResponse;
  }

  const { id } = params;
  if (!id) {
    return errors.notFound("Submission");
  }

  const existing = await submissionsStore.findSubmissionById(id);
  if (!existing) {
    return errors.notFound("Submission");
  }

  // Idempotency check: if already approved, block transition to prevent duplicate points
  if (existing.status === "APPROVED") {
    return apiError("INVALID_STATE_TRANSITION", "Submission has already been approved.", 422);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { pointsAwarded } = body;

    const validation = validateAwardedPoints(pointsAwarded, existing.maxPoints);
    if (!validation.valid) {
      return apiError("VALIDATION_ERROR", validation.error || "Invalid points value.", 400);
    }
    const points = validation.points;

    const activeRubric = rubricStore.getActiveRubric();
    const idempotencyKey = `pts_${id}_${activeRubric.version}`;

    // Dispatch approved score across the shared transaction boundary to Person 3's service
    const boundaryResult = await pointsBoundary.dispatchApprovedPoints({
      submissionId: id,
      userId: existing.userId,
      pointsAwarded: points,
      maxPoints: existing.maxPoints,
      rubricVersion: activeRubric.version,
      reviewedById: guard.user.id,
      taskTitle: existing.taskTitle,
      idempotencyKey,
    });

    if (!boundaryResult.success) {
      // Rollback: abort approval without mutating submission state
      return apiError(
        "INTERNAL_ERROR",
        boundaryResult.error || "Failed to persist points transaction across boundary.",
        500
      );
    }

    const updated = await submissionsStore.updateSubmission(id, {
      status: "APPROVED",
      pointsAwarded: points,
      rubricVersion: activeRubric.version,
      transactionId: boundaryResult.transactionId,
      reviewedById: guard.user.id,
      reviewedAt: new Date().toISOString(),
    });

    // Record audit event for submission approval with rubric version
    createAuditEvent("SUBMISSION_APPROVED", guard.user.id, {
      targetId: id,
      priorState: existing.status,
      newState: "APPROVED",
      metadata: {
        pointsAwarded: points,
        maxPoints: existing.maxPoints,
        rubricVersion: activeRubric.version,
        transactionId: boundaryResult.transactionId,
        userId: existing.userId,
      },
    });

    // Emit points assigned audit event if points were awarded
    if (points > 0) {
      createAuditEvent("POINTS_ASSIGNED", guard.user.id, {
        targetId: existing.userId,
        reason: `Points awarded for task: ${existing.taskTitle}`,
        metadata: {
          submissionId: id,
          amount: points,
          rubricVersion: activeRubric.version,
          transactionId: boundaryResult.transactionId,
        },
      });
    }

    return NextResponse.json({ submission: updated, transactionId: boundaryResult.transactionId });
  } catch {
    return errors.internal();
  }
}
