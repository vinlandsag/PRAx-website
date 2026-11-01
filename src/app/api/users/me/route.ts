import { NextResponse } from "next/server";
import { getSessionCookieOptions, getSessionFromRequest, SESSION_DURATION_MS, signSession } from "@/lib/auth/session";
import { localDevelopmentMember, matchesDevelopmentMember } from "@/lib/auth/development-member";
import { toSessionUser } from "@/lib/auth/persistence";
import { getPrismaClient } from "@/lib/db/prisma";
import { backendUnavailable } from "@/lib/api/backend";
import { errors } from "@/lib/errors";
import { logApiFailure } from "@/lib/api/logger";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return errors.unauthenticated();

  const member = localDevelopmentMember(request);
  if (member && matchesDevelopmentMember(session.user, member))
    return NextResponse.json(
      { user: { ...member, createdAt: new Date(session.issuedAt).toISOString() } },
      { headers: { "Cache-Control": "no-store" } }
    );

  const prisma = getPrismaClient();
  if (!prisma) return backendUnavailable();
  try {
    const account = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    });
    if (!account) return errors.unauthenticated();
    if (account.status === "REJECTED" || account.status === "SUSPENDED" || account.status === "DISABLED")
      return errors.accountNotActive();
    const response = NextResponse.json(
      { user: { ...toSessionUser(account), createdAt: account.createdAt.toISOString() } },
      { headers: { "Cache-Control": "no-store" } }
    );
    const cookie = getSessionCookieOptions();
    response.cookies.set(cookie.name, signSession(toSessionUser(account), SESSION_DURATION_MS), cookie);
    return response;
  } catch {
    logApiFailure("unexpected_error", request.headers.get("x-request-id") ?? undefined);
    return errors.internal();
  }
}
