import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdminOrAbove } from '../middleware/rbac.js';
import { logAuditAction } from '../middleware/audit.js';

const router = express.Router();

// Get submissions list
// Members see only their own submissions; Admins/SuperAdmins see all with filters
router.get('/', authenticate, (req, res) => {
  try {
    const {
      status = '',
      taskId = '',
      memberId = '',
      page = 1,
      limit = 10,
    } = req.query;

    const isAdmin = ['super_admin', 'admin'].includes(req.user.role);

    let query = `
      SELECT s.*,
             t.title as task_title,
             t.category as task_category,
             t.reward_points as task_reward_points,
             t.deadline as task_deadline,
             m.display_name as member_name,
             m.email as member_email,
             m.points as member_total_points,
             r.display_name as reviewer_name
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      JOIN users m ON s.member_id = m.id
      LEFT JOIN users r ON s.reviewed_by = r.id
      WHERE 1=1
    `;

    const params = [];

    if (!isAdmin) {
      query += ' AND s.member_id = ?';
      params.push(req.user.id);
    } else {
      if (memberId) {
        query += ' AND s.member_id = ?';
        params.push(memberId);
      }
    }

    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    if (taskId) {
      query += ' AND s.task_id = ?';
      params.push(taskId);
    }

    const countSql = `SELECT COUNT(*) as total FROM (${query})`;
    const countResult = db.prepare(countSql).get(...params);
    const total = countResult ? countResult.total : 0;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const submissions = db.prepare(query).all(...params);

    res.json({
      submissions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ error: 'Failed to retrieve submissions.' });
  }
});

// Get single submission details
router.get('/:id', authenticate, (req, res) => {
  try {
    const submission = db.prepare(`
      SELECT s.*,
             t.title as task_title,
             t.description as task_description,
             t.instructions as task_instructions,
             t.submission_requirements as task_requirements,
             t.reward_points as task_reward_points,
             t.deadline as task_deadline,
             m.display_name as member_name,
             m.email as member_email,
             m.points as member_total_points,
             r.display_name as reviewer_name
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      JOIN users m ON s.member_id = m.id
      LEFT JOIN users r ON s.reviewed_by = r.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const isAdmin = ['super_admin', 'admin'].includes(req.user.role);
    if (!isAdmin && submission.member_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this submission.' });
    }

    // Also fetch point transaction if approved
    const pointTransaction = db.prepare(`
      SELECT * FROM point_transactions WHERE submission_id = ?
    `).get(submission.id);

    res.json({ submission, pointTransaction });
  } catch (err) {
    console.error('Error fetching submission details:', err);
    res.status(500).json({ error: 'Failed to retrieve submission details.' });
  }
});

// Member submits work for a task
router.post('/task/:taskId/submit', authenticate, (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, proofUrl } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Submission work or description cannot be empty.' });
    }

    // Verify task exists and is active
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    if (task.status !== 'active') {
      return res.status(400).json({ error: `Cannot submit to task with status "${task.status}". Task must be active.` });
    }

    // Check if task deadline has passed
    if (task.deadline && new Date(task.deadline) < new Date()) {
      return res.status(400).json({ error: 'Task deadline has already passed. Submissions are closed.' });
    }

    // Check for existing pending submission
    const existingPending = db.prepare(`
      SELECT id FROM submissions WHERE task_id = ? AND member_id = ? AND status = 'pending'
    `).get(task.id, req.user.id);

    if (existingPending) {
      return res.status(400).json({ error: 'You already have a pending submission for this task under review.' });
    }

    // Check for existing approved submission (already completed)
    const existingApproved = db.prepare(`
      SELECT id FROM submissions WHERE task_id = ? AND member_id = ? AND status = 'approved'
    `).get(task.id, req.user.id);

    if (existingApproved) {
      return res.status(400).json({ error: 'You have already completed and received points for this task.' });
    }

    const submissionId = 'sub-' + crypto.randomUUID();

    db.prepare(`
      INSERT INTO submissions (id, task_id, member_id, content, proof_url, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      submissionId,
      task.id,
      req.user.id,
      content.trim(),
      proofUrl ? proofUrl.trim() : null
    );

    logAuditAction({
      userId: req.user.id,
      action: 'TASK_SUBMITTED',
      targetType: 'submission',
      targetId: submissionId,
      details: `Submitted work for task "${task.title}"`,
      req,
    });

    const createdSubmission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId);
    res.status(201).json({ submission: createdSubmission, message: 'Work submitted successfully for review.' });
  } catch (err) {
    console.error('Error creating submission:', err);
    res.status(500).json({ error: 'Failed to submit work.' });
  }
});

