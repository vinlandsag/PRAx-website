import { NextResponse } from "next/server";
import { backendUnavailable } from "@/lib/api/backend";
import { hasSameOrigin, localDevelopmentMember, verifyDevelopmentPassword } from "@/lib/auth/development-member";
import { getSessionCookieOptions, signSession, SESSION_DURATION_MS } from "@/lib/auth/session";
import { getClientIp, rateLimit, RATE_LIMIT_POLICIES } from "@/lib/auth/rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import { normalizeEmail, toSessionUser } from "@/lib/auth/persistence";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import { readJsonObject } from "@/lib/api/request";
import { env } from "@/lib/env";
import { logApiFailure } from "@/lib/api/logger";

// Valid scrypt hash for a non-account placeholder so unknown emails still take a password hash check.
const DUMMY_PASSWORD_HASH =
  "f85549bf0f92ed0aeccb29f443aaaa69:0298a4707f2924c82e08020925f22955e9e3ba16fe5ef5b5d881be520795b2d545f29407b7544a1c831d6859b9d2116c5e72d6f58eb079a8484bec3d1d23a86f";

function loginResponse(user: ReturnType<typeof toSessionUser>, developmentOnly = false) {
  const response = NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
  const cookie = getSessionCookieOptions();
  response.cookies.set(
    cookie.name,
    signSession(user, SESSION_DURATION_MS, { developmentOnly }),
    cookie
  );
  return response;
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return errors.forbidden();
  const policy = RATE_LIMIT_POLICIES.login;
  if (!rateLimit(`login:${getClientIp(request)}`, policy.limit, policy.windowMs).success)
    return errors.rateLimited();

  const parsed = await readJsonObject(request, {
    maxBytes: 4096,
    message: "Enter an email address and password.",
  });
  if (!parsed.ok) return parsed.response;
  const { email, password } = parsed.value;
  if (
    Object.keys(parsed.value).some((key) => !["email", "password"].includes(key)) ||
    typeof email !== "string" ||
    !email.trim() ||
    email.length > 254 ||
    typeof password !== "string" ||
    !password ||
    Buffer.byteLength(password, "utf8") > 256
  ) {
    return apiError("VALIDATION_ERROR", "Enter a valid email address and password.", 400);
  }

  const normalizedEmail = normalizeEmail(email);
  if (env.sessionSecret.length < 32)
    return apiError("BACKEND_NOT_CONFIGURED", "Sign-in is not configured.", 503);
  const localMember = localDevelopmentMember(request);
  if (localMember && normalizedEmail === localMember.email) {
    if (!(await verifyDevelopmentPassword(password)))
      return apiError("UNAUTHENTICATED", "Email or password is incorrect.", 401);
    return loginResponse(localMember, true);
  }

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  try {
    const account = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true, email: true, name: true, role: true, status: true, passwordHash: true },
    });
    const passwordMatches = await verifyPassword(
      password,
      account?.passwordHash ?? DUMMY_PASSWORD_HASH
    );
    if (!account || !passwordMatches)
      return apiError("UNAUTHENTICATED", "Email or password is incorrect.", 401);
    if (account.status === "REJECTED" || account.status === "SUSPENDED" || account.status === "DISABLED")
      return errors.accountNotActive();
    return loginResponse(toSessionUser(account));
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
