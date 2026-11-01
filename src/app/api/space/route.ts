import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { hasSameOrigin } from "@/lib/auth/development-member";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { readJsonObject } from "@/lib/api/request";
import { getPrismaClient } from "@/lib/db/prisma";
import { errors } from "@/lib/errors";
import {
  applySpaceMutation,
  loadSpace,
  parseSpaceMutation,
  SPACE_BODY_MAX_BYTES,
} from "@/lib/space/service";
import { requirePersistedAccount } from "@/lib/tasks/service";

const noStore = { headers: { "Cache-Control": "no-store" } };
const requestId = (request: Request) => request.headers.get("x-request-id") ?? undefined;

// Personal Space is private to its owner. The owner id comes only from the persisted session
// account; no query string, path or body field can select another member's data, and admins
// get no extra access here (D-039).

export async function GET(request: Request) {
  const guard = authorize(request, {
    requiredPermission: "view:space",
    allowedStatuses: ["APPROVED"],
  });
  if (!guard.authorized) return guard.errorResponse;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    return NextResponse.json(await loadSpace(prisma, account.account.id), noStore);
  } catch {
    logApiFailure("unexpected_error", requestId(request), { stage: "space_read" });
    return errors.internal();
  }
}

export async function PATCH(request: Request) {
  if (!hasSameOrigin(request)) return errors.forbidden();
  const guard = authorize(request, {
    requiredPermission: "edit:own_space",
    allowedStatuses: ["APPROVED"],
  });
  if (!guard.authorized) return guard.errorResponse;

  const body = await readJsonObject(request, {
    maxBytes: SPACE_BODY_MAX_BYTES,
    message: "Provide a valid Personal Space change.",
  });
  if (!body.ok) return body.response;
  const mutation = parseSpaceMutation(body.value);
  if (!mutation.ok) return mutation.response;

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    const result = await applySpaceMutation(prisma, account.account.id, mutation.value);
    if (!result.ok) return result.response;
    return NextResponse.json(await loadSpace(prisma, account.account.id), noStore);
  } catch {
    logApiFailure("unexpected_error", requestId(request), { stage: "space_write" });
    return errors.internal();
  }
}
