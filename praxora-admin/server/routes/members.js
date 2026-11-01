import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdminOrAbove, ROLE_HIERARCHY } from '../middleware/rbac.js';
import { logAuditAction } from '../middleware/audit.js';

const router = express.Router();

// List members with search, role filter, status filter, pagination
router.get('/', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    const {
      search = '',
      role = '',
      status = '',
      page = 1,
      limit = 10,
    } = req.query;

    let query = `
      SELECT u.id, u.email, u.display_name, u.role, u.status, u.points, u.avatar_url, u.bio, u.muted_until, u.created_at,
             (SELECT COUNT(*) FROM submissions s WHERE s.member_id = u.id) as total_submissions,
             (SELECT COUNT(*) FROM submissions s WHERE s.member_id = u.id AND s.status = 'approved') as approved_submissions
      FROM users u
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ' AND (u.display_name LIKE ? OR u.email LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s);
    }

    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }

    if (status) {
      query += ' AND u.status = ?';
      params.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM (${query})`;
    const countResult = db.prepare(countSql).get(...params);
    const total = countResult ? countResult.total : 0;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const members = db.prepare(query).all(...params);

    res.json({
      members,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Failed to retrieve members.' });
  }
});

// Get member profile and relevant activity
router.get('/:id', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, display_name, role, status, points, avatar_url, bio, muted_until, created_at, updated_at
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    // Submissions activity
    const submissions = db.prepare(`
      SELECT s.*, t.title as task_title, t.reward_points
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      WHERE s.member_id = ?
      ORDER BY s.created_at DESC
      LIMIT 20
    `).all(user.id);

    // Point transactions history
    const pointTransactions = db.prepare(`
      SELECT pt.*, u.display_name as awarded_by_name
      FROM point_transactions pt
      LEFT JOIN users u ON pt.created_by = u.id
      WHERE pt.member_id = ?
      ORDER BY pt.created_at DESC
      LIMIT 20
    `).all(user.id);

    // Moderation events (e.g. mutes or flagged messages by or against this user)
    const moderationHistory = db.prepare(`
      SELECT a.*, u.display_name as actor_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.target_id = ? OR (a.target_type = 'user' AND a.target_id = ?)
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all(user.id, user.id);

    res.json({
      user,
      submissions,
      pointTransactions,
      moderationHistory,
    });
  } catch (err) {
    console.error('Error fetching member profile:', err);
    res.status(500).json({ error: 'Failed to retrieve member profile.' });
  }
});

// Change member role
// SECURITY RULES:
// 1. Prevent members from changing roles.
// 2. Prevent changing one's own role (prevents accidental lockout/self-escalation).
// 3. Prevent non-super_admin from assigning 'super_admin' or 'admin' roles.
// 4. Prevent non-super_admin from changing a super_admin's role.
router.patch('/:id/role', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    const { role: newRole } = req.body;
    const targetUserId = req.params.id;

    if (!['super_admin', 'admin', 'moderator', 'member'].includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    // Rule: Cannot change own role
    if (req.user.id === targetUserId) {
      return res.status(400).json({ error: 'Privilege security violation: You cannot change your own role.' });
    }

    const targetUser = db.prepare('SELECT id, email, display_name, role FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found.' });
    }

    // Rule: Only super_admin can modify an admin or super_admin account
    if (['super_admin', 'admin'].includes(targetUser.role) && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Privilege security violation: Only Super Admins can alter an Administrator account.' });
    }

    // Rule: Only super_admin can elevate anyone to super_admin or admin
    if (['super_admin', 'admin'].includes(newRole) && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Privilege security violation: Only Super Admins can promote users to Admin or Super Admin.' });
    }

    db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newRole, targetUser.id);

    logAuditAction({
      userId: req.user.id,
      action: 'USER_ROLE_CHANGED',
      targetType: 'user',
      targetId: targetUser.id,
      details: `Changed role of ${targetUser.display_name} (${targetUser.email}) from "${targetUser.role}" to "${newRole}"`,
      req,
    });

    res.json({
      message: `Role for ${targetUser.display_name} successfully changed to ${newRole}.`,
      role: newRole,
    });
  } catch (err) {
    console.error('Error updating member role:', err);
    res.status(500).json({ error: 'Failed to update member role.' });
  }
});

// Activate or Suspend account
router.patch('/:id/status', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    const { status } = req.body;
    const targetUserId = req.params.id;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "active" or "suspended".' });
    }

    // Rule: Cannot suspend own account
    if (req.user.id === targetUserId) {
      return res.status(400).json({ error: 'You cannot suspend your own account.' });
    }

    const targetUser = db.prepare('SELECT id, display_name, role, status FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Rule: Only super_admin can suspend a super_admin or admin
    if (['super_admin', 'admin'].includes(targetUser.role) && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only Super Admins can change status of an Administrator account.' });
    }

    db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, targetUser.id);

    logAuditAction({
      userId: req.user.id,
      action: status === 'active' ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
      targetType: 'user',
      targetId: targetUser.id,
      details: `Account status set to "${status}" for ${targetUser.display_name}`,
      req,
    });

    res.json({
      message: `Account status updated to ${status}.`,
      status,
    });
  } catch (err) {
    console.error('Error changing member status:', err);
    res.status(500).json({ error: 'Failed to update member account status.' });
  }
});

// INVITATIONS MANAGEMENT
// List invitations
router.get('/invitations/list', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    const invitations = db.prepare(`
      SELECT i.*, u.display_name as created_by_name
      FROM invitations i
      LEFT JOIN users u ON i.created_by = u.id
      ORDER BY i.created_at DESC
    `).all();

    // Auto-update expired invitations
    const now = new Date().toISOString();
    db.prepare("UPDATE invitations SET status = 'expired' WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < ?").run(now);

    res.json({ invitations });
  } catch (err) {
    console.error('Error fetching invitations:', err);
    res.status(500).json({ error: 'Failed to retrieve invitations.' });
  }
});

// Generate new invitation code
router.post('/invitations', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    const { role = 'member', maxUses = 1, expiresAt = null, customCode = '', code: providedCode = '' } = req.body;

    if (!['super_admin', 'admin', 'moderator', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role for invitation.' });
    }

    // Only super_admin can invite new admins or super_admins
    if (['super_admin', 'admin'].includes(role) && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only Super Admins can generate invitations for administrative roles.' });
    }

    const maxUsesNum = Math.max(1, parseInt(maxUses, 10) || 1);

    // Generate unique code or use custom
    const rawCode = (customCode || providedCode || '').trim();
    const code = rawCode
      ? rawCode.toUpperCase()
      : 'INV-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Check code uniqueness
    const existing = db.prepare('SELECT id FROM invitations WHERE code = ?').get(code);
    if (existing) {
      return res.status(409).json({ error: 'Invitation code already exists. Please choose a different code or leave blank for auto-generation.' });
    }

    const inviteId = 'inv-' + crypto.randomUUID();

    db.prepare(`
      INSERT INTO invitations (id, code, role, max_uses, uses_count, expires_at, status, created_by, created_at)
      VALUES (?, ?, ?, ?, 0, ?, 'active', ?, CURRENT_TIMESTAMP)
    `).run(inviteId, code, role, maxUsesNum, expiresAt || null, req.user.id);

    logAuditAction({
      userId: req.user.id,
      action: 'INVITATION_GENERATED',
      targetType: 'invitation',
      targetId: inviteId,
      details: `Generated invitation code "${code}" (Role: ${role}, Max uses: ${maxUsesNum})`,
      req,
    });

    const invite = db.prepare('SELECT * FROM invitations WHERE id = ?').get(inviteId);
    res.status(201).json({ invitation: invite, message: 'Invitation code created successfully.' });
  } catch (err) {
    console.error('Error generating invitation:', err);
    res.status(500).json({ error: 'Failed to create invitation code.' });
  }
});

// Revoke invitation code
router.delete('/invitations/:id', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    const invite = db.prepare('SELECT * FROM invitations WHERE id = ?').get(req.params.id);
    if (!invite) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }

    db.prepare("UPDATE invitations SET status = 'revoked' WHERE id = ?").run(invite.id);

    logAuditAction({
      userId: req.user.id,
      action: 'INVITATION_REVOKED',
      targetType: 'invitation',
      targetId: invite.id,
      details: `Revoked invitation code "${invite.code}"`,
      req,
    });

    res.json({ message: `Invitation code ${invite.code} revoked successfully.` });
  } catch (err) {
    console.error('Error revoking invitation:', err);
    res.status(500).json({ error: 'Failed to revoke invitation.' });
  }
});

export default router;
