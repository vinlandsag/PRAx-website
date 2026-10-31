import { authorize, type GuardOptions } from "@/lib/auth/guard";
import { apiError } from "@/lib/errors";

/** Integration boundary: no fixtures, storage, tokens, or simulated writes. */
export function backendUnavailable() {
  const response = apiError(
    "BACKEND_NOT_CONFIGURED",
    "This service is not connected yet. Please try again later.",
    503
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function pendingEndpoint(options?: GuardOptions) {
  return async function handler(request: Request) {
    if (options) {
      const guard = authorize(request, options);
      if (!guard.authorized) return guard.errorResponse;
    }
    return backendUnavailable();
  };
}