// Admin Review Submission (Approve or Reject with Atomic Point Award)
// CRITICAL BUSINESS RULES IMPLEMENTATION:
// 1. Award points only when submission is validly approved.
// 2. Never award points twice for the same approval.
// 3. Point-awarding operations are ATOMIC and safe against concurrent requests.
// 4. Auditable record of point transactions.
router.post('/:id/review', authenticate, requireAdminOrAbove, (req, res) => {
  const { action, reviewComment } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid review action. Must be "approve" or "reject".' });
  }

  if (action === 'reject' && (!reviewComment || !reviewComment.trim())) {
    return res.status(400).json({ error: 'A review comment / reason is required when rejecting a submission.' });
  }

  // ATOMIC DATABASE TRANSACTION
  const reviewTransaction = db.transaction(() => {
    // 1. Lock and fetch current submission state
    const submission = db.prepare(`
      SELECT s.*, t.title as task_title, t.reward_points, m.display_name as member_name, m.points as current_points
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      JOIN users m ON s.member_id = m.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!submission) {
      throw new Error('NOT_FOUND: Submission not found.');
    }

    if (submission.status === 'approved') {
      throw new Error('ALREADY_APPROVED: Submission has already been approved and points have already been credited.');
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const pointsToAward = action === 'approve' ? submission.reward_points : 0;
    const comment = reviewComment ? reviewComment.trim() : (action === 'approve' ? 'Approved by reviewer.' : 'Rejected.');

    // 2. Update submission record
    db.prepare(`
      UPDATE submissions
      SET status = ?, review_comment = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, comment, req.user.id, submission.id);

    // 3. If approved, atomically credit member points and record in point_transactions
    let txId = null;
    let updatedPoints = submission.current_points;

    if (action === 'approve') {
      // Double check if a point transaction already exists for this submission to guarantee idempotency
      const existingTx = db.prepare('SELECT id FROM point_transactions WHERE submission_id = ?').get(submission.id);
      if (existingTx) {
        throw new Error('DUPLICATE_POINTS: Points transaction already exists for this submission.');
      }

      txId = 'tx-' + crypto.randomUUID();

      // Add to point ledger
      db.prepare(`
        INSERT INTO point_transactions (id, member_id, submission_id, points, type, note, created_by, created_at)
        VALUES (?, ?, ?, ?, 'reward', ?, ?, CURRENT_TIMESTAMP)
      `).run(
        txId,
        submission.member_id,
        submission.id,
        pointsToAward,
        `Approved submission for "${submission.task_title}"`,
        req.user.id
      );

      // Increment member's total points atomically
      db.prepare(`
        UPDATE users
        SET points = points + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(pointsToAward, submission.member_id);

      updatedPoints += pointsToAward;
    }

    // 4. Audit Log inside transaction
    logAuditAction({
      userId: req.user.id,
      action: action === 'approve' ? 'SUBMISSION_APPROVED' : 'SUBMISSION_REJECTED',
      targetType: 'submission',
      targetId: submission.id,
      details: `${action === 'approve' ? 'Approved' : 'Rejected'} submission for "${submission.task_title}" by ${submission.member_name}. Points awarded: ${pointsToAward}.`,
      req,
    });

    return {
      submissionId: submission.id,
      status: newStatus,
      reviewComment: comment,
      pointsAwarded: pointsToAward,
      memberNewTotalPoints: updatedPoints,
      transactionId: txId,
    };
  });

  try {
    const result = reviewTransaction();
    res.json({
      message: `Submission successfully ${result.status}.`,
      ...result,
    });
  } catch (err) {
    if (err.message.startsWith('NOT_FOUND:')) {
      return res.status(404).json({ error: err.message.replace('NOT_FOUND: ', '') });
    }
    if (err.message.startsWith('ALREADY_APPROVED:') || err.message.startsWith('DUPLICATE_POINTS:')) {
      return res.status(409).json({ error: err.message.split(': ')[1] });
    }
    console.error('Error executing submission review transaction:', err);
    res.status(500).json({ error: 'Failed to process submission review transaction.' });
  }
});

export default router;
