/**
 * src/app/api/admin/submissions/[id]/request-revision/route.ts
 *
 * POST /api/admin/submissions/:id/request-revision
 * Requests revision from the member with specific guidance.
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

  try {
    const body = await request.json().catch(() => ({}));
    const feedback = (body.feedback || body.reason || "").trim();

    if (!feedback || feedback.length < 3) {
      return apiError(
        "VALIDATION_ERROR",
        "Revision request requires actionable feedback of at least 3 characters.",
        400
      );
    }

    const updated = await submissionsStore.updateSubmission(id, {
      status: "REVISION_REQUESTED",
      feedback,
      reviewedById: guard.user.id,
      reviewedAt: new Date().toISOString(),
    });

    createAuditEvent("SUBMISSION_REVISION_REQUESTED", guard.user.id, {
      targetId: id,
      priorState: existing.status,
      newState: "REVISION_REQUESTED",
      reason: feedback,
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
