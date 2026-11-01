import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getSessionCookieOptions, SESSION_DURATION_MS, signSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/development-member";
import { toSessionUser } from "@/lib/auth/persistence";
import { readJsonObject } from "@/lib/api/request";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import { requirePersistedAccount } from "@/lib/tasks/service";
import {
  isUniqueHandleConflict,
  loadOwnProfile,
  loadOwnProfileStats,
  parseProfilePatch,
  saveOwnProfile,
} from "@/lib/profile/service";

export async function GET(request: Request) {
  const guard = authorize(request);
  if (!guard.authorized) return guard.errorResponse;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const profile = await loadOwnProfile(prisma, account.account.id);
    if (!profile) return errors.unauthenticated();
    const stats = await loadOwnProfileStats(prisma, account.account.id);
    return NextResponse.json({ profile, stats }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined, {
      stage: "profile_read",
    });
    return errors.internal();
  }
}

export async function PATCH(request: Request) {
  if (!hasSameOrigin(request)) return errors.forbidden();
  const guard = authorize(request);
  if (!guard.authorized) return guard.errorResponse;

  const body = await readJsonObject(request, {
    maxBytes: 16 * 1024,
    message: "Provide valid profile fields.",
  });
  if (!body.ok) return body.response;
  const patch = parseProfilePatch(body.value);
  if (!patch.ok) return patch.response;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const profile = await saveOwnProfile(prisma, account.account.id, patch.value);
    const stats = await loadOwnProfileStats(prisma, account.account.id);
    const currentUser = toSessionUser({
      id: account.account.id,
      email: guard.user.email,
      name: profile.name,
      role: account.account.role,
      status: account.account.status,
    });
    const response = NextResponse.json(
      { profile, stats },
      { headers: { "Cache-Control": "no-store" } }
    );
    const cookie = getSessionCookieOptions();
    response.cookies.set(
      cookie.name,
      signSession(currentUser, SESSION_DURATION_MS),
      cookie
    );
    return response;
  } catch (error) {
    if (isUniqueHandleConflict(error))
      return apiError("HANDLE_ALREADY_TAKEN", "That handle is already in use.", 409);
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined, {
      stage: "profile_update",
      code:
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: unknown }).code)
          : undefined,
    });
    return errors.internal();
  }
}
