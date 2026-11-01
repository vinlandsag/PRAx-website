import { NextResponse } from "next/server";
import { requirePersistedAdmin } from "@/lib/auth/admin";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import { authorize } from "@/lib/auth/guard";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Context) {
  const guard = authorize(request, { requiredRole: "ADMIN" });
  if (!guard.authorized) return guard.errorResponse;
  const { id } = await params;
  if (!id || id.length > 128) return errors.notFound("Invitation");
  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  const admin = await requirePersistedAdmin(request, prisma);
  if (!admin.ok) return admin.response;

  try {
    const invite = await prisma.inviteCode.findUnique({
      where: { id },
      select: { id: true, status: true, expiresAt: true, maxUses: true, usedCount: true },
    });
    if (!invite) return errors.notFound("Invitation");
    if (
      invite.status !== "ACTIVE" ||
      invite.usedCount >= invite.maxUses ||
      (invite.expiresAt && invite.expiresAt <= new Date())
    ) {
      return apiError("INVALID_STATE_TRANSITION", "Invitation can no longer be revoked.", 409);
    }
    const revoked = await prisma.inviteCode.updateMany({
      where: {
        id,
        status: "ACTIVE",
        usedCount: { lt: invite.maxUses },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      data: { status: "REVOKED" },
    });
    if (revoked.count !== 1)
      return apiError("INVALID_STATE_TRANSITION", "Invitation can no longer be revoked.", 409);
    const result = await prisma.inviteCode.findUnique({
      where: { id },
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
    if (!result) return errors.notFound("Invitation");
    return NextResponse.json(
      {
        invite: {
          ...result,
          code: null,
          expiresAt: result.expiresAt?.toISOString() ?? null,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
