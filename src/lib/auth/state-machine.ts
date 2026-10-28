/**
 * src/lib/auth/state-machine.ts
 *
 * Server-side user lifecycle state machine conforming to MVP_SPEC.md §3 and §6.
 * Enforces valid state transitions, self-action prevention, reason requirements,
 * and immutable audit logging.
 */

import { authStore } from "@/lib/db/auth-store";
import { createAuditEvent, type AuditEventType, type AuditLog } from "@/lib/audit/audit";
import type { User, UserStatus, SessionUser } from "./types";
import type { ApiErrorCode } from "@/lib/errors";

export const ALLOWED_TRANSITIONS: Record<UserStatus, readonly UserStatus[]> = {
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "DISABLED"],
  APPROVED: ["SUSPENDED", "DISABLED"],
  REJECTED: ["DISABLED"],
  SUSPENDED: ["APPROVED", "DISABLED"],
  DISABLED: [], // Terminal state
} as const;

export interface TransitionRequest {
  targetUserId: string;
  targetStatus: UserStatus;
  actor: SessionUser;
  reason?: string;
}

export interface TransitionResult {
  success: boolean;
  user?: User;
  errorCode?: ApiErrorCode;
  errorMessage?: string;
  auditLog?: AuditLog;
}

function getAuditEventForTransition(priorState: UserStatus, newState: UserStatus): AuditEventType {
  if (newState === "APPROVED") {
    return priorState === "SUSPENDED" ? "USER_UNSUSPENDED" : "USER_APPROVED";
  }
  if (newState === "REJECTED") return "USER_REJECTED";
  if (newState === "SUSPENDED") return "USER_SUSPENDED";
  if (newState === "DISABLED") return "USER_DISABLED";
  throw new Error(`Unexpected transition: ${priorState} -> ${newState}`);
}

export async function transitionUserStatus(req: TransitionRequest): Promise<TransitionResult> {
  const { targetUserId, targetStatus, actor, reason } = req;

  // 1. Server-side role authorization check
  if (!actor || actor.role !== "ADMIN" || actor.status !== "APPROVED") {
    return {
      success: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Only approved administrators can modify user lifecycle states.",
    };
  }

  // 2. Prevent self-approval, self-rejection, or self-role/status alteration
  if (actor.id === targetUserId) {
    return {
      success: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Administrators cannot alter their own approval state or permissions.",
    };
  }

  // 3. Verify target user exists
  const targetUser = await authStore.findUserById(targetUserId);
  if (!targetUser) {
    return {
      success: false,
      errorCode: "NOT_FOUND",
      errorMessage: "User not found.",
    };
  }

  const priorState = targetUser.status;

  // 4. Repeated transition check (e.g. approving an already approved user)
  if (priorState === targetStatus) {
    return {
      success: false,
      errorCode: "INVALID_STATE_TRANSITION",
      errorMessage: `User is already in status '${targetStatus}'.`,
    };
  }

  // 5. Valid transition check per state machine diagram (MVP_SPEC §3)
  const allowed = ALLOWED_TRANSITIONS[priorState] || [];
  if (!allowed.includes(targetStatus)) {
    return {
      success: false,
      errorCode: "INVALID_STATE_TRANSITION",
      errorMessage: `Illegal transition from '${priorState}' to '${targetStatus}'.`,
    };
  }

  // 6. Reason requirement validation for negative/destructive transitions
  const requiresReason =
    targetStatus === "REJECTED" || targetStatus === "SUSPENDED" || targetStatus === "DISABLED";

  if (requiresReason) {
    if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
      return {
        success: false,
        errorCode: "VALIDATION_ERROR",
        errorMessage: `A specific reason (minimum 3 characters) is required to set status to '${targetStatus}'.`,
      };
    }
  }

  // 7. Apply the state transition in data store
  const updatedUser = await authStore.updateUser(targetUserId, {
    status: targetStatus,
  });

  if (!updatedUser) {
    return {
      success: false,
      errorCode: "INTERNAL_ERROR",
      errorMessage: "Failed to persist user status update.",
    };
  }

  // 8. Record audit event (actor, target, prior state, new state, timestamp, reason)
  const event = getAuditEventForTransition(priorState, targetStatus);
  const auditLog = createAuditEvent(event, actor.id, {
    targetId: targetUser.id,
    priorState,
    newState: targetStatus,
    reason: reason?.trim(),
    metadata: {
      targetEmail: targetUser.email,
      actorEmail: actor.email,
    },
  });

  return {
    success: true,
    user: updatedUser,
    auditLog,
  };
}
