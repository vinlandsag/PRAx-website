import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { hasSameOrigin } from "@/lib/auth/development-member";
import { backendUnavailable } from "@/lib/api/backend";
import { readJsonObject } from "@/lib/api/request";
import { logApiFailure } from "@/lib/api/logger";
import { getPrismaClient } from "@/lib/db/prisma";
import { errors } from "@/lib/errors";
import { loadOwnProfile } from "@/lib/profile/service";
import { requirePersistedAccount } from "@/lib/tasks/service";
import { loadUserSettings, parseSettingsPatch, saveUserSettings } from "@/lib/settings/service";

export async function GET(request: Request) {
  const guard = authorize(request);
  if (!guard.authorized) return guard.errorResponse;
  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const [settings, profile] = await Promise.all([
      loadUserSettings(prisma, account.account.id),
      loadOwnProfile(prisma, account.account.id),
    ]);
    if (!profile) return errors.unauthenticated();
    return NextResponse.json(
      { user: { email: guard.user.email, role: account.account.role }, profile, settings },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined, {
      stage: "settings_read",
    });
    return errors.internal();
  }
}

export async function PATCH(request: Request) {
  if (!hasSameOrigin(request)) return errors.forbidden();
  const guard = authorize(request);
  if (!guard.authorized) return guard.errorResponse;
  const body = await readJsonObject(request, {
    maxBytes: 8 * 1024,
    message: "Provide valid settings.",
  });
  if (!body.ok) return body.response;
  const patch = parseSettingsPatch(body.value);
  if (!patch.ok) return patch.response;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const settings = await saveUserSettings(prisma, account.account.id, patch.value);
    return NextResponse.json(
      { user: { email: guard.user.email, role: account.account.role }, settings },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined, {
      stage: "settings_update",
    });
    return errors.internal();
  }
}
