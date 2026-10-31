import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { localDevelopmentMember, matchesDevelopmentMember } from "@/lib/auth/development-member";
import { backendUnavailable } from "@/lib/api/backend";

export async function GET(request: Request) {
  const guard = authorize(request, { allowedStatuses: ["APPROVED", "PENDING_APPROVAL"] });
  if (!guard.authorized) return guard.errorResponse;
  const member = localDevelopmentMember(request);
  if (member && matchesDevelopmentMember(guard.user, member))
    return NextResponse.json({ user: member }, { headers: { "Cache-Control": "no-store" } });
  return backendUnavailable();
}
