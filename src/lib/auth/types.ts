/**
 * src/lib/auth/types.ts
 *
 * Types for Phase 3 Authentication, Sessions, and Invite Code lifecycle.
 * Conforms to MVP_SPEC.md §2, §3, §5, §8 and API_CONTRACTS.md.
 */

export type UserStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED" | "DISABLED";

export type UserRole = "MEMBER" | "ADMIN";

export type { AppPermission } from "./rbac";

export type InviteCodeStatus = "ACTIVE" | "USED" | "EXPIRED" | "REVOKED";

export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  name: string;
}

export interface SessionPayload {
  user: SessionUser;
  expiresAt: number; // Unix timestamp (ms)
  issuedAt: number; // Unix timestamp (ms)
}

export interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  status: InviteCodeStatus;
  expiresAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface MagicLinkToken {
  id: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}
