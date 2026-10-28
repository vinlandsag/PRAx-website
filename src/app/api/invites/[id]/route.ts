/**
 * src/app/api/invites/[id]/route.ts
 *
 * Admin endpoint to revoke an active invite code.
 * Conforms to API_CONTRACTS.md and MVP_SPEC.md §5 / §8.
 */

import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { authStore } from "@/lib/db/auth-store";
import { apiError, errors } from "@/lib/errors";

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const guard = authorize(request, { allowedRoles: ["ADMIN"] });
  if (!guard.authorized) {
    return guard.errorResponse;
  }

  const { id } = params;
  if (!id) {
    return errors.notFound("Invite code");
  }

  const existing = await authStore.findInviteById(id);
  if (!existing) {
    return errors.notFound("Invite code");
  }

  // Already terminal states cannot transition again (MVP_SPEC §5)
  if (existing.status === "REVOKED" || existing.status === "USED") {
    return apiError(
      "INVALID_STATE_TRANSITION",
      `Cannot revoke an invite code that is already in terminal state '${existing.status}'.`,
      422
    );
  }

  const revoked = await authStore.revokeInvite(id);
  return NextResponse.json({ invite: revoked });
}
