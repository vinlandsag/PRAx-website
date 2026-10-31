import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { requireModeratorOrAbove } from '../middleware/rbac.js';
import { logAuditAction } from '../middleware/audit.js';

const router = express.Router();

// GET all chat messages (pinned announcements + active messages)
router.get('/messages', authenticate, (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT m.id, m.sender_id, m.content, m.is_pinned, m.is_deleted, m.created_at,
             u.display_name as sender_name, u.role as sender_role, u.avatar_url as sender_avatar
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.is_deleted = 0
      ORDER BY m.is_pinned DESC, m.created_at ASC
      LIMIT 100
    `).all();

    // Check if current user is currently muted
    const user = db.prepare('SELECT muted_until FROM users WHERE id = ?').get(req.user.id);
    let isMuted = false;
    let mutedUntil = null;
    if (user && user.muted_until) {
      if (new Date(user.muted_until) > new Date()) {
        isMuted = true;
        mutedUntil = user.muted_until;
      } else {
        // Expired mute: automatically clear
        db.prepare('UPDATE users SET muted_until = NULL WHERE id = ?').run(req.user.id);
      }
    }

    res.json({
      messages,
      currentUserMuted: isMuted,
      mutedUntil,
    });
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ error: 'Failed to retrieve chat messages.' });
  }
});

// POST send new chat message
router.post('/messages', authenticate, (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    // Verify user is not muted
    const user = db.prepare('SELECT muted_until FROM users WHERE id = ?').get(req.user.id);
    if (user && user.muted_until) {
      if (new Date(user.muted_until) > new Date()) {
        return res.status(403).json({
          error: `You are temporarily muted from sending chat messages until ${new Date(user.muted_until).toLocaleString()}.`,
          mutedUntil: user.muted_until,
        });
      } else {
        // Mute expired, clear it
        db.prepare('UPDATE users SET muted_until = NULL WHERE id = ?').run(req.user.id);
      }
    }

    const messageId = 'msg-' + crypto.randomUUID();

    db.prepare(`
      INSERT INTO chat_messages (id, sender_id, content, is_pinned, is_deleted, created_at)
      VALUES (?, ?, ?, 0, 0, CURRENT_TIMESTAMP)
    `).run(messageId, req.user.id, content.trim());

    const created = db.prepare(`
      SELECT m.*, u.display_name as sender_name, u.role as sender_role, u.avatar_url as sender_avatar
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(messageId);

    res.status(201).json({ message: created });
  } catch (err) {
    console.error('Error posting message:', err);
    res.status(500).json({ error: 'Failed to send chat message.' });
  }
});

// POST flag a message
router.post('/messages/:id/flag', authenticate, (req, res) => {
  try {
    const { reason, details } = req.body;
    const messageId = req.params.id;

    if (!reason || !['Spam', 'Harassment', 'Inappropriate', 'Off-topic', 'Malicious Link', 'Other'].includes(reason)) {
      return res.status(400).json({ error: 'Valid flag reason is required.' });
    }

    const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    // Check if user already flagged this message
    const existing = db.prepare('SELECT id FROM flagged_messages WHERE message_id = ? AND flagged_by = ?').get(messageId, req.user.id);
    if (existing) {
      return res.status(400).json({ error: 'You have already flagged this message for moderator review.' });
    }

    const flagId = 'flg-' + crypto.randomUUID();

    db.prepare(`
      INSERT INTO flagged_messages (id, message_id, flagged_by, reason, details, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `).run(flagId, messageId, req.user.id, reason, details ? details.trim() : null);

    logAuditAction({
      userId: req.user.id,
      action: 'CHAT_MESSAGE_FLAGGED',
      targetType: 'chat_message',
      targetId: messageId,
      details: `Flagged message for "${reason}": "${message.content.substring(0, 50)}..."`,
      req,
    });

    res.status(201).json({ message: 'Message has been submitted for moderation review.', flagId });
  } catch (err) {
    console.error('Error flagging message:', err);
    res.status(500).json({ error: 'Failed to flag message.' });
  }
});

