/**
 * src/app/api/users/me/route.ts
 *
 * Current session user endpoint.
 * Conforms to API_CONTRACTS.md.
 */

import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { authStore } from "@/lib/db/auth-store";
import { errors } from "@/lib/errors";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return errors.unauthenticated();
  }

  const user = await authStore.findUserById(session.user.id);
  if (!user) {
    return errors.unauthenticated();
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
}
