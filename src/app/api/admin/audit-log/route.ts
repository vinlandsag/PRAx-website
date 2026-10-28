/**
 * src/app/api/admin/audit-log/route.ts
 *
 * Admin audit log review endpoint.
 * Conforms to API_CONTRACTS.md.
 */

import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { listAuditEvents } from "@/lib/audit/audit";

export async function GET(request: Request) {
  const guard = authorize(request, { allowedRoles: ["ADMIN"] });
  if (!guard.authorized) {
    return guard.errorResponse;
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || undefined;
  const event = url.searchParams.get("event") || undefined;
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);

  const result = listAuditEvents({
    userId,
    event,
    from,
    to,
    page: isNaN(page) || page < 1 ? 1 : page,
    limit: isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 100),
  });

  return NextResponse.json(result);
}