// MODERATION ACTIONS (Moderator, Admin, Super Admin only)

// List flagged messages with filters
router.get('/moderation/flagged', authenticate, requireModeratorOrAbove, (req, res) => {
  try {
    const { status = '', reason = '', page = 1, limit = 15 } = req.query;

    let query = `
      SELECT f.*,
             m.content as message_content,
             m.is_pinned as message_is_pinned,
             m.is_deleted as message_is_deleted,
             m.created_at as message_created_at,
             sender.id as sender_id,
             sender.display_name as sender_name,
             sender.email as sender_email,
             sender.role as sender_role,
             sender.muted_until as sender_muted_until,
             flagger.display_name as flagger_name,
             reviewer.display_name as reviewer_name
      FROM flagged_messages f
      JOIN chat_messages m ON f.message_id = m.id
      JOIN users sender ON m.sender_id = sender.id
      JOIN users flagger ON f.flagged_by = flagger.id
      LEFT JOIN users reviewer ON f.reviewed_by = reviewer.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND f.status = ?';
      params.push(status);
    }

    if (reason) {
      query += ' AND f.reason = ?';
      params.push(reason);
    }

    const countSql = `SELECT COUNT(*) as total FROM (${query})`;
    const countResult = db.prepare(countSql).get(...params);
    const total = countResult ? countResult.total : 0;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const offset = (pageNum - 1) * limitNum;

    query += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const flaggedItems = db.prepare(query).all(...params);

    res.json({
      flaggedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Error fetching flagged messages:', err);
    res.status(500).json({ error: 'Failed to retrieve flagged messages.' });
  }
});

// Update review status of a flagged message
router.post('/moderation/flagged/:id/review', authenticate, requireModeratorOrAbove, (req, res) => {
  try {
    const { status, moderatorNotes } = req.body;
    if (!['pending', 'reviewed', 'action_taken', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid moderation status. Must be pending, reviewed, action_taken, or dismissed.' });
    }

    const flag = db.prepare('SELECT * FROM flagged_messages WHERE id = ?').get(req.params.id);
    if (!flag) {
      return res.status(404).json({ error: 'Flagged record not found.' });
    }

    db.prepare(`
      UPDATE flagged_messages
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, moderator_notes = ?
      WHERE id = ?
    `).run(status, req.user.id, moderatorNotes ? moderatorNotes.trim() : null, flag.id);

    logAuditAction({
      userId: req.user.id,
      action: 'CHAT_FLAG_REVIEWED',
      targetType: 'flagged_message',
      targetId: flag.id,
      details: `Set status to "${status}". Notes: ${moderatorNotes || 'None'}`,
      req,
    });

    res.json({ message: `Flagged item marked as ${status}.` });
  } catch (err) {
    console.error('Error updating flag status:', err);
    res.status(500).json({ error: 'Failed to update moderation review.' });
  }
});

// Delete message (Moderator, Admin, Super Admin)
router.delete('/messages/:id', authenticate, requireModeratorOrAbove, (req, res) => {
  try {
    const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    // Soft delete to preserve audit log
    db.prepare('UPDATE chat_messages SET is_deleted = 1 WHERE id = ?').run(message.id);

    // Also update any related flags to action_taken
    db.prepare(`
      UPDATE flagged_messages
      SET status = 'action_taken', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, moderator_notes = 'Message deleted by moderator.'
      WHERE message_id = ? AND status = 'pending'
    `).run(req.user.id, message.id);

    logAuditAction({
      userId: req.user.id,
      action: 'CHAT_MESSAGE_DELETED',
      targetType: 'chat_message',
      targetId: message.id,
      details: `Deleted message: "${message.content.substring(0, 50)}..." from sender ${message.sender_id}`,
      req,
    });

    res.json({ message: 'Message deleted successfully.' });
  } catch (err) {
    console.error('Error deleting chat message:', err);
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

// Pin / Unpin announcement (Moderator, Admin, Super Admin)
router.patch('/messages/:id/pin', authenticate, requireModeratorOrAbove, (req, res) => {
  try {
    const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    const newPinnedStatus = message.is_pinned ? 0 : 1;
    db.prepare('UPDATE chat_messages SET is_pinned = ? WHERE id = ?').run(newPinnedStatus, message.id);

    logAuditAction({
      userId: req.user.id,
      action: newPinnedStatus ? 'CHAT_ANNOUNCEMENT_PINNED' : 'CHAT_ANNOUNCEMENT_UNPINNED',
      targetType: 'chat_message',
      targetId: message.id,
      details: `${newPinnedStatus ? 'Pinned' : 'Unpinned'} announcement message ID: ${message.id}`,
      req,
    });

    res.json({
      message: newPinnedStatus ? 'Message pinned as announcement.' : 'Message unpinned.',
      isPinned: newPinnedStatus === 1,
    });
  } catch (err) {
    console.error('Error toggling pin status:', err);
    res.status(500).json({ error: 'Failed to update pin status.' });
  }
});

// Mute user (Moderator, Admin, Super Admin)
// Duration options: minutes (e.g. 15, 60, 1440 [24h], 10080 [7d], or 525600 [permanent])
router.post('/moderation/mute-user', authenticate, requireModeratorOrAbove, (req, res) => {
  try {
    const { userId, durationMinutes, reason } = req.body;

    if (!userId || !durationMinutes) {
      return res.status(400).json({ error: 'User ID and duration in minutes are required.' });
    }

    const targetUser = db.prepare('SELECT id, display_name, role FROM users WHERE id = ?').get(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found.' });
    }

    // Cannot mute another staff member unless super_admin
    if (['super_admin', 'admin', 'moderator'].includes(targetUser.role) && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'You do not have permission to mute other staff members.' });
    }

    const durationNum = parseInt(durationMinutes, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive integer in minutes.' });
    }

    const mutedUntilDate = new Date(Date.now() + durationNum * 60000).toISOString();

    db.prepare('UPDATE users SET muted_until = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(mutedUntilDate, targetUser.id);

    logAuditAction({
      userId: req.user.id,
      action: 'USER_MUTED',
      targetType: 'user',
      targetId: targetUser.id,
      details: `Muted ${targetUser.display_name} for ${durationNum} minutes until ${mutedUntilDate}. Reason: ${reason || 'Violation of chat guidelines'}`,
      req,
    });

    res.json({
      message: `User ${targetUser.display_name} muted successfully until ${new Date(mutedUntilDate).toLocaleString()}.`,
      mutedUntil: mutedUntilDate,
    });
  } catch (err) {
    console.error('Error muting user:', err);
    res.status(500).json({ error: 'Failed to mute user.' });
  }
});

// Unmute user
router.post('/moderation/unmute-user', authenticate, requireModeratorOrAbove, (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    const targetUser = db.prepare('SELECT id, display_name FROM users WHERE id = ?').get(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.prepare('UPDATE users SET muted_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(targetUser.id);

    logAuditAction({
      userId: req.user.id,
      action: 'USER_UNMUTED',
      targetType: 'user',
      targetId: targetUser.id,
      details: `Unmuted user ${targetUser.display_name}`,
      req,
    });

    res.json({ message: `User ${targetUser.display_name} has been unmuted.` });
  } catch (err) {
    console.error('Error unmuting user:', err);
    res.status(500).json({ error: 'Failed to unmute user.' });
  }
});

// Moderation history & audit records
router.get('/moderation/history', authenticate, requireModeratorOrAbove, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT a.*, u.display_name as moderator_name, u.role as moderator_role
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      WHERE a.action IN ('CHAT_MESSAGE_DELETED', 'USER_MUTED', 'USER_UNMUTED', 'CHAT_ANNOUNCEMENT_PINNED', 'CHAT_ANNOUNCEMENT_UNPINNED', 'CHAT_FLAG_REVIEWED')
      ORDER BY a.created_at DESC
      LIMIT 50
    `).all();

    res.json({ history });
  } catch (err) {
    console.error('Error fetching moderation history:', err);
    res.status(500).json({ error: 'Failed to retrieve moderation history.' });
  }
});

export default router;
