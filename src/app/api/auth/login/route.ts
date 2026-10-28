/**
 * src/app/api/auth/login/route.ts
 *
 * Password authentication endpoint.
 * Validates credentials, checks account status, enforces rate limiting,
 * and sets secure HTTP-only signed session cookie.
 */

import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/auth-store";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, getSessionCookieOptions } from "@/lib/auth/session";
import { rateLimit, getClientIp, RATE_LIMIT_POLICIES } from "@/lib/auth/rate-limit";
import { apiError, errors } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/types";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipRl = rateLimit(
    `login:ip:${ip}`,
    RATE_LIMIT_POLICIES.login.limit * 2,
    RATE_LIMIT_POLICIES.login.windowMs
  );
  if (!ipRl.success) {
    return errors.rateLimited();
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return apiError("VALIDATION_ERROR", "Email and password are required.", 400);
    }

    const emailKey = email.trim().toLowerCase();
    const userRl = rateLimit(
      `login:email:${emailKey}`,
      RATE_LIMIT_POLICIES.login.limit,
      RATE_LIMIT_POLICIES.login.windowMs
    );
    if (!userRl.success) {
      return errors.rateLimited(
        "Too many login attempts for this account. Please wait before retrying."
      );
    }

    const user = await authStore.findUserByEmail(emailKey);
    if (!user || !user.passwordHash) {
      return apiError("UNAUTHENTICATED", "Invalid email or password.", 401);
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return apiError("UNAUTHENTICATED", "Invalid email or password.", 401);
    }

    // Check account lifecycle status (MVP_SPEC §3)
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

    const token = signSession(sessionUser);
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({ user: sessionUser }, { status: 200 });
    response.cookies.set(cookieOptions.name, token, cookieOptions);

    return response;
  } catch {
    return errors.internal();
  }
}
