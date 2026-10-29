import { authorize } from "@/lib/auth/guard";
import { authStore } from "@/lib/db/auth-store";
import { apiError, errors } from "@/lib/errors";
export async function workspaceActor(request: Request) {
  const guard = authorize(request);
  if (!guard.authorized) return guard.errorResponse;
  const user = await authStore.findUserById(guard.user.id);
  if (!user) return errors.unauthenticated();
  if (user.status !== "APPROVED") return errors.forbidden();
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
}

export function sameOriginWrite(request: Request) {
  const origin = request.headers.get("origin"),
    url = new URL(request.url);
  return !origin || origin === `${url.protocol}//${request.headers.get("host") || url.host}`;
}
export function workspaceErrorResponse(error: unknown) {
  if (error instanceof Error && "status" in error && typeof error.status === "number")
    return apiError(
      error.status === 403 ? "FORBIDDEN" : error.status === 404 ? "NOT_FOUND" : "VALIDATION_ERROR",
      error.message,
      error.status
    );
  return errors.internal();
}
