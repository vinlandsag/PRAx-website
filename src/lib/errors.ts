/**
 * src/lib/errors.ts
 *
 * Shared API error utilities. All API routes must use apiError() to return
 * errors — never expose raw exception messages or stack traces to the client.
 *
 * Error codes are defined in MVP_SPEC.md §8.
 */

import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_INVITE"
  | "INVITE_EXHAUSTED"
  | "ACCOUNT_NOT_ACTIVE"
  | "ACCOUNT_PENDING"
  | "FORBIDDEN"
  | "SUBMISSION_IN_PROGRESS"
  | "INVALID_STATE_TRANSITION"
  | "NOT_FOUND"
  | "UNAUTHENTICATED"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    status: number;
  };
}

/**
 * Returns a typed JSON error response with the standard envelope.
 * Never include internal details (stack traces, DB errors) in `message`.
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message, status } }, { status });
}

// Convenience helpers for the most common cases
export const errors = {
  unauthenticated: () => apiError("UNAUTHENTICATED", "Authentication required.", 401),
  forbidden: () => apiError("FORBIDDEN", "You do not have permission to perform this action.", 403),
  notFound: (resource = "Resource") => apiError("NOT_FOUND", `${resource} not found.`, 404),
  accountPending: () => apiError("ACCOUNT_PENDING", "Your account is pending approval.", 403),
  accountNotActive: () => apiError("ACCOUNT_NOT_ACTIVE", "Your account is not active.", 403),
  internal: () => apiError("INTERNAL_ERROR", "An unexpected error occurred.", 500),
} as const;
