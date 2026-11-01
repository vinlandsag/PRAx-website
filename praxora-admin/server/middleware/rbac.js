export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of [${allowedRoles.join(', ')}], but your role is "${req.user.role}".`
      });
    }

    next();
  };
}

export const requireSuperAdmin = requireRole(['super_admin']);
export const requireAdminOrAbove = requireRole(['super_admin', 'admin']);
export const requireModeratorOrAbove = requireRole(['super_admin', 'admin', 'moderator']);

export const ROLE_HIERARCHY = {
  super_admin: 4,
  admin: 3,
  moderator: 2,
  member: 1,
};

/**
 * Returns true if actorRole tier meets or exceeds requiredRole tier
 */
export function hasRoleTier(actorRole, requiredRole) {
  const actorTier = ROLE_HIERARCHY[actorRole] || 0;
  const requiredTier = ROLE_HIERARCHY[requiredRole] || 0;
  return actorTier >= requiredTier;
}

/**
 * Returns true if the role is an administrative/privileged role
 */
export function isPrivilegedRole(role) {
  return role === 'super_admin' || role === 'admin';
}

/**
 * Enforces hierarchical management rule:
 * - Only super_admin can alter administrative accounts (super_admin or admin)
 * - Admin can alter subordinate accounts (moderator, member)
 * - Subordinates cannot alter any account
 */
export function canManageAccount(actorRole, targetRole) {
  if (actorRole === 'super_admin') return true;
  if (isPrivilegedRole(targetRole)) return false;
  return actorRole === 'admin';
}
