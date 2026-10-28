/**
 * src/app/api/invites/verify/route.ts
 *
 * Public endpoint to verify invite code validity before registration.
 * Rate limited to resist brute-force code guessing.
 * Conforms to API_CONTRACTS.md.
 */

import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/auth-store";
import { validateInviteCode } from "@/lib/auth/invite";
import { rateLimit, getClientIp, RATE_LIMIT_POLICIES } from "@/lib/auth/rate-limit";
import { apiError, errors } from "@/lib/errors";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(
    `invite:verify:${ip}`,
    RATE_LIMIT_POLICIES.inviteVerify.limit,
    RATE_LIMIT_POLICIES.inviteVerify.windowMs
  );
  if (!rl.success) {
    return errors.rateLimited("Too many invite verification attempts. Please try again later.");
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return apiError("VALIDATION_ERROR", "Invite code is required.", 400);
    }

    const invite = await authStore.findInviteByCode(code);
    const validation = validateInviteCode(invite);

    if (!validation.valid) {
      return apiError(
        validation.errorCode ?? "INVALID_INVITE",
        validation.errorCode === "INVITE_EXHAUSTED"
          ? "This invite code has reached its maximum uses."
          : "Invalid or expired invite code.",
        400
      );
    }

    return NextResponse.json({
      valid: true,
      remainingUses: validation.remainingUses,
    });
  } catch {
    return errors.internal();
  }
}
