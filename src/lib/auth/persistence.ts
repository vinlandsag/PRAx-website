import { createHash } from "node:crypto";
import type { InviteCodeStatus, SessionUser } from "./types";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashInviteCode(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export function toSessionUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionUser["role"],
    status: user.status as SessionUser["status"],
  };
}

export function currentInviteStatus(invite: {
  status: InviteCodeStatus;
  usedCount: number;
  maxUses: number;
  expiresAt: Date | null;
}, now = new Date()): InviteCodeStatus {
  if (invite.status !== "ACTIVE") return invite.status;
  if (invite.expiresAt && invite.expiresAt <= now) return "EXPIRED";
  if (invite.usedCount >= invite.maxUses) return "USED";
  return "ACTIVE";
}

export function prismaErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}
