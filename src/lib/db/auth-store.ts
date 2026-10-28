/**
 * src/lib/db/auth-store.ts
 *
 * In-memory persistence store for Phase 3 Authentication & Invite codes.
 * Thread-safe, supports atomic invite consumption, hashed token storage,
 * and test resets.
 *
 * Designed to mirror Prisma schema models without requiring external database drivers.
 */

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "@/lib/auth/password";
import {
  generateInviteCode,
  normalizeInviteCode,
  validateInviteCode,
  getInviteStatus,
} from "@/lib/auth/invite";
import type { User, InviteCode, MagicLinkToken, UserRole, UserStatus } from "@/lib/auth/types";
import type { ApiErrorCode } from "@/lib/errors";

class AuthStore {
  private users = new Map<string, User>();
  private usersByEmail = new Map<string, string>(); // lowercase email -> userId

  private invites = new Map<string, InviteCode>();
  private invitesByCode = new Map<string, string>(); // uppercase code -> inviteId

  private magicTokens = new Map<string, MagicLinkToken>(); // tokenHash -> MagicLinkToken

  private initialized = false;

  constructor() {
    this.initDefaultSeed();
  }

  public async initDefaultSeed(): Promise<void> {
    if (this.initialized) return;

    // Seed Admin: admin@prax.build / AdminPass123!
    const adminPasswordHash = await hashPassword("AdminPass123!");
    const adminId = "usr_admin_01";
    const adminUser: User = {
      id: adminId,
      email: "admin@prax.build",
      passwordHash: adminPasswordHash,
      name: "Admin User",
      role: "ADMIN",
      status: "APPROVED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(adminId, adminUser);
    this.usersByEmail.set(adminUser.email.toLowerCase(), adminId);

    // Seed Member: member@prax.build / MemberPass123!
    const memberPasswordHash = await hashPassword("MemberPass123!");
    const memberId = "usr_member_01";
    const memberUser: User = {
      id: memberId,
      email: "member@prax.build",
      passwordHash: memberPasswordHash,
      name: "Arjun Varma",
      role: "MEMBER",
      status: "APPROVED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(memberId, memberUser);
    this.usersByEmail.set(memberUser.email.toLowerCase(), memberId);

    // Seed Pending User: pending@prax.build
    const pendingPasswordHash = await hashPassword("PendingPass123!");
    const pendingId = "usr_pending_01";
    const pendingUser: User = {
      id: pendingId,
      email: "pending@prax.build",
      passwordHash: pendingPasswordHash,
      name: "Pending Builder",
      role: "MEMBER",
      status: "PENDING_APPROVAL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(pendingId, pendingUser);
    this.usersByEmail.set(pendingUser.email.toLowerCase(), pendingId);

    // Seed Suspended User: suspended@prax.build
    const suspendedPasswordHash = await hashPassword("SuspendedPass123!");
    const suspendedId = "usr_suspended_01";
    const suspendedUser: User = {
      id: suspendedId,
      email: "suspended@prax.build",
      passwordHash: suspendedPasswordHash,
      name: "Suspended Member",
      role: "MEMBER",
      status: "SUSPENDED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(suspendedId, suspendedUser);
    this.usersByEmail.set(suspendedUser.email.toLowerCase(), suspendedId);

    // Seed Invite Codes
    const seedInvites: Omit<InviteCode, "id" | "createdAt" | "updatedAt">[] = [
      {
        code: "PRAX-ALPHA-2026",
        maxUses: 10,
        usedCount: 0,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        createdById: adminId,
      },
      {
        code: "PRAX-SINGLE-USE",
        maxUses: 1,
        usedCount: 0,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdById: adminId,
      },
      {
        code: "PRAX-EXPIRED-CODE",
        maxUses: 5,
        usedCount: 0,
        status: "EXPIRED",
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired yesterday
        createdById: adminId,
      },
      {
        code: "PRAX-REVOKED-CODE",
        maxUses: 5,
        usedCount: 0,
        status: "REVOKED",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdById: adminId,
      },
      {
        code: "PRAX-USED-CODE",
        maxUses: 1,
        usedCount: 1,
        status: "USED",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdById: adminId,
      },
    ];

    for (const inv of seedInvites) {
      const invId = `inv_${randomUUID().slice(0, 8)}`;
      const fullInvite: InviteCode = {
        ...inv,
        id: invId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.invites.set(invId, fullInvite);
      this.invitesByCode.set(inv.code.toUpperCase(), invId);
    }

    this.initialized = true;
  }

  public async resetForTesting(): Promise<void> {
    this.users.clear();
    this.usersByEmail.clear();
    this.invites.clear();
    this.invitesByCode.clear();
    this.magicTokens.clear();
    this.initialized = false;
    await this.initDefaultSeed();
  }

  // --- User Operations ---

  public async findUserByEmail(email: string): Promise<User | null> {
    const id = this.usersByEmail.get(email.trim().toLowerCase());
    if (!id) return null;
    return this.users.get(id) ?? null;
  }

  public async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  public async createUser(data: {
    email: string;
    passwordHash: string | null;
    name: string;
    role?: UserRole;
    status?: UserStatus;
  }): Promise<User> {
    const normalizedEmail = data.email.trim().toLowerCase();
    if (this.usersByEmail.has(normalizedEmail)) {
      throw new Error("A user with this email already exists");
    }

    const id = `usr_${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const newUser: User = {
      id,
      email: normalizedEmail,
      passwordHash: data.passwordHash,
      name: data.name.trim(),
      role: data.role ?? "MEMBER",
      status: data.status ?? "PENDING_APPROVAL",
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, newUser);
    this.usersByEmail.set(normalizedEmail, id);
    return newUser;
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const existing = this.users.get(id);
    if (!existing) return null;

    const updated: User = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.users.set(id, updated);
    return updated;
  }

  public async listUsers(filter?: { status?: UserStatus; role?: UserRole }): Promise<User[]> {
    let list = Array.from(this.users.values());
    if (filter?.status) {
      list = list.filter((u) => u.status === filter.status);
    }
    if (filter?.role) {
      list = list.filter((u) => u.role === filter.role);
    }
    return list;
  }

  // --- Invite Code Operations ---

  public async createInvite(data: {
    code?: string;
    maxUses?: number;
    expiresAt?: string | null;
    createdById: string;
  }): Promise<InviteCode> {
    const code = normalizeInviteCode(data.code || generateInviteCode());
    if (this.invitesByCode.has(code)) {
      throw new Error("Invite code already exists");
    }

    const id = `inv_${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const newInvite: InviteCode = {
      id,
      code,
      maxUses: data.maxUses && data.maxUses > 0 ? data.maxUses : 1,
      usedCount: 0,
      status: "ACTIVE",
      expiresAt: data.expiresAt || null,
      createdById: data.createdById,
      createdAt: now,
      updatedAt: now,
    };

    this.invites.set(id, newInvite);
    this.invitesByCode.set(code, id);
    return newInvite;
  }

  public async findInviteByCode(code: string): Promise<InviteCode | null> {
    const normalized = normalizeInviteCode(code);
    const id = this.invitesByCode.get(normalized);
    if (!id) return null;
    return this.invites.get(id) ?? null;
  }

  public async findInviteById(id: string): Promise<InviteCode | null> {
    return this.invites.get(id) ?? null;
  }

  public async listInvites(): Promise<InviteCode[]> {
    return Array.from(this.invites.values()).map((inv) => ({
      ...inv,
      status: getInviteStatus(inv),
    }));
  }

  public async consumeInvite(code: string): Promise<{
    success: boolean;
    invite?: InviteCode;
    errorCode?: ApiErrorCode;
  }> {
    const invite = await this.findInviteByCode(code);
    const validation = validateInviteCode(invite);

    if (!validation.valid || !invite) {
      return { success: false, errorCode: validation.errorCode };
    }

    // Atomic update
    invite.usedCount += 1;
    if (invite.usedCount >= invite.maxUses) {
      invite.status = "USED";
    }
    invite.updatedAt = new Date().toISOString();
    this.invites.set(invite.id, invite);

    return { success: true, invite };
  }

  public async revokeInvite(id: string): Promise<InviteCode | null> {
    const invite = this.invites.get(id);
    if (!invite) return null;

    invite.status = "REVOKED";
    invite.updatedAt = new Date().toISOString();
    this.invites.set(id, invite);
    return invite;
  }

  // --- Magic Link Token Operations ---

  public async createMagicLinkToken(
    email: string,
    ttlMs: number = 15 * 60 * 1000 // 15 minutes
  ): Promise<{ rawToken: string; expiresAt: string }> {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();

    const record: MagicLinkToken = {
      id: `ml_${randomUUID().slice(0, 8)}`,
      email: email.trim().toLowerCase(),
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: new Date().toISOString(),
    };

    this.magicTokens.set(tokenHash, record);

    return { rawToken, expiresAt };
  }

  public async verifyAndConsumeMagicLink(rawToken: string): Promise<{
    valid: boolean;
    email?: string;
  }> {
    if (!rawToken || typeof rawToken !== "string") {
      return { valid: false };
    }

    const tokenHash = createHash("sha256").update(rawToken.trim()).digest("hex");
    const record = this.magicTokens.get(tokenHash);

    if (!record) {
      return { valid: false };
    }

    if (record.usedAt !== null) {
      return { valid: false }; // Already used
    }

    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      return { valid: false }; // Expired
    }

    // Mark single-use consumption
    record.usedAt = new Date().toISOString();
    this.magicTokens.set(tokenHash, record);

    return { valid: true, email: record.email };
  }
}

export const authStore = new AuthStore();
