const events = ["request_failed", "unexpected_error"] as const;
export type ApiLogEvent = (typeof events)[number];

/** Log only a fixed event and a validated opaque request id; never pass payloads or exceptions. */
export function logApiFailure(event: ApiLogEvent, requestId?: string): void {
  const safeRequestId =
    requestId && /^[A-Za-z0-9_-]{1,64}$/.test(requestId) ? requestId : undefined;
  const record = {
    level: "error",
    event: events.includes(event) ? event : "unexpected_error",
    ...(safeRequestId ? { requestId: safeRequestId } : {}),
  };
  console.error(JSON.stringify(record));
}
