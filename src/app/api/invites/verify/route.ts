import { NextResponse } from "next/server";
import { readJsonObject } from "@/lib/api/request";
import { getClientIp, rateLimit, RATE_LIMIT_POLICIES } from "@/lib/auth/rate-limit";
import { hashInviteCode } from "@/lib/auth/persistence";
import { getPrismaClient } from "@/lib/db/prisma";
import { backendUnavailable } from "@/lib/api/backend";
import { apiError, errors } from "@/lib/errors";
import { logApiFailure } from "@/lib/api/logger";

const invitePattern = /^PRAX-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

export async function POST(request: Request) {
  const policy = RATE_LIMIT_POLICIES.inviteVerify;
  if (!rateLimit(`invite-verify:${getClientIp(request)}`, policy.limit, policy.windowMs).success)
    return errors.rateLimited();

  const parsed = await readJsonObject(request, {
    maxBytes: 1024,
    message: "Provide an invitation code.",
  });
  if (!parsed.ok) return parsed.response;
  if (
    Object.keys(parsed.value).length !== 1 ||
    typeof parsed.value.code !== "string" ||
    !invitePattern.test(parsed.value.code.trim().toUpperCase())
  ) {
    return apiError("VALIDATION_ERROR", "Invitation code is invalid.", 400);
  }

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  try {
    const invite = await prisma.inviteCode.findUnique({
      where: { codeHash: hashInviteCode(parsed.value.code) },
      select: { status: true, maxUses: true, usedCount: true, expiresAt: true },
    });
    if (!invite) return apiError("INVALID_INVITE", "This invitation is not valid.", 400);
    if (
      invite.status === "REVOKED" ||
      invite.status === "EXPIRED" ||
      (invite.expiresAt && invite.expiresAt <= new Date())
    )
      return apiError("INVALID_INVITE", "This invitation is not valid.", 400);
    if (invite.status !== "ACTIVE" || invite.usedCount >= invite.maxUses)
      return apiError("INVITE_EXHAUSTED", "This invitation has no uses remaining.", 400);
    return NextResponse.json(
      { valid: true, remainingUses: invite.maxUses - invite.usedCount },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
