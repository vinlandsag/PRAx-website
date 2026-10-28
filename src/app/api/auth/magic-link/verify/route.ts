/**
 * src/app/api/auth/magic-link/verify/route.ts
 *
 * Endpoint to verify and single-use consume a passwordless magic sign-in link token.
 * Authenticates the user and sets the secure session cookie.
 */

import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/auth-store";
import { signSession, getSessionCookieOptions } from "@/lib/auth/session";
import { rateLimit, getClientIp, RATE_LIMIT_POLICIES } from "@/lib/auth/rate-limit";
import { apiError, errors } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/types";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(
    `magic:verify:ip:${ip}`,
    RATE_LIMIT_POLICIES.magicLinkVerify.limit,
    RATE_LIMIT_POLICIES.magicLinkVerify.windowMs
  );
  if (!rl.success) {
    return errors.rateLimited();
  }

  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return apiError("VALIDATION_ERROR", "Token is required.", 400);
    }

    const verification = await authStore.verifyAndConsumeMagicLink(token);
    if (!verification.valid || !verification.email) {
      return apiError("UNAUTHENTICATED", "Invalid or expired sign-in link.", 401);
    }

    const user = await authStore.findUserByEmail(verification.email);
    if (!user) {
      return apiError("UNAUTHENTICATED", "User not found.", 401);
    }

    if (user.status === "REJECTED" || user.status === "SUSPENDED" || user.status === "DISABLED") {
      return apiError(
        "ACCOUNT_NOT_ACTIVE",
        `Your account status is ${user.status.toLowerCase()}. Access is restricted.`,
        403
      );
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };

    const sessionToken = signSession(sessionUser);
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({ user: sessionUser }, { status: 200 });
    response.cookies.set(cookieOptions.name, sessionToken, cookieOptions);

    return response;
  } catch {
    return errors.internal();
  }
}
