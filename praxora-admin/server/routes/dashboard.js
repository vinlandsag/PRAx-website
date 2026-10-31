import express from 'express';
import { db } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdminOrAbove } from '../middleware/rbac.js';

const router = express.Router();

router.get('/stats', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    // 1. Total registered members
    const membersCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'member'").get().count;
    const totalUsersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    // 2. Active, inactive, and draft tasks
    const activeTasksCount = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'active'").get().count;
    const inactiveTasksCount = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'inactive'").get().count;
    const draftTasksCount = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'draft'").get().count;
    const totalTasksCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;

    // 3. Pending submissions
    const pendingSubmissionsCount = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'pending'").get().count;

    // 4. Approved and rejected submissions
    const approvedSubmissionsCount = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'approved'").get().count;
    const rejectedSubmissionsCount = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'rejected'").get().count;
    const totalSubmissionsCount = db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;

    // 5. Total points awarded
    const totalPointsResult = db.prepare("SELECT COALESCE(SUM(points), 0) as total FROM point_transactions WHERE type = 'reward'").get();
    const totalPointsAwarded = totalPointsResult.total;

    // 6. Flagged chat messages
    const flaggedMessagesCount = db.prepare('SELECT COUNT(*) as count FROM flagged_messages').get().count;
    const pendingFlaggedMessagesCount = db.prepare("SELECT COUNT(*) as count FROM flagged_messages WHERE status = 'pending'").get().count;

    // 7. Recent administrative activity (audit logs)
    const recentActivity = db.prepare(`
      SELECT a.id, a.user_id, a.action, a.target_type, a.target_id, a.details, a.created_at, u.display_name, u.role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all();

    // Category distribution for tasks
    const categoryStats = db.prepare(`
      SELECT category, COUNT(*) as count FROM tasks GROUP BY category ORDER BY count DESC
    `).all();

    // Submission status distribution
    const submissionsByStatus = {
      pending: pendingSubmissionsCount,
      approved: approvedSubmissionsCount,
      rejected: rejectedSubmissionsCount,
    };

    res.json({
      metrics: {
        totalRegisteredMembers: membersCount,
        totalUsers: totalUsersCount,
        activeTasks: activeTasksCount,
        inactiveTasks: inactiveTasksCount,
        draftTasks: draftTasksCount,
        totalTasks: totalTasksCount,
        pendingSubmissions: pendingSubmissionsCount,
        approvedSubmissions: approvedSubmissionsCount,
        rejectedSubmissions: rejectedSubmissionsCount,
        totalSubmissions: totalSubmissionsCount,
        totalPointsAwarded,
        flaggedChatMessages: flaggedMessagesCount,
        pendingFlaggedChatMessages: pendingFlaggedMessagesCount,
      },
      categoryStats,
      submissionsByStatus,
      recentActivity,
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to retrieve administrative statistics.' });
  }
});

export default router;
