/**
 * src/lib/audit/audit.ts
 *
 * Immutable audit trail engine conforming to MVP_SPEC.md §6 and API_CONTRACTS.md.
 * Records actor, target, prior state, new state, timestamp, and reasons.
 * Enforces strict scrubbing so passwords, tokens, and secrets are NEVER recorded.
 */

import { randomUUID } from "node:crypto";
import type { UserStatus } from "@/lib/auth/types";

export type AuditEventType =
  | "USER_REGISTERED"
  | "USER_APPROVED"
  | "USER_REJECTED"
  | "USER_SUSPENDED"
  | "USER_UNSUSPENDED"
  | "USER_DISABLED"
  | "INVITE_CREATED"
  | "INVITE_USED"
  | "INVITE_REVOKED"
  | "USER_LOGIN"
  | "USER_LOGOUT";

export interface AuditLog {
  id: string;
  event: AuditEventType | string;
  actorId: string;
  targetId?: string;
  priorState?: UserStatus | string;
  newState?: UserStatus | string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const auditLogStore: AuditLog[] = [];

// Blacklist of sensitive keys that must NEVER be written to the audit trail
const SENSITIVE_KEY_REGEX = /(password|token|secret|hash|salt|credential|authorization|cookie)/i;

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      continue; // Strip sensitive key entirely
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export interface CreateAuditOptions {
  targetId?: string;
  priorState?: UserStatus | string;
  newState?: UserStatus | string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export function createAuditEvent(
  event: AuditEventType | string,
  actorId: string,
  options: CreateAuditOptions = {}
): AuditLog {
  const entry: AuditLog = {
    id: `aud_${randomUUID().slice(0, 10)}`,
    event,
    actorId,
    targetId: options.targetId,
    priorState: options.priorState,
    newState: options.newState,
    reason: options.reason?.trim() || undefined,
    metadata: sanitizeMetadata(options.metadata),
    createdAt: new Date().toISOString(),
  };

  auditLogStore.unshift(entry); // Prepend so most recent is first
  return entry;
}

export interface AuditQueryOptions {
  userId?: string;
  event?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function listAuditEvents(options: AuditQueryOptions = {}): {
  events: AuditLog[];
  total: number;
  page: number;
  limit: number;
} {
  const { userId, event, from, to, page = 1, limit = 50 } = options;

  let filtered = auditLogStore;

  if (userId) {
    filtered = filtered.filter((e) => e.actorId === userId || e.targetId === userId);
  }

  if (event) {
    filtered = filtered.filter((e) => e.event === event);
  }

  if (from) {
    const fromTime = new Date(from).getTime();
    if (!isNaN(fromTime)) {
      filtered = filtered.filter((e) => new Date(e.createdAt).getTime() >= fromTime);
    }
  }

  if (to) {
    const toTime = new Date(to).getTime();
    if (!isNaN(toTime)) {
      filtered = filtered.filter((e) => new Date(e.createdAt).getTime() <= toTime);
    }
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return {
    events: paginated,
    total,
    page,
    limit,
  };
}

export function resetAuditLog(): void {
  auditLogStore.length = 0;
}
