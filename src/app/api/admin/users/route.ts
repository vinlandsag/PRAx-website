import { NextResponse } from "next/server";
import { apiError, errors } from "@/lib/errors";
import { authorize } from "@/lib/auth/guard";
import { requirePersistedAdmin } from "@/lib/auth/admin";
import { parsePagination, paginationMeta } from "@/lib/api/pagination";
import { getPrismaClient } from "@/lib/db/prisma";
import { backendUnavailable } from "@/lib/api/backend";
import { logApiFailure } from "@/lib/api/logger";
import type { UserStatus } from "@/lib/auth/types";

const statuses = new Set<UserStatus>([
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
  "DISABLED",
]);

export async function GET(request: Request) {
  const guard = authorize(request, { requiredRole: "ADMIN" });
  if (!guard.authorized) return guard.errorResponse;
  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  const admin = await requirePersistedAdmin(request, prisma);
  if (!admin.ok) return admin.response;

  const params = new URL(request.url).searchParams;
  if ([...params.keys()].some((key) => !["status", "limit", "offset"].includes(key)))
    return apiError("VALIDATION_ERROR", "User query is invalid.", 400);
  const statusValues = params.getAll("status");
  if (statusValues.length > 1) return apiError("VALIDATION_ERROR", "User status is invalid.", 400);
  const status = statusValues[0] ?? "PENDING_APPROVAL";
  if (!statuses.has(status as UserStatus))
    return apiError("VALIDATION_ERROR", "User status is invalid.", 400);
  const page = parsePagination(params);
  if (!page.ok) return page.response;

  try {
    const where = { status: status as UserStatus };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        skip: page.value.offset,
        take: page.value.limit,
        select: { id: true, name: true, email: true, status: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    return NextResponse.json(
      {
        users: users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() })),
        pagination: paginationMeta(page.value, total),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
