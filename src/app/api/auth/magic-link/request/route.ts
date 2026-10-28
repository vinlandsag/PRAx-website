/**
 * src/app/api/auth/magic-link/request/route.ts
 *
 * Endpoint to request a passwordless magic sign-in link.
 * Generates a high-entropy token, stores only its SHA-256 hash with 15-min TTL,
 * and enforces strict rate limits to protect against email flooding.
 */

import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/auth-store";
import { rateLimit, getClientIp, RATE_LIMIT_POLICIES } from "@/lib/auth/rate-limit";
import { apiError, errors } from "@/lib/errors";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipRl = rateLimit(
    `magic:req:ip:${ip}`,
    RATE_LIMIT_POLICIES.magicLinkRequest.limit * 2,
    RATE_LIMIT_POLICIES.magicLinkRequest.windowMs
  );
  if (!ipRl.success) {
    return errors.rateLimited();
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return apiError("VALIDATION_ERROR", "A valid email address is required.", 400);
    }

    const emailKey = email.trim().toLowerCase();
    const emailRl = rateLimit(
      `magic:req:email:${emailKey}`,
      RATE_LIMIT_POLICIES.magicLinkRequest.limit,
      RATE_LIMIT_POLICIES.magicLinkRequest.windowMs
    );
    if (!emailRl.success) {
      return errors.rateLimited("Too many requests for this email. Please wait before retrying.");
    }

    const user = await authStore.findUserByEmail(emailKey);
    if (!user) {
      // Obfuscated generic response to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists for this email, a sign-in link has been prepared.",
      });
    }

    if (user.status === "REJECTED" || user.status === "SUSPENDED" || user.status === "DISABLED") {
      return apiError(
        "ACCOUNT_NOT_ACTIVE",
        `Your account status is ${user.status.toLowerCase()}. Access is restricted.`,
        403
      );
    }

    const { rawToken, expiresAt } = await authStore.createMagicLinkToken(emailKey);

    // In development and test environments, we expose the token in the response payload for testing
    const isDevOrTest = process.env.NODE_ENV !== "production";

    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, a sign-in link has been prepared.",
      expiresAt,
      ...(isDevOrTest ? { token: rawToken } : {}),
    });
  } catch {
    return errors.internal();
  }
}
