import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { hasSameOrigin } from "@/lib/auth/development-member";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { readJsonObject } from "@/lib/api/request";
import { CHAT_BODY_MAX_BYTES, setPinned } from "@/lib/chat/service";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import { requirePersistedAccount } from "@/lib/tasks/service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  if (!hasSameOrigin(request)) return errors.forbidden();
  // Pinning is a moderation action: the cookie must carry the permission AND the persisted
  // account must still be an ADMIN (checked in setPinned).
  const guard = authorize(request, {
    requiredPermission: "admin:moderate_chat",
    allowedStatuses: ["APPROVED"],
  });
  if (!guard.authorized) return guard.errorResponse;
  const { id } = await params;
  if (!id || id.length > 128) return errors.notFound("Message");

  const body = await readJsonObject(request, {
    maxBytes: CHAT_BODY_MAX_BYTES,
    message: "Provide a valid pin request.",
  });
  if (!body.ok) return body.response;
  const pinned = body.value.pinned;
  if (Object.keys(body.value).some((key) => key !== "pinned") || typeof pinned !== "boolean")
    return apiError("VALIDATION_ERROR", "Choose whether to pin or unpin.", 400);

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await setPinned(prisma, account.account, id, pinned);
    if (!result.ok) return result.response;
    return NextResponse.json(
      { message: result.message },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined, {
      stage: "chat_pin",
    });
    return errors.internal();
  }
}
