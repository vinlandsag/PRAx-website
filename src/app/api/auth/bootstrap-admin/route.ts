import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/auth/development-member";
import { hashPassword } from "@/lib/auth/password";
import { normalizeEmail, prismaErrorCode } from "@/lib/auth/persistence";
import { getClientIp, rateLimit } from "@/lib/auth/rate-limit";
import { getPrismaClient } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { apiError, errors } from "@/lib/errors";
import { logApiFailure } from "@/lib/api/logger";
import { readJsonObject } from "@/lib/api/request";
import { backendUnavailable } from "@/lib/api/backend";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function tokenMatches(provided: string, expected: string) {
  const providedHash = createHash("sha256").update(provided).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

export async function POST(request: Request) {
  const expectedToken = env.firstAdminBootstrapToken;
  if (expectedToken.length < 32) return errors.notFound("Endpoint");
  if (!hasSameOrigin(request)) return errors.forbidden();
  if (!rateLimit(`first-admin:${getClientIp(request)}`, 3, 60 * 60 * 1000).success)
    return errors.rateLimited();

  const suppliedToken = request.headers.get("x-first-admin-token") ?? "";
  if (!suppliedToken || suppliedToken.length > 512 || !tokenMatches(suppliedToken, expectedToken))
    return errors.forbidden();

  const parsed = await readJsonObject(request, {
    maxBytes: 4096,
    message: "Provide valid initial administrator details.",
  });
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  if (
    Object.keys(body).some((key) => !["email", "name", "password"].includes(key)) ||
    typeof body.email !== "string" ||
    typeof body.name !== "string" ||
    typeof body.password !== "string"
  ) {
    return apiError("VALIDATION_ERROR", "Administrator details are invalid.", 400);
  }
  const email = normalizeEmail(body.email);
  const name = body.name.trim();
  if (
    !emailPattern.test(email) ||
    email.length > 254 ||
    !name ||
    name.length > 120 ||
    body.password.length < 12 ||
    Buffer.byteLength(body.password, "utf8") > 256
  ) {
    return apiError("VALIDATION_ERROR", "Administrator details are invalid.", 400);
  }

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  let failureStage = "password_hash";
  try {
    const passwordHash = await hashPassword(body.password);
    failureStage = "database_transaction";
    const user = await prisma.$transaction(async (tx) => {
      // Return a Prisma-decodable scalar while evaluating the transaction-scoped lock.
      await tx.$queryRaw`
        WITH bootstrap_lock AS MATERIALIZED (
          SELECT pg_advisory_xact_lock(hashtextextended('prax:first-admin-bootstrap', 0))
        )
        SELECT 1::int AS locked FROM bootstrap_lock
      `;
      const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
      if (adminCount > 0) {
        throw Object.assign(new Error("FIRST_ADMIN_ALREADY_EXISTS"), {
          authCode: "FIRST_ADMIN_ALREADY_EXISTS",
        });
      }
      const existing = await tx.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true },
      });
      if (existing) {
        throw Object.assign(new Error("EMAIL_ALREADY_REGISTERED"), {
          authCode: "EMAIL_ALREADY_REGISTERED",
        });
      }
      return tx.user.create({
        data: { email, name, passwordHash, role: "ADMIN", status: "APPROVED" },
        select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
      });
    }, { maxWait: 10_000, timeout: 15_000 });
    failureStage = "response_build";
    return NextResponse.json(
      { user: { ...user, createdAt: user.createdAt.toISOString() } },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const authCode =
      error && typeof error === "object" && "authCode" in error
        ? (error as { authCode?: unknown }).authCode
        : undefined;
    if (authCode === "FIRST_ADMIN_ALREADY_EXISTS")
      return apiError("INVALID_STATE_TRANSITION", "Initial administrator setup is already complete.", 409);
    if (authCode === "EMAIL_ALREADY_REGISTERED" || prismaErrorCode(error) === "P2002")
      return apiError("EMAIL_ALREADY_REGISTERED", "An account with this email already exists.", 409);
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined, {
      stage: failureStage,
      code: prismaErrorCode(error),
    });
    return errors.internal();
  }
}
