/**
 * src/app/api/admin/users/[id]/suspend/route.ts
 *
 * Admin endpoint to suspend a member account. Reason required.
 * Conforms to API_CONTRACTS.md.
 */

import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { transitionUserStatus } from "@/lib/auth/state-machine";
import { apiError, errors } from "@/lib/errors";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const guard = authorize(request, { allowedRoles: ["ADMIN"] });
  if (!guard.authorized) {
    return guard.errorResponse;
  }

  const { id } = await props.params;
  if (!id) {
    return errors.notFound("User");
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    const result = await transitionUserStatus({
      targetUserId: id,
      targetStatus: "SUSPENDED",
      actor: guard.user,
      reason,
    });

    if (!result.success || !result.user) {
      return apiError(
        result.errorCode || "INVALID_STATE_TRANSITION",
        result.errorMessage || "Could not suspend user.",
        result.errorCode === "NOT_FOUND"
          ? 404
          : result.errorCode === "FORBIDDEN"
            ? 403
            : result.errorCode === "VALIDATION_ERROR"
              ? 400
              : 422
      );
    }

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        status: result.user.status,
      },
    });
  } catch {
    return errors.internal();
  }
}
