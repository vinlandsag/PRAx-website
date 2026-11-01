import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/auth/development-member";
import { hashPassword } from "@/lib/auth/password";
import { hashInviteCode, normalizeEmail, prismaErrorCode } from "@/lib/auth/persistence";
import { getClientIp, rateLimit, RATE_LIMIT_POLICIES } from "@/lib/auth/rate-limit";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import { logApiFailure } from "@/lib/api/logger";
import { backendUnavailable } from "@/lib/api/backend";
import { readJsonObject } from "@/lib/api/request";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const invitePattern = /^PRAX-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return errors.forbidden();
  const rate = RATE_LIMIT_POLICIES.register;
  if (!rateLimit(`register:${getClientIp(request)}`, rate.limit, rate.windowMs).success)
    return errors.rateLimited();

  const parsed = await readJsonObject(request, {
    maxBytes: 4096,
    message: "Provide name, email, password, and invite code.",
  });
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  if (
    Object.keys(body).some((key) => !["name", "email", "password", "inviteCode"].includes(key)) ||
    typeof body.name !== "string" ||
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    typeof body.inviteCode !== "string"
  ) {
    return apiError("VALIDATION_ERROR", "Registration details are invalid.", 400);
  }
  const name = body.name.trim();
  const email = normalizeEmail(body.email);
  const code = body.inviteCode.trim().toUpperCase();
  if (
    !name ||
    name.length > 120 ||
    email.length > 254 ||
    !emailPattern.test(email) ||
    body.password.length < 8 ||
    Buffer.byteLength(body.password, "utf8") > 256 ||
    !invitePattern.test(code)
  ) {
    return apiError("VALIDATION_ERROR", "Registration details are invalid.", 400);
  }

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();

  try {
    const passwordHash = await hashPassword(body.password);
    const inviteHash = hashInviteCode(code);
    const user = await prisma.$transaction(async (tx) => {
      const invite = await tx.inviteCode.findUnique({
        where: { codeHash: inviteHash },
        select: { id: true, status: true, maxUses: true, usedCount: true, expiresAt: true },
      });
      const now = new Date();
      if (
        !invite ||
        invite.status === "REVOKED" ||
        invite.status === "EXPIRED" ||
        (invite.expiresAt && invite.expiresAt <= now)
      ) {
        throw Object.assign(new Error("INVALID_INVITE"), { authCode: "INVALID_INVITE" });
      }
      if (invite.status !== "ACTIVE" || invite.usedCount >= invite.maxUses) {
        throw Object.assign(new Error("INVITE_EXHAUSTED"), { authCode: "INVITE_EXHAUSTED" });
      }

      const claimed = await tx.inviteCode.updateMany({
        where: {
          id: invite.id,
          status: "ACTIVE",
          usedCount: { lt: invite.maxUses },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: { usedCount: { increment: 1 } },
      });
      if (claimed.count !== 1) {
        const current = await tx.inviteCode.findUnique({
          where: { id: invite.id },
          select: { status: true, maxUses: true, usedCount: true, expiresAt: true },
        });
        if (
          current &&
          current.status !== "REVOKED" &&
          (!current.expiresAt || current.expiresAt > now) &&
          (current.status === "USED" || current.usedCount >= current.maxUses)
        ) {
          throw Object.assign(new Error("INVITE_EXHAUSTED"), { authCode: "INVITE_EXHAUSTED" });
        }
        throw Object.assign(new Error("INVALID_INVITE"), { authCode: "INVALID_INVITE" });
      }

      await tx.inviteCode.updateMany({
        where: { id: invite.id, status: "ACTIVE", usedCount: { gte: invite.maxUses } },
        data: { status: "USED" },
      });

      return tx.user.create({
        data: { email, name, passwordHash, role: "MEMBER", status: "PENDING_APPROVAL" },
        select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
      });
    });

    return NextResponse.json(
      { user: { ...user, createdAt: user.createdAt.toISOString() } },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const authCode =
      error && typeof error === "object" && "authCode" in error
        ? (error as { authCode?: unknown }).authCode
        : undefined;
    if (authCode === "INVALID_INVITE")
      return apiError("INVALID_INVITE", "This invitation is not valid.", 400);
    if (authCode === "INVITE_EXHAUSTED")
      return apiError("INVITE_EXHAUSTED", "This invitation has no uses remaining.", 400);
    if (prismaErrorCode(error) === "P2002")
      return apiError("EMAIL_ALREADY_REGISTERED", "An account with this email already exists.", 409);
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
