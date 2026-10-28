/**
 * src/app/api/admin/users/route.ts
 *
 * Admin endpoint to list platform users with optional status filtering.
 * Conforms to API_CONTRACTS.md.
 */

import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { authStore } from "@/lib/db/auth-store";
import type { UserStatus } from "@/lib/auth/types";

export async function GET(request: Request) {
  const guard = authorize(request, { allowedRoles: ["ADMIN"] });
  if (!guard.authorized) {
    return guard.errorResponse;
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") as UserStatus | null;

  const users = await authStore.listUsers(statusParam ? { status: statusParam } : undefined);

  // Strip passwordHash before returning
  const sanitizedUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));

  return NextResponse.json({ users: sanitizedUsers });
}
