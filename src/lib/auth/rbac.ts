/**
 * src/lib/auth/rbac.ts
 *
 * Role-Based Access Control (RBAC) engine for the PRAX Platform.
 * Conforms to MVP_SPEC.md §2 (Roles & Exact Permissions) and API_CONTRACTS.md (IC-04).
 *
 * Principles:
 * 1. Deny-by-default: Any unknown role, undefined permission, or ungranted access returns false.
 * 2. Strict Role Hierarchy & Whitelist: Only explicitly enumerated roles ('MEMBER', 'ADMIN')
 *    and defined permissions are evaluated.
 * 3. Server-authoritative: Client UI guards are for UX only; this module is the single source of truth.
 */

import type { SessionUser, UserRole } from "./types";

/**
 * Granular application permissions aligned with MVP_SPEC.md §2.
 */
export type AppPermission =
  // Public / Visitor
  | "view:landing"
  | "auth:register"
  | "auth:login"
  | "invites:verify"

  // Member features (status must also be APPROVED)
  | "view:dashboard"
  | "view:own_profile"
  | "edit:own_profile"
  | "view:tasks"
  | "create:submission"
  | "edit:own_submission"
  | "submit:own_submission"
  | "view:own_streaks_points"
  | "view:rubric"
  | "chat:read_write"
  | "view:space"
  | "edit:own_space"
  | "view:member_profile"

  // Admin features (requires role = ADMIN and status = APPROVED)
  | "admin:view_user_queue"
  | "admin:approve_user"
  | "admin:reject_user"
  | "admin:suspend_user"
  | "admin:unsuspend_user"
  | "admin:disable_user"
  | "admin:create_invite"
  | "admin:revoke_invite"
  | "admin:view_invites"
  | "admin:view_submissions_queue"
  | "admin:approve_submission"
  | "admin:reject_submission"
  | "admin:request_revision_submission"
  | "admin:manage_rubric"
  | "admin:assign_points"
  | "admin:moderate_chat"
  | "admin:view_audit_log";

/**
 * Valid recognized roles in the system.
 */
export const VALID_ROLES = ["MEMBER", "ADMIN"] as const;

/**
 * Public permissions accessible without authentication.
 */
export const VISITOR_PERMISSIONS: ReadonlySet<AppPermission> = new Set<AppPermission>([
  "view:landing",
  "auth:register",
  "auth:login",
  "invites:verify",
]);

/**
 * Member permissions: all core community engagement and submission features.
 * Strictly zero admin permissions.
 */
export const MEMBER_PERMISSIONS: ReadonlySet<AppPermission> = new Set<AppPermission>([
  ...VISITOR_PERMISSIONS,
  "view:dashboard",
  "view:own_profile",
  "edit:own_profile",
  "view:tasks",
  "create:submission",
  "edit:own_submission",
  "submit:own_submission",
  "view:own_streaks_points",
  "view:rubric",
  "chat:read_write",
  "view:space",
  "edit:own_space",
  "view:member_profile",
]);

/**
 * Admin permissions: inherits all member permissions plus administrative powers.
 */
export const ADMIN_PERMISSIONS: ReadonlySet<AppPermission> = new Set<AppPermission>([
  ...MEMBER_PERMISSIONS,
  "admin:view_user_queue",
  "admin:approve_user",
  "admin:reject_user",
  "admin:suspend_user",
  "admin:unsuspend_user",
  "admin:disable_user",
  "admin:create_invite",
  "admin:revoke_invite",
  "admin:view_invites",
  "admin:view_submissions_queue",
  "admin:approve_submission",
  "admin:reject_submission",
  "admin:request_revision_submission",
  "admin:manage_rubric",
  "admin:assign_points",
  "admin:moderate_chat",
  "admin:view_audit_log",
]);

/**
 * Static mapping of recognized roles to their permission sets.
 */
export const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<AppPermission>> = {
  MEMBER: MEMBER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
};

/**
 * Checks whether a given role is a recognized, valid UserRole.
 */
export function isValidRole(role: unknown): role is UserRole {
  return typeof role === "string" && (role === "MEMBER" || role === "ADMIN");
}

/**
 * Checks whether a given role possesses a specific permission.
 *
 * Enforces DENY-BY-DEFAULT:
 * - If role is undefined, null, or not in VALID_ROLES, returns false (unless checking a visitor permission).
 * - If permission is unknown or not explicitly in the role's permission set, returns false.
 */
export function hasPermission(role: string | null | undefined, permission: AppPermission): boolean {
  // Visitor / unauthenticated check
  if (!role) {
    return VISITOR_PERMISSIONS.has(permission);
  }

  // Deny-by-default for unknown or tampered roles (e.g. "SUPER_ADMIN", "HACKER", "")
  if (!isValidRole(role)) {
    return false;
  }

  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) {
    return false;
  }

  return permissions.has(permission);
}

/**
 * Data access authorization helper.
 * Verifies if an authenticated user owns a specific resource or has admin override privileges.
 *
 * @param user The authenticated session user
 * @param resourceOwnerId The user ID of the owner of the resource
 * @param options.allowAdmin Whether an admin is permitted to access/modify this resource (default: true)
 */
export function canAccessResource(
  user: SessionUser | null | undefined,
  resourceOwnerId: string,
  options: { allowAdmin?: boolean } = {}
): boolean {
  if (!user || !user.id || !resourceOwnerId) {
    return false;
  }

  // Member owns their resource
  if (user.id === resourceOwnerId) {
    return true;
  }

  // Admin access override (allowed by default unless explicitly disabled for private fields)
  const allowAdmin = options.allowAdmin ?? true;
  if (allowAdmin && user.role === "ADMIN") {
    return true;
  }

  return false;
}
