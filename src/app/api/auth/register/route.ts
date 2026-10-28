/**
 * src/app/api/auth/register/route.ts
 *
 * Public registration endpoint with invite code requirement.
 * Conforms to API_CONTRACTS.md and MVP_SPEC.md §3 / §5 / §8.
 */

import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/auth-store";
import { hashPassword } from "@/lib/auth/password";
import { validateInviteCode } from "@/lib/auth/invite";
import { rateLimit, getClientIp, RATE_LIMIT_POLICIES } from "@/lib/auth/rate-limit";
import { apiError, errors } from "@/lib/errors";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(
    `register:${ip}`,
    RATE_LIMIT_POLICIES.register.limit,
    RATE_LIMIT_POLICIES.register.windowMs
  );
  if (!rl.success) {
    return errors.rateLimited();
  }

  try {
    const body = await request.json();
    const { email, password, name, inviteCode } = body;

    // Validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return apiError("VALIDATION_ERROR", "A valid email address is required.", 400);
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return apiError("VALIDATION_ERROR", "Name is required.", 400);
    }
    if (!inviteCode || typeof inviteCode !== "string") {
      return apiError("INVALID_INVITE", "An invite code is required to register.", 400);
    }
    if (password && (typeof password !== "string" || password.length < 8)) {
      return apiError("VALIDATION_ERROR", "Password must be at least 8 characters.", 400);
    }

    // Check if email already registered
    const existing = await authStore.findUserByEmail(email);
    if (existing) {
      return apiError("VALIDATION_ERROR", "An account with this email already exists.", 400);
    }

    // Verify invite code state before consumption
    const invite = await authStore.findInviteByCode(inviteCode);
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

    // Consume invite code atomically
    const consumeResult = await authStore.consumeInvite(inviteCode);
    if (!consumeResult.success) {
      return apiError(
        consumeResult.errorCode ?? "INVALID_INVITE",
        "Could not redeem invite code.",
        400
      );
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    // Create user in PENDING_APPROVAL state (MVP_SPEC §3)
    const newUser = await authStore.createUser({
      email,
      name,
      passwordHash,
      role: "MEMBER",
      status: "PENDING_APPROVAL",
    });

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          status: newUser.status,
        },
      },
      { status: 201 }
    );
  } catch {
    return errors.internal();
  }
}
