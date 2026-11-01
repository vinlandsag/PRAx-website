const events = ["request_failed", "unexpected_error"] as const;
export type ApiLogEvent = (typeof events)[number];

type SafeFailureDetails = { stage?: string; code?: string };

/** Log only a fixed event and a validated opaque request id; never pass payloads or exceptions. */
export function logApiFailure(
  event: ApiLogEvent,
  requestId?: string,
  details?: SafeFailureDetails
): void {
  const safeRequestId =
    requestId && /^[A-Za-z0-9_-]{1,64}$/.test(requestId) ? requestId : undefined;
  const safeStage = details?.stage && /^[a-z_]{1,32}$/.test(details.stage) ? details.stage : undefined;
  const safeCode = details?.code && /^[A-Z0-9_-]{3,12}$/.test(details.code) ? details.code : undefined;
  const record = {
    level: "error",
    event: events.includes(event) ? event : "unexpected_error",
    ...(safeRequestId ? { requestId: safeRequestId } : {}),
    ...(safeStage ? { stage: safeStage } : {}),
    ...(safeCode ? { code: safeCode } : {}),
  };
  console.error(JSON.stringify(record));
}
