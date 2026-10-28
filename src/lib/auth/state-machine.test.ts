/**
 * src/lib/auth/state-machine.test.ts
 *
 * Test suite for Phase 4 Onboarding and Approval State Machine,
 * Server-Side Access Boundaries, and Audit Trail.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { transitionUserStatus } from "./state-machine";
import { authorize } from "./guard";
import { signSession, SESSION_COOKIE_NAME } from "./session";
import { createAuditEvent, listAuditEvents, resetAuditLog } from "@/lib/audit/audit";
import { authStore } from "@/lib/db/auth-store";
import type { SessionUser } from "./types";

// Route handlers
import { GET as listUsersHandler } from "@/app/api/admin/users/route";
import { POST as approveHandler } from "@/app/api/admin/users/[id]/approve/route";
import { POST as rejectHandler } from "@/app/api/admin/users/[id]/reject/route";
import { POST as suspendHandler } from "@/app/api/admin/users/[id]/suspend/route";
import { POST as unsuspendHandler } from "@/app/api/admin/users/[id]/unsuspend/route";
import { POST as disableHandler } from "@/app/api/admin/users/[id]/disable/route";
import { GET as auditLogHandler } from "@/app/api/admin/audit-log/route";

describe("Phase 4 — State Machine Transitions", () => {
  let adminSession: SessionUser;
  let memberSession: SessionUser;

  beforeEach(async () => {
    await authStore.resetForTesting();
    resetAuditLog();

    const admin = await authStore.findUserByEmail("admin@prax.build");
    adminSession = {
      id: admin!.id,
      email: admin!.email,
      name: admin!.name,
      role: admin!.role,
      status: admin!.status,
    };

    const member = await authStore.findUserByEmail("member@prax.build");
    memberSession = {
      id: member!.id,
      email: member!.email,
      name: member!.name,
      role: member!.role,
      status: member!.status,
    };
  });

  it("allows PENDING_APPROVAL -> APPROVED transition by admin", async () => {
    const pendingUser = await authStore.findUserByEmail("pending@prax.build");
    expect(pendingUser?.status).toBe("PENDING_APPROVAL");

    const result = await transitionUserStatus({
      targetUserId: pendingUser!.id,
      targetStatus: "APPROVED",
      actor: adminSession,
    });

    expect(result.success).toBe(true);
    expect(result.user?.status).toBe("APPROVED");

    // Verify stored user updated
    const updated = await authStore.findUserById(pendingUser!.id);
    expect(updated?.status).toBe("APPROVED");

    // Verify audit log emitted
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog?.event).toBe("USER_APPROVED");
    expect(result.auditLog?.priorState).toBe("PENDING_APPROVAL");
    expect(result.auditLog?.newState).toBe("APPROVED");
  });

  it("allows PENDING_APPROVAL -> REJECTED transition with a mandatory reason", async () => {
    const pendingUser = await authStore.findUserByEmail("pending@prax.build");

    const result = await transitionUserStatus({
      targetUserId: pendingUser!.id,
      targetStatus: "REJECTED",
      actor: adminSession,
      reason: "Incomplete portfolio proof and lack of relevant experience.",
    });

    expect(result.success).toBe(true);
    expect(result.user?.status).toBe("REJECTED");
    expect(result.auditLog?.event).toBe("USER_REJECTED");
    expect(result.auditLog?.reason).toContain("Incomplete portfolio");
  });

  it("rejects PENDING_APPROVAL -> REJECTED transition if reason is missing or empty", async () => {
    const pendingUser = await authStore.findUserByEmail("pending@prax.build");

    const resultWithoutReason = await transitionUserStatus({
      targetUserId: pendingUser!.id,
      targetStatus: "REJECTED",
      actor: adminSession,
    });

    expect(resultWithoutReason.success).toBe(false);
    expect(resultWithoutReason.errorCode).toBe("VALIDATION_ERROR");

    const resultWithEmptyReason = await transitionUserStatus({
      targetUserId: pendingUser!.id,
      targetStatus: "REJECTED",
      actor: adminSession,
      reason: "   ",
    });

    expect(resultWithEmptyReason.success).toBe(false);
    expect(resultWithEmptyReason.errorCode).toBe("VALIDATION_ERROR");
  });

  it("allows APPROVED -> SUSPENDED with reason, and SUSPENDED -> APPROVED (unsuspend)", async () => {
    const member = await authStore.findUserByEmail("member@prax.build");
    expect(member?.status).toBe("APPROVED");

    // Suspend
    const suspendResult = await transitionUserStatus({
      targetUserId: member!.id,
      targetStatus: "SUSPENDED",
      actor: adminSession,
      reason: "Conduct review pending investigation.",
    });

    expect(suspendResult.success).toBe(true);
    expect(suspendResult.user?.status).toBe("SUSPENDED");
    expect(suspendResult.auditLog?.event).toBe("USER_SUSPENDED");

    // Unsuspend
    const unsuspendResult = await transitionUserStatus({
      targetUserId: member!.id,
      targetStatus: "APPROVED",
      actor: adminSession,
    });

    expect(unsuspendResult.success).toBe(true);
    expect(unsuspendResult.user?.status).toBe("APPROVED");
    expect(unsuspendResult.auditLog?.event).toBe("USER_UNSUSPENDED");
  });

  it("allows transitions to terminal state DISABLED with reason", async () => {
    const member = await authStore.findUserByEmail("member@prax.build");

    const disableResult = await transitionUserStatus({
      targetUserId: member!.id,
      targetStatus: "DISABLED",
      actor: adminSession,
      reason: "Voluntary permanent account deletion request.",
    });

    expect(disableResult.success).toBe(true);
    expect(disableResult.user?.status).toBe("DISABLED");
    expect(disableResult.auditLog?.event).toBe("USER_DISABLED");

    // Attempt to transition out of terminal state DISABLED -> must fail
    const reactivateResult = await transitionUserStatus({
      targetUserId: member!.id,
      targetStatus: "APPROVED",
      actor: adminSession,
    });

    expect(reactivateResult.success).toBe(false);
    expect(reactivateResult.errorCode).toBe("INVALID_STATE_TRANSITION");
  });

  it("blocks repeated approval (APPROVED -> APPROVED) with INVALID_STATE_TRANSITION", async () => {
    const member = await authStore.findUserByEmail("member@prax.build");
    expect(member?.status).toBe("APPROVED");

    const result = await transitionUserStatus({
      targetUserId: member!.id,
      targetStatus: "APPROVED",
      actor: adminSession,
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("INVALID_STATE_TRANSITION");
  });

  it("blocks illegal transitions (e.g. REJECTED -> APPROVED)", async () => {
    const pendingUser = await authStore.findUserByEmail("pending@prax.build");

    // First reject
    await transitionUserStatus({
      targetUserId: pendingUser!.id,
      targetStatus: "REJECTED",
      actor: adminSession,
      reason: "Rejected application.",
    });

    // Try REJECTED -> APPROVED (illegal per diagram)
    const illegalResult = await transitionUserStatus({
      targetUserId: pendingUser!.id,
      targetStatus: "APPROVED",
      actor: adminSession,
    });

    expect(illegalResult.success).toBe(false);
    expect(illegalResult.errorCode).toBe("INVALID_STATE_TRANSITION");
  });

  it("prevents self-approval and self-status modification", async () => {
    // Admin attempts to modify own status
    const selfApprove = await transitionUserStatus({
      targetUserId: adminSession.id,
      targetStatus: "APPROVED",
      actor: adminSession,
    });
    expect(selfApprove.success).toBe(false);
    expect(selfApprove.errorCode).toBe("FORBIDDEN");

    const selfDisable = await transitionUserStatus({
      targetUserId: adminSession.id,
      targetStatus: "DISABLED",
      actor: adminSession,
      reason: "Self disable attempt",
    });
    expect(selfDisable.success).toBe(false);
    expect(selfDisable.errorCode).toBe("FORBIDDEN");
  });

  it("blocks unauthorized transitions initiated by non-admin member", async () => {
    const pendingUser = await authStore.findUserByEmail("pending@prax.build");

    const unauthorizedResult = await transitionUserStatus({
      targetUserId: pendingUser!.id,
      targetStatus: "APPROVED",
      actor: memberSession,
    });

    expect(unauthorizedResult.success).toBe(false);
    expect(unauthorizedResult.errorCode).toBe("FORBIDDEN");
  });
});

describe("Phase 4 — Server-Side Access Boundaries (Guard)", () => {
  beforeEach(async () => {
    await authStore.resetForTesting();
  });

  it("restricts visitors (unauthenticated) with 401 UNAUTHENTICATED", () => {
    const req = new Request("http://localhost:3000/api/dashboard");
    const guard = authorize(req, { allowedRoles: ["MEMBER"] });

    expect(guard.authorized).toBe(false);
    expect(guard.errorResponse?.status).toBe(401);
  });

  it("restricts PENDING_APPROVAL users with 403 ACCOUNT_PENDING from member endpoints", () => {
    const pendingToken = signSession({
      id: "usr_pending_01",
      email: "pending@prax.build",
      name: "Pending Builder",
      role: "MEMBER",
      status: "PENDING_APPROVAL",
    });

    const req = new Request("http://localhost:3000/api/tasks", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${pendingToken}` },
    });

    const guard = authorize(req, { allowedRoles: ["MEMBER"], allowedStatuses: ["APPROVED"] });
    expect(guard.authorized).toBe(false);
    expect(guard.errorResponse?.status).toBe(403);
  });

  it("allows PENDING_APPROVAL users when endpoint explicitly permits pending status", () => {
    const pendingToken = signSession({
      id: "usr_pending_01",
      email: "pending@prax.build",
      name: "Pending Builder",
      role: "MEMBER",
      status: "PENDING_APPROVAL",
    });

    const req = new Request("http://localhost:3000/api/users/me", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${pendingToken}` },
    });

    const guard = authorize(req, { allowedStatuses: ["PENDING_APPROVAL", "APPROVED"] });
    expect(guard.authorized).toBe(true);
    expect(guard.user?.status).toBe("PENDING_APPROVAL");
  });

  it("restricts REJECTED, SUSPENDED, and DISABLED users with 403 ACCOUNT_NOT_ACTIVE", () => {
    const suspendedToken = signSession({
      id: "usr_suspended_01",
      email: "suspended@prax.build",
      name: "Suspended Member",
      role: "MEMBER",
      status: "SUSPENDED",
    });

    const req = new Request("http://localhost:3000/api/tasks", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${suspendedToken}` },
    });

    const guard = authorize(req, { allowedStatuses: ["APPROVED"] });
    expect(guard.authorized).toBe(false);
    expect(guard.errorResponse?.status).toBe(403);
  });

  it("blocks APPROVED members from accessing ADMIN routes with 403 FORBIDDEN", () => {
    const memberToken = signSession({
      id: "usr_member_01",
      email: "member@prax.build",
      name: "Arjun Varma",
      role: "MEMBER",
      status: "APPROVED",
    });

    const req = new Request("http://localhost:3000/api/admin/users", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${memberToken}` },
    });

    const guard = authorize(req, { allowedRoles: ["ADMIN"] });
    expect(guard.authorized).toBe(false);
    expect(guard.errorResponse?.status).toBe(403);
  });

  it("allows APPROVED admins to access admin routes", () => {
    const adminToken = signSession({
      id: "usr_admin_01",
      email: "admin@prax.build",
      name: "Admin User",
      role: "ADMIN",
      status: "APPROVED",
    });

    const req = new Request("http://localhost:3000/api/admin/users", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
    });

    const guard = authorize(req, { allowedRoles: ["ADMIN"] });
    expect(guard.authorized).toBe(true);
    expect(guard.user?.role).toBe("ADMIN");
  });
});

describe("Phase 4 — Audit Trail & Secret Scrubbing", () => {
  beforeEach(() => {
    resetAuditLog();
  });

  it("records actor, target, prior state, new state, reason, and timestamp", () => {
    const entry = createAuditEvent("USER_APPROVED", "usr_admin_01", {
      targetId: "usr_pending_01",
      priorState: "PENDING_APPROVAL",
      newState: "APPROVED",
      reason: "Portfolio verified.",
    });

    expect(entry.id).toMatch(/^aud_/);
    expect(entry.event).toBe("USER_APPROVED");
    expect(entry.actorId).toBe("usr_admin_01");
    expect(entry.targetId).toBe("usr_pending_01");
    expect(entry.priorState).toBe("PENDING_APPROVAL");
    expect(entry.newState).toBe("APPROVED");
    expect(entry.reason).toBe("Portfolio verified.");
    expect(entry.createdAt).toBeDefined();

    const query = listAuditEvents({ userId: "usr_pending_01" });
    expect(query.total).toBe(1);
    expect(query.events[0].id).toBe(entry.id);
  });

  it("scrubs passwords, tokens, hashes, and secrets from audit metadata", () => {
    const entry = createAuditEvent("USER_REGISTERED", "system", {
      targetId: "usr_new_01",
      metadata: {
        email: "safe@prax.build",
        password: "ShouldNeverBeLogged!",
        passwordHash: "salt:hash",
        secretToken: "secret_12345",
        authToken: "raw_token",
        inviteCode: "PRAX-ALPHA-2026",
      },
    });

    expect(entry.metadata?.email).toBe("safe@prax.build");
    expect(entry.metadata?.inviteCode).toBe("PRAX-ALPHA-2026");
    expect(entry.metadata?.password).toBeUndefined();
    expect(entry.metadata?.passwordHash).toBeUndefined();
    expect(entry.metadata?.secretToken).toBeUndefined();
    expect(entry.metadata?.authToken).toBeUndefined();
  });
});

describe("Phase 4 — Admin API Endpoints Integration", () => {
  let adminToken: string;
  let memberToken: string;

  beforeEach(async () => {
    await authStore.resetForTesting();
    resetAuditLog();

    const admin = await authStore.findUserByEmail("admin@prax.build");
    adminToken = signSession({
      id: admin!.id,
      email: admin!.email,
      name: admin!.name,
      role: admin!.role,
      status: admin!.status,
    });

    const member = await authStore.findUserByEmail("member@prax.build");
    memberToken = signSession({
      id: member!.id,
      email: member!.email,
      name: member!.name,
      role: member!.role,
      status: member!.status,
    });
  });

  it("GET /api/admin/users returns filtered users and blocks non-admin", async () => {
    // Admin request
    const adminReq = new Request("http://localhost:3000/api/admin/users?status=PENDING_APPROVAL", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
    });
    const res = await listUsersHandler(adminReq);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.users)).toBe(true);
    expect(data.users.every((u: { status: string }) => u.status === "PENDING_APPROVAL")).toBe(true);
    expect(data.users[0].passwordHash).toBeUndefined(); // Scrubbed

    // Member request -> 403
    const memberReq = new Request("http://localhost:3000/api/admin/users", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${memberToken}` },
    });
    const memberRes = await listUsersHandler(memberReq);
    expect(memberRes.status).toBe(403);
  });

  it("POST /api/admin/users/:id/approve approves pending user and emits audit log", async () => {
    const pendingUser = await authStore.findUserByEmail("pending@prax.build");

    const req = new Request(`http://localhost:3000/api/admin/users/${pendingUser!.id}/approve`, {
      method: "POST",
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
    });

    const res = await approveHandler(req, {
      params: Promise.resolve({ id: pendingUser!.id }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.status).toBe("APPROVED");

    // Verify audit log has the event
    const auditLogs = listAuditEvents({ userId: pendingUser!.id, event: "USER_APPROVED" });
    expect(auditLogs.total).toBe(1);
    expect(auditLogs.events[0].newState).toBe("APPROVED");
  });

  it("POST /api/admin/users/:id/reject requires reason and transitions to REJECTED", async () => {
    const pendingUser = await authStore.findUserByEmail("pending@prax.build");

    // Attempt without reason -> 400
    const noReasonReq = new Request(
      `http://localhost:3000/api/admin/users/${pendingUser!.id}/reject`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
        },
        body: JSON.stringify({}),
      }
    );

    const noReasonRes = await rejectHandler(noReasonReq, {
      params: Promise.resolve({ id: pendingUser!.id }),
    });
    expect(noReasonRes.status).toBe(400);

    // Valid rejection with reason -> 200
    const validReq = new Request(
      `http://localhost:3000/api/admin/users/${pendingUser!.id}/reject`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
        },
        body: JSON.stringify({ reason: "Duplicate application submission." }),
      }
    );

    const validRes = await rejectHandler(validReq, {
      params: Promise.resolve({ id: pendingUser!.id }),
    });
    expect(validRes.status).toBe(200);

    const validData = await validRes.json();
    expect(validData.user.status).toBe("REJECTED");
  });

  it("POST /api/admin/users/:id/suspend and unsuspend cycle works", async () => {
    const member = await authStore.findUserByEmail("member@prax.build");

    // Suspend
    const suspendReq = new Request(`http://localhost:3000/api/admin/users/${member!.id}/suspend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
      },
      body: JSON.stringify({ reason: "Temporary moderation freeze." }),
    });

    const suspendRes = await suspendHandler(suspendReq, {
      params: Promise.resolve({ id: member!.id }),
    });
    expect(suspendRes.status).toBe(200);

    // Unsuspend
    const unsuspendReq = new Request(
      `http://localhost:3000/api/admin/users/${member!.id}/unsuspend`,
      {
        method: "POST",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
      }
    );

    const unsuspendRes = await unsuspendHandler(unsuspendReq, {
      params: Promise.resolve({ id: member!.id }),
    });
    expect(unsuspendRes.status).toBe(200);
    const data = await unsuspendRes.json();
    expect(data.user.status).toBe("APPROVED");
  });

  it("POST /api/admin/users/:id/disable permanently disables user", async () => {
    const member = await authStore.findUserByEmail("member@prax.build");

    const disableReq = new Request(`http://localhost:3000/api/admin/users/${member!.id}/disable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
      },
      body: JSON.stringify({ reason: "Account closed by administration." }),
    });

    const disableRes = await disableHandler(disableReq, {
      params: Promise.resolve({ id: member!.id }),
    });
    expect(disableRes.status).toBe(200);

    // Further action on disabled user -> 422
    const followUpReq = new Request(`http://localhost:3000/api/admin/users/${member!.id}/approve`, {
      method: "POST",
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
    });

    const followUpRes = await approveHandler(followUpReq, {
      params: Promise.resolve({ id: member!.id }),
    });
    expect(followUpRes.status).toBe(422);
  });

  it("GET /api/admin/audit-log returns audit history for admin", async () => {
    createAuditEvent("USER_APPROVED", "usr_admin_01", {
      targetId: "usr_target_01",
      reason: "Verified builder portfolio",
    });

    const req = new Request("http://localhost:3000/api/admin/audit-log?limit=10", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
    });

    const res = await auditLogHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.total).toBeGreaterThan(0);
    expect(data.events[0].event).toBe("USER_APPROVED");
  });
});
