import { NextResponse } from "next/server";
import { authorize, type GuardOptions } from "@/lib/auth/guard";
import { hasSameOrigin } from "@/lib/auth/development-member";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { readJsonObject } from "@/lib/api/request";
import {
  CHAT_BODY_MAX_BYTES,
  deleteMessage,
  editMessage,
  parseMessageContent,
} from "@/lib/chat/service";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import { requirePersistedAccount } from "@/lib/tasks/service";

type Context = { params: Promise<{ id: string }> };
const noStore = { headers: { "Cache-Control": "no-store" } };
const requestId = (request: Request) => request.headers.get("x-request-id") ?? undefined;
const permission: GuardOptions = {
  requiredPermission: "chat:read_write",
  allowedStatuses: ["APPROVED"],
};

export async function PATCH(request: Request, { params }: Context) {
  if (!hasSameOrigin(request)) return errors.forbidden();
  const guard = authorize(request, permission);
  if (!guard.authorized) return guard.errorResponse;
  const { id } = await params;
  if (!id || id.length > 128) return errors.notFound("Message");

  const body = await readJsonObject(request, {
    maxBytes: CHAT_BODY_MAX_BYTES,
    message: "Provide a valid message.",
  });
  if (!body.ok) return body.response;
  const content = parseMessageContent(body.value.content);
  if (Object.keys(body.value).some((key) => key !== "content") || content === undefined)
    return apiError("VALIDATION_ERROR", "Write a message of up to 500 characters.", 400);

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await editMessage(prisma, account.account, id, content);
    if (!result.ok) return result.response;
    return NextResponse.json({ message: result.message }, noStore);
  } catch {
    logApiFailure("unexpected_error", requestId(request), { stage: "chat_edit" });
    return errors.internal();
  }
}

export async function DELETE(request: Request, { params }: Context) {
  if (!hasSameOrigin(request)) return errors.forbidden();
  const guard = authorize(request, permission);
  if (!guard.authorized) return guard.errorResponse;
  const { id } = await params;
  if (!id || id.length > 128) return errors.notFound("Message");

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await deleteMessage(prisma, account.account, id);
    if (!result.ok) return result.response;
    return new Response(null, { status: 204, ...noStore });
  } catch {
    logApiFailure("unexpected_error", requestId(request), { stage: "chat_delete" });
    return errors.internal();
  }
}
