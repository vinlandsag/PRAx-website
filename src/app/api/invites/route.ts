import { NextResponse } from "next/server";
import { requirePersistedAdmin } from "@/lib/auth/admin";
import { generateInviteCode } from "@/lib/auth/invite";
import { currentInviteStatus, hashInviteCode } from "@/lib/auth/persistence";
import { parsePagination, paginationMeta } from "@/lib/api/pagination";
import { readJsonObject } from "@/lib/api/request";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { authorize } from "@/lib/auth/guard";

export async function GET(request: Request) {
  const guard = authorize(request, { requiredRole: "ADMIN" });
  if (!guard.authorized) return guard.errorResponse;
  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  const admin = await requirePersistedAdmin(request, prisma);
  if (!admin.ok) return admin.response;
  const params = new URL(request.url).searchParams;
  const page = parsePagination(params);
  if (!page.ok) return page.response;
  if ([...params.keys()].some((key) => !["limit", "offset"].includes(key)))
    return apiError("VALIDATION_ERROR", "Invitation query is invalid.", 400);

  try {
    const [rows, total] = await Promise.all([
      prisma.inviteCode.findMany({
        orderBy: { createdAt: "desc" },
        skip: page.value.offset,
        take: page.value.limit,
        select: {
          id: true,
          maxUses: true,
          usedCount: true,
          status: true,
          expiresAt: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.inviteCode.count(),
    ]);
    const now = new Date();
    return NextResponse.json(
      {
        invites: rows.map((invite) => ({
          ...invite,
          code: null,
          status: currentInviteStatus(invite, now),
          expiresAt: invite.expiresAt?.toISOString() ?? null,
          createdAt: invite.createdAt.toISOString(),
          updatedAt: invite.updatedAt.toISOString(),
        })),
        pagination: paginationMeta(page.value, total),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}

export async function POST(request: Request) {
  const guard = authorize(request, { requiredRole: "ADMIN" });
  if (!guard.authorized) return guard.errorResponse;
  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  const admin = await requirePersistedAdmin(request, prisma);
  if (!admin.ok) return admin.response;
  const parsed = await readJsonObject(request, {
    message: "Provide valid invitation settings.",
  });
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  if (
    Object.keys(body).some((key) => !["maxUses", "expiresAt"].includes(key)) ||
    (body.maxUses !== undefined &&
      (!Number.isSafeInteger(body.maxUses) || Number(body.maxUses) < 1 || Number(body.maxUses) > 100))
  ) {
    return apiError("VALIDATION_ERROR", "Invitation settings are invalid.", 400);
  }
  let expiresAt: Date | null = null;
  if (body.expiresAt !== undefined) {
    if (typeof body.expiresAt !== "string" || !body.expiresAt.trim())
      return apiError("VALIDATION_ERROR", "Invitation expiry is invalid.", 400);
    expiresAt = new Date(body.expiresAt);
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date())
      return apiError("VALIDATION_ERROR", "Invitation expiry must be in the future.", 400);
  }

  try {
    const code = generateInviteCode();
    const invite = await prisma.inviteCode.create({
      data: {
        codeHash: hashInviteCode(code),
        maxUses: body.maxUses === undefined ? 1 : Number(body.maxUses),
        expiresAt,
        createdById: admin.admin.id,
      },
      select: {
        id: true,
        maxUses: true,
        usedCount: true,
        status: true,
        expiresAt: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(
      {
        invite: {
          ...invite,
          code,
          expiresAt: invite.expiresAt?.toISOString() ?? null,
          createdAt: invite.createdAt.toISOString(),
          updatedAt: invite.updatedAt.toISOString(),
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
