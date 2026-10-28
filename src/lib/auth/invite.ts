/**
 * src/lib/auth/invite.ts
 *
 * Secure invite code generation, normalization, and validation rules.
 * Conforms to MVP_SPEC.md §5 and assumptions A-004, A-005.
 */

import { randomBytes } from "node:crypto";
import type { InviteCode, InviteCodeStatus } from "./types";
import type { ApiErrorCode } from "@/lib/errors";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Base32 without ambiguous 0/O, 1/I

/**
 * Generates an 8-to-12 character alphanumeric invite code with high entropy.
 * Format: PRAX-XXXX-XXXX
 */
export function generateInviteCode(): string {
  const bytes = randomBytes(8);
  let part1 = "";
  let part2 = "";

  for (let i = 0; i < 4; i++) {
    part1 += CHARS[bytes[i] % CHARS.length];
    part2 += CHARS[bytes[i + 4] % CHARS.length];
  }

  return `PRAX-${part1}-${part2}`;
}

export function normalizeInviteCode(code: string | null | undefined): string {
  if (!code) return "";
  return code.trim().toUpperCase();
}

/**
 * Dynamically computes the current status of an invite code based on usage and expiration.
 */
export function getInviteStatus(invite: InviteCode): InviteCodeStatus {
  if (invite.status === "REVOKED") {
    return "REVOKED";
  }

  if (invite.expiresAt && new Date(invite.expiresAt).getTime() <= Date.now()) {
    return "EXPIRED";
  }

  if (invite.usedCount >= invite.maxUses) {
    return "USED";
  }

  return "ACTIVE";
}

export interface InviteValidationResult {
  valid: boolean;
  errorCode?: ApiErrorCode;
  remainingUses: number;
}

export function validateInviteCode(invite: InviteCode | null | undefined): InviteValidationResult {
  if (!invite) {
    return { valid: false, errorCode: "INVALID_INVITE", remainingUses: 0 };
  }

  const currentStatus = getInviteStatus(invite);

  if (currentStatus === "REVOKED" || currentStatus === "EXPIRED") {
    return { valid: false, errorCode: "INVALID_INVITE", remainingUses: 0 };
  }

  if (currentStatus === "USED" || invite.usedCount >= invite.maxUses) {
    return { valid: false, errorCode: "INVITE_EXHAUSTED", remainingUses: 0 };
  }

  const remaining = Math.max(0, invite.maxUses - invite.usedCount);

  return {
    valid: true,
    remainingUses: remaining,
  };
}
