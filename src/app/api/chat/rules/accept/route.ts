import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { hasSameOrigin } from "@/lib/auth/development-member";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { readJsonObject } from "@/lib/api/request";
import { acceptRules, CHAT_BODY_MAX_BYTES } from "@/lib/chat/service";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import { requirePersistedAccount } from "@/lib/tasks/service";

/** Records that the signed-in member accepted the community rules. Takes no input. */
export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return errors.forbidden();
  const guard = authorize(request, {
    requiredPermission: "chat:read_write",
    allowedStatuses: ["APPROVED"],
  });
  if (!guard.authorized) return guard.errorResponse;

  const body = await readJsonObject(request, {
    maxBytes: CHAT_BODY_MAX_BYTES,
    message: "Provide a valid request.",
  });
  if (!body.ok) return body.response;
  if (Object.keys(body.value).length > 0)
    return apiError("VALIDATION_ERROR", "This request takes no fields.", 400);

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    await acceptRules(prisma, account.account.id);
    return NextResponse.json({ rulesAccepted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined, {
      stage: "chat_rules",
    });
    return errors.internal();
  }
}
