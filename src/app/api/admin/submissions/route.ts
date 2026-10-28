/**
 * src/app/api/admin/submissions/route.ts
 *
 * GET /api/admin/submissions
 * Lists submissions in review queue with optional status filtering.
 * Protected: ADMIN only.
 * Conforms to API_CONTRACTS.md (Admin Review Queue Endpoints) and MVP_SPEC.md §4.
 */

import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { type SubmissionStatus, submissionsStore } from "@/lib/db/submissions-store";
import { errors } from "@/lib/errors";

export async function GET(request: Request) {
  const guard = authorize(request, { allowedRoles: ["ADMIN"] });
  if (!guard.authorized) {
    return guard.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status") as SubmissionStatus | null;

  try {
    const filter = statusParam ? { status: statusParam } : undefined;
    const submissions = await submissionsStore.listSubmissions(filter);

    return NextResponse.json({ submissions });
  } catch {
    return errors.internal();
  }
}
