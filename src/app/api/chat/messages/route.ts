import { NextResponse } from "next/server";
import { authorize, type GuardOptions } from "@/lib/auth/guard";
import { hasSameOrigin } from "@/lib/auth/development-member";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { readJsonObject } from "@/lib/api/request";
import {
  CHAT_BODY_MAX_BYTES,
  createMessage,
  getChatFeed,
  parseChatQuery,
  parseMessageContent,
} from "@/lib/chat/service";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import { requirePersistedAccount } from "@/lib/tasks/service";

const noStore = { headers: { "Cache-Control": "no-store" } };
const requestId = (request: Request) => request.headers.get("x-request-id") ?? undefined;
const permission: GuardOptions = {
  requiredPermission: "chat:read_write",
  allowedStatuses: ["APPROVED"],
};

export async function GET(request: Request) {
  const guard = authorize(request, permission);
  if (!guard.authorized) return guard.errorResponse;
  const query = parseChatQuery(new URL(request.url).searchParams);
  if (!query.ok) return query.response;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await getChatFeed(prisma, account.account, query.value);
    if (!result.ok) return result.response;
    return NextResponse.json(result.feed, noStore);
  } catch {
    logApiFailure("unexpected_error", requestId(request), { stage: "chat_read" });
    return errors.internal();
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return errors.forbidden();
  const guard = authorize(request, permission);
  if (!guard.authorized) return guard.errorResponse;

  const body = await readJsonObject(request, {
    maxBytes: CHAT_BODY_MAX_BYTES,
    message: "Provide a valid message.",
  });
  if (!body.ok) return body.response;
  // Attachments are not built yet: an empty list is fine, anything else is refused, not ignored.
  const attachmentIds = body.value.attachmentIds;
  const attachmentsOk =
    attachmentIds === undefined || (Array.isArray(attachmentIds) && attachmentIds.length === 0);
  const content = parseMessageContent(body.value.content);
  if (
    Object.keys(body.value).some((key) => key !== "content" && key !== "attachmentIds") ||
    content === undefined ||
    !attachmentsOk
  )
    return apiError(
      "VALIDATION_ERROR",
      attachmentsOk
        ? "Write a message of up to 500 characters."
        : "Attachments are not available yet.",
      400
    );

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await createMessage(prisma, account.account, content);
    if (!result.ok) return result.response;
    return NextResponse.json({ message: result.message }, { status: 201, ...noStore });
  } catch {
    logApiFailure("unexpected_error", requestId(request), { stage: "chat_post" });
    return errors.internal();
  }
}
