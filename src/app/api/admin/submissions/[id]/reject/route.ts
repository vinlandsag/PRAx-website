import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { readJsonObject } from "@/lib/api/request";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import { decideSubmission } from "@/lib/reviews/service";
import { requirePersistedAccount } from "@/lib/tasks/service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const guard = authorize(request, { requiredRole: "ADMIN" });
  if (!guard.authorized) return guard.errorResponse;
  const { id } = await params;
  if (!id || id.length > 128) return errors.notFound("Submission");

  const body = await readJsonObject(request, { message: "Provide review feedback." });
  if (!body.ok) return body.response;
  if (Object.keys(body.value).some((key) => key !== "feedback")) {
    return apiError("VALIDATION_ERROR", "Review fields are invalid.", 400);
  }
  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  try {
    const account = await requirePersistedAccount(prisma, guard.user);
    if (!account.ok) return account.response;
    if (account.account.role !== "ADMIN") return errors.forbidden();
    const result = await decideSubmission(prisma, id, guard.user, "REJECTED", body.value.feedback);
    if (!result.ok) return result.response;
    return NextResponse.json({ submission: result.submission }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
