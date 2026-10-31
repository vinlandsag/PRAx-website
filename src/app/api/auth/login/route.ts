import { NextResponse } from "next/server";
import { backendUnavailable } from "@/lib/api/backend";
import {
  localDevelopmentMember,
  hasSameOrigin,
  verifyDevelopmentPassword,
} from "@/lib/auth/development-member";
import { getSessionCookieOptions, signSession, SESSION_DURATION_MS } from "@/lib/auth/session";
import { rateLimit, RATE_LIMIT_POLICIES } from "@/lib/auth/rate-limit";
import { apiError, errors } from "@/lib/errors";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  const member = localDevelopmentMember(request);
  if (!member) return backendUnavailable();
  if (!hasSameOrigin(request)) return errors.forbidden();
  const policy = RATE_LIMIT_POLICIES.login;
  if (!rateLimit("local-development-member-login", policy.limit, policy.windowMs).success)
    return errors.rateLimited();
  let data: unknown;
  try {
    const body = await request.text();
    if (body.length > 4096)
      return apiError("VALIDATION_ERROR", "Sign-in request is too large.", 400);
    data = JSON.parse(body);
  } catch {
    return apiError("VALIDATION_ERROR", "Enter an email address and password.", 400);
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    return apiError("VALIDATION_ERROR", "Enter an email address and password.", 400);
  const { email, password } = data as Record<string, unknown>;
  if (
    typeof email !== "string" ||
    !email.trim() ||
    email.length > 254 ||
    typeof password !== "string" ||
    !password ||
    password.length > 1024
  )
    return apiError("VALIDATION_ERROR", "Enter a valid email address and password.", 400);
  if (email.trim().toLowerCase() !== member.email) return backendUnavailable();
  if (env.sessionSecret.length < 32)
    return apiError(
      "BACKEND_NOT_CONFIGURED",
      "Local test sign-in requires a configured SESSION_SECRET.",
      503
    );
  if (!(await verifyDevelopmentPassword(password)))
    return apiError("UNAUTHENTICATED", "Email or password is incorrect.", 401);
  const response = NextResponse.json(
    { user: member },
    { headers: { "Cache-Control": "no-store" } }
  );
  const cookie = getSessionCookieOptions();
  response.cookies.set(
    cookie.name,
    signSession(member, SESSION_DURATION_MS, { developmentOnly: true }),
    cookie
  );
  return response;
}
