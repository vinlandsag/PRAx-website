import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { requirePersistedAdmin } from "@/lib/auth/admin";
import { getPrismaClient } from "@/lib/db/prisma";
import { apiError, errors } from "@/lib/errors";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const guard = authorize(request, { requiredRole: "ADMIN" });
  if (!guard.authorized) return guard.errorResponse;
  const { id } = await params;
  if (!id || id.length > 128) return errors.notFound("User");
  if (guard.user.id === id) return errors.forbidden();
  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  const admin = await requirePersistedAdmin(request, prisma);
  if (!admin.ok) return admin.response;

  try {
    const result = await prisma.user.updateMany({
      where: { id, role: "MEMBER", status: "PENDING_APPROVAL" },
      data: { status: "APPROVED" },
    });
    if (result.count !== 1) {
      const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
      if (!target) return errors.notFound("User");
      return apiError("INVALID_STATE_TRANSITION", "This member cannot be approved from its current state.", 409);
    }
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });
    if (!user) return errors.notFound("User");
    return NextResponse.json(
      { user: { ...user, createdAt: user.createdAt.toISOString() } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
