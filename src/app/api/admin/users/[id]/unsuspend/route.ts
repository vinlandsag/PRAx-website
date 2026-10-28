/**
 * src/app/api/admin/users/[id]/unsuspend/route.ts
 *
 * Admin endpoint to unsuspend a member account (SUSPENDED -> APPROVED).
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

  const result = await transitionUserStatus({
    targetUserId: id,
    targetStatus: "APPROVED",
    actor: guard.user,
  });

  if (!result.success || !result.user) {
    return apiError(
      result.errorCode || "INVALID_STATE_TRANSITION",
      result.errorMessage || "Could not unsuspend user.",
      result.errorCode === "NOT_FOUND" ? 404 : result.errorCode === "FORBIDDEN" ? 403 : 422
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
}
