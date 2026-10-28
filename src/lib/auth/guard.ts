/**
 * src/lib/auth/guard.ts
 *
 * Centralized, server-side route authorization guard.
 * Strictly enforces access boundaries per MVP_SPEC.md §2 and API_CONTRACTS.md (IC-04):
 *  - Visitors: Restricted from all authenticated endpoints (401 UNAUTHENTICATED).
 *  - Pending Approval: Restricted to onboarding & status check (403 ACCOUNT_PENDING).
 *  - Rejected / Suspended / Disabled: Restricted from all platform activity (403 ACCOUNT_NOT_ACTIVE).
 *  - Unknown or Tampered Roles: Denied by default (403 FORBIDDEN).
 *  - Approved Members: Access to member features; blocked from admin endpoints (403 FORBIDDEN).
 *  - Admins: Access to member and admin endpoints.
 *  - Resource Ownership: Enforces owner data boundary checks (403 FORBIDDEN on foreign access).
 */

import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { apiError, errors } from "@/lib/errors";
import { type AppPermission, canAccessResource, hasPermission, isValidRole } from "./rbac";
import type { SessionUser, UserRole, UserStatus } from "./types";

export interface GuardOptions {
  allowedRoles?: UserRole[];
  requiredRole?: UserRole;
  requiredPermission?: AppPermission;
  allowedStatuses?: UserStatus[];
  resourceOwnerId?: string;
  allowAdminResourceOverride?: boolean;
}

export type GuardResult =
  | {
      authorized: true;
      user: SessionUser;
      errorResponse?: never;
    }
  | {
      authorized: false;
      user?: SessionUser;
      errorResponse: NextResponse;
    };

/**
 * Authoritative server-side authorization check.
 */
export function authorize(request: Request, options: GuardOptions = {}): GuardResult {
  const session = getSessionFromRequest(request);

  // 1. Visitor / Unauthenticated check (or stale/tampered token that failed HMAC verification)
  if (!session || !session.user) {
    return {
      authorized: false,
      errorResponse: errors.unauthenticated(),
    };
  }

  // 2. Stale / Expired session check (defense-in-depth)
  if (session.expiresAt && Date.now() > session.expiresAt) {
    return {
      authorized: false,
      errorResponse: errors.unauthenticated(),
    };
  }

  const user = session.user;
  const {
    allowedRoles,
    requiredRole,
    requiredPermission,
    allowedStatuses,
    resourceOwnerId,
    allowAdminResourceOverride = true,
  } = options;

  // 3. Deny-by-default for unknown or forged roles (e.g. "SUPER_ADMIN", "HACKER", empty string)
  if (!isValidRole(user.role)) {
    return {
      authorized: false,
      user,
      errorResponse: errors.forbidden(),
    };
  }

  // 4. Inactive or terminal account states (MVP_SPEC §3)
  if (user.status === "REJECTED" || user.status === "SUSPENDED" || user.status === "DISABLED") {
    return {
      authorized: false,
      user,
      errorResponse: apiError(
        "ACCOUNT_NOT_ACTIVE",
        `Your account status is ${user.status.toLowerCase()}. Access is restricted.`,
        403
      ),
    };
  }

  // 5. Pending approval state check
  if (user.status === "PENDING_APPROVAL") {
    const permitsPending = allowedStatuses?.includes("PENDING_APPROVAL");
    if (!permitsPending) {
      return {
        authorized: false,
        user,
        errorResponse: errors.accountPending(),
      };
    }
  }

  // 6. Explicit status whitelist check
  if (allowedStatuses && !allowedStatuses.includes(user.status)) {
    return {
      authorized: false,
      user,
      errorResponse: errors.forbidden(),
    };
  }

  // 7. Role requirements
  if (requiredRole && user.role !== requiredRole) {
    return {
      authorized: false,
      user,
      errorResponse: errors.forbidden(),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      user,
      errorResponse: errors.forbidden(),
    };
  }

  // 8. Granular RBAC permission check (deny-by-default)
  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return {
      authorized: false,
      user,
      errorResponse: errors.forbidden(),
    };
  }

  // 9. Data resource ownership check
  if (resourceOwnerId) {
    const canAccess = canAccessResource(user, resourceOwnerId, {
      allowAdmin: allowAdminResourceOverride,
    });
    if (!canAccess) {
      return {
        authorized: false,
        user,
        errorResponse: errors.forbidden(),
      };
    }
  }

  return {
    authorized: true,
    user,
  };
}

/**
 * Convenience helper to enforce a specific role requirement.
 */
export function requireRole(request: Request, role: UserRole): GuardResult {
  return authorize(request, { requiredRole: role });
}

/**
 * Convenience helper to enforce a specific permission requirement.
 */
export function requirePermission(request: Request, permission: AppPermission): GuardResult {
  return authorize(request, { requiredPermission: permission });
}

/**
 * Convenience helper to enforce authenticated session.
 */
export function requireAuth(request: Request, options: GuardOptions = {}): GuardResult {
  return authorize(request, options);
}
