/**
 * src/app/api/admin/submissions/[id]/reject/route.ts
 *
 * POST /api/admin/submissions/:id/reject
 * Rejects a submission and captures a mandatory feedback reason.
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

  if (existing.status === "REJECTED") {
    return apiError("INVALID_STATE_TRANSITION", "Submission has already been rejected.", 422);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const reason = (body.reason || body.feedback || "").trim();

    // Rejection MUST capture a reason (at least 3 characters)
    if (!reason || reason.length < 3) {
      return apiError(
        "VALIDATION_ERROR",
        "Rejection requires a feedback reason of at least 3 characters.",
        400
      );
    }

    const updated = await submissionsStore.updateSubmission(id, {
      status: "REJECTED",
      feedback: reason,
      reviewedById: guard.user.id,
      reviewedAt: new Date().toISOString(),
    });

    // Record audit event
    createAuditEvent("SUBMISSION_REJECTED", guard.user.id, {
      targetId: id,
      priorState: existing.status,
      newState: "REJECTED",
      reason,
      metadata: {
        userId: existing.userId,
        taskTitle: existing.taskTitle,
      },
    });

    return NextResponse.json({ submission: updated });
  } catch {
    return errors.internal();
  }
}
