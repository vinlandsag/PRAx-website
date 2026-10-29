import { workspaceActor, sameOriginWrite } from "@/lib/workspace/access";
import { demoMember } from "@/lib/workspace/members";
import { authStore } from "@/lib/db/auth-store";
import { apiError, errors } from "@/lib/errors";
import { workspaceStore, WorkspaceError } from "@/lib/workspace/store";
import type { WorkspaceMutation } from "@/lib/workspace/types";

export async function GET(request: Request) {
  const user = await workspaceActor(request);
  if (user instanceof Response) return user;
  const memberId = new URL(request.url).searchParams.get("memberId");
  try {
    if (memberId) {
      const target = await authStore.findUserById(memberId);
      if (target) {
        if (target.status !== "APPROVED") return apiError("NOT_FOUND", "Profile not found.", 404);
        return Response.json(
          { profile: workspaceStore.publicProfile(target), isDemo: false },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
      const demo = demoMember(memberId);
      if (demo)
        return Response.json(
          { profile: demo.profile, isDemo: true },
          { headers: { "Cache-Control": "no-store" } }
        );
      return apiError("NOT_FOUND", "Profile not found.", 404);
    }
    return Response.json(workspaceStore.get(user), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof WorkspaceError)
      return apiError(
        error.status === 404 ? "NOT_FOUND" : "VALIDATION_ERROR",
        error.message,
        error.status
      );
    return errors.internal();
  }
}
export async function PATCH(request: Request) {
  const user = await workspaceActor(request);
  if (user instanceof Response) return user;
  if (!sameOriginWrite(request)) return errors.forbidden();
  try {
    const raw = await request.text();
    if (raw.length > 32_000) return apiError("VALIDATION_ERROR", "Request is too large.", 400);
    let mutation: WorkspaceMutation;
    try {
      mutation = JSON.parse(raw);
    } catch {
      return apiError("VALIDATION_ERROR", "Send a valid JSON request.", 400);
    }
    if (!mutation || typeof mutation !== "object" || Array.isArray(mutation))
      return apiError("VALIDATION_ERROR", "Invalid update.", 400);
    return Response.json(workspaceStore.mutate(user, mutation), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof WorkspaceError)
      return apiError(
        error.status === 403
          ? "FORBIDDEN"
          : error.status === 404
            ? "NOT_FOUND"
            : "VALIDATION_ERROR",
        error.message,
        error.status
      );
    return errors.internal();
  }
}
