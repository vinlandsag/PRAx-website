import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { hasSameOrigin } from "@/lib/auth/development-member";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { readJsonObject } from "@/lib/api/request";
import { CHAT_BODY_MAX_BYTES, isReactionEmoji, toggleReaction } from "@/lib/chat/service";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import { requirePersistedAccount } from "@/lib/tasks/service";

type Context = { params: Promise<{ id: string }> };

/** Toggles the caller's reaction (one per member per emoji, from a fixed palette). */
export async function POST(request: Request, { params }: Context) {
  if (!hasSameOrigin(request)) return errors.forbidden();
  const guard = authorize(request, {
    requiredPermission: "chat:read_write",
    allowedStatuses: ["APPROVED"],
  });
  if (!guard.authorized) return guard.errorResponse;
  const { id } = await params;
  if (!id || id.length > 128) return errors.notFound("Message");

  const body = await readJsonObject(request, {
    maxBytes: CHAT_BODY_MAX_BYTES,
    message: "Provide a valid reaction.",
  });
  if (!body.ok) return body.response;
  const emoji = body.value.emoji;
  if (Object.keys(body.value).some((key) => key !== "emoji") || !isReactionEmoji(emoji))
    return apiError("VALIDATION_ERROR", "Choose one of the available reactions.", 400);

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await toggleReaction(prisma, account.account, id, emoji);
    if (!result.ok) return result.response;
    return NextResponse.json(
      { messageId: result.messageId, reactions: result.reactions },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined, {
      stage: "chat_react",
    });
    return errors.internal();
  }
}
