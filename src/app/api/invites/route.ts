/**
 * src/app/api/invites/route.ts
 *
 * Admin endpoints to generate and list invite codes.
 * Conforms to API_CONTRACTS.md and MVP_SPEC.md §2.3 / §5 / §8.
 */

import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { authStore } from "@/lib/db/auth-store";
import { apiError, errors } from "@/lib/errors";

export async function GET(request: Request) {
  const guard = authorize(request, { allowedRoles: ["ADMIN"] });
  if (!guard.authorized) {
    return guard.errorResponse;
  }

  const invites = await authStore.listInvites();
  return NextResponse.json({ invites });
}

export async function POST(request: Request) {
  const guard = authorize(request, { allowedRoles: ["ADMIN"] });
  if (!guard.authorized) {
    return guard.errorResponse;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { maxUses, expiresAt } = body;

    if (
      maxUses !== undefined &&
      (typeof maxUses !== "number" || maxUses < 1 || !Number.isInteger(maxUses))
    ) {
      return apiError("VALIDATION_ERROR", "maxUses must be a positive integer.", 400);
    }

    if (expiresAt !== undefined && expiresAt !== null) {
      const parsedDate = new Date(expiresAt);
      if (isNaN(parsedDate.getTime()) || parsedDate.getTime() <= Date.now()) {
        return apiError(
          "VALIDATION_ERROR",
          "expiresAt must be a valid future ISO date string.",
          400
        );
      }
    }

    const invite = await authStore.createInvite({
      maxUses: maxUses ?? 1,
      expiresAt: expiresAt ?? null,
      createdById: guard.user.id,
    });

    return NextResponse.json({ invite }, { status: 201 });
  } catch {
    return errors.internal();
  }
}
