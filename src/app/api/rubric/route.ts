/**
 * src/app/api/rubric/route.ts
 *
 * GET /api/rubric — Get the active published scoring rubric (Member or Admin).
 * PUT /api/rubric — Update rubric criteria (ADMIN only).
 */

import { NextResponse } from "next/server";
import { createAuditEvent } from "@/lib/audit/audit";
import { authorize } from "@/lib/auth/guard";
import { apiError, errors } from "@/lib/errors";
import { type RubricCriterion, rubricStore } from "@/lib/rubric/rubric-store";

export async function GET(request: Request) {
  const guard = authorize(request, { allowedStatuses: ["APPROVED"] });
  if (!guard.authorized) {
    return guard.errorResponse;
  }

  const rubric = rubricStore.getActiveRubric();
  return NextResponse.json({ rubric });
}

export async function PUT(request: Request) {
  const guard = authorize(request, { allowedRoles: ["ADMIN"] });
  if (!guard.authorized) {
    return guard.errorResponse;
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return apiError(
        "VALIDATION_ERROR",
        "Request body must be a JSON object containing criteria.",
        400
      );
    }

    const { criteria } = body as { criteria?: unknown };
    const validation = rubricStore.validateCriteria(criteria);
    if (!validation.valid) {
      return apiError("VALIDATION_ERROR", validation.error || "Invalid rubric criteria.", 400);
    }

    const priorRubric = rubricStore.getActiveRubric();
    const updatedRubric = rubricStore.updateRubric(criteria as RubricCriterion[], guard.user.id);

    // Emit audit event for rubric modification
    createAuditEvent("RUBRIC_UPDATED", guard.user.id, {
      priorState: priorRubric.version,
      newState: updatedRubric.version,
      metadata: {
        totalCriteria: updatedRubric.criteria.length,
        totalMaxPoints: updatedRubric.totalMaxPoints,
        priorMaxPoints: priorRubric.totalMaxPoints,
      },
    });

    return NextResponse.json({ rubric: updatedRubric });
  } catch {
    return errors.internal();
  }
}
