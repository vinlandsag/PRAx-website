/**
 * src/app/api/admin/submissions/[id]/approve/route.ts
 *
 * POST /api/admin/submissions/:id/approve
 * Approves a submission and awards points.
 * Protected: ADMIN only.
 */

import { NextResponse } from "next/server";
import { createAuditEvent } from "@/lib/audit/audit";
import { authorize } from "@/lib/auth/guard";
import { submissionsStore } from "@/lib/db/submissions-store";
import { apiError, errors } from "@/lib/errors";

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

  if (existing.status === "APPROVED") {
    return apiError("INVALID_STATE_TRANSITION", "Submission has already been approved.", 422);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { pointsAwarded } = body;

    let points = existing.maxPoints;
    if (pointsAwarded !== undefined && pointsAwarded !== null) {
      if (
        typeof pointsAwarded !== "number" ||
        pointsAwarded < 0 ||
        !Number.isInteger(pointsAwarded) ||
        pointsAwarded > existing.maxPoints
      ) {
        return apiError(
          "VALIDATION_ERROR",
          `pointsAwarded must be an integer between 0 and max points (${existing.maxPoints}).`,
          400
        );
      }
      points = pointsAwarded;
    }

    const updated = await submissionsStore.updateSubmission(id, {
      status: "APPROVED",
      pointsAwarded: points,
      reviewedById: guard.user.id,
      reviewedAt: new Date().toISOString(),
    });

    // Record audit event for submission approval
    createAuditEvent("SUBMISSION_APPROVED", guard.user.id, {
      targetId: id,
      priorState: existing.status,
      newState: "APPROVED",
      metadata: {
        pointsAwarded: points,
        maxPoints: existing.maxPoints,
        userId: existing.userId,
      },
    });

    // If points awarded > 0, emit points assigned audit event
    if (points > 0) {
      createAuditEvent("POINTS_ASSIGNED", guard.user.id, {
        targetId: existing.userId,
        reason: `Points awarded for task: ${existing.taskTitle}`,
        metadata: {
          submissionId: id,
          amount: points,
        },
      });
    }

    return NextResponse.json({ submission: updated });
  } catch {
    return errors.internal();
  }
}
