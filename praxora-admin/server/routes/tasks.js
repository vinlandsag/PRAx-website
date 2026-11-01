import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdminOrAbove } from '../middleware/rbac.js';
import { logAuditAction } from '../middleware/audit.js';

const router = express.Router();

// Get tasks list (with search, filter, sort, pagination)
router.get('/', authenticate, (req, res) => {
  try {
    const {
      search = '',
      status = '',
      category = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const isAdmin = ['super_admin', 'admin'].includes(req.user.role);

    let baseQuery = `
      SELECT t.*,
             u.display_name as creator_name,
             (SELECT COUNT(*) FROM submissions s WHERE s.task_id = t.id) as total_submissions,
             (SELECT COUNT(*) FROM submissions s WHERE s.task_id = t.id AND s.status = 'pending') as pending_submissions,
             (SELECT COUNT(*) FROM submissions s WHERE s.task_id = t.id AND s.status = 'approved') as approved_submissions,
             (SELECT COUNT(*) FROM submissions s WHERE s.task_id = t.id AND s.status = 'rejected') as rejected_submissions
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;

    const params = [];

    // Members can only see active tasks
    if (!isAdmin) {
      baseQuery += " AND t.status = 'active'";
    } else if (status) {
      baseQuery += ' AND t.status = ?';
      params.push(status);
    }

    if (category) {
      baseQuery += ' AND t.category = ?';
      params.push(category);
    }

    if (search) {
      baseQuery += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.instructions LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    // Total count for pagination
    const countSql = `SELECT COUNT(*) as total FROM (${baseQuery})`;
    const countResult = db.prepare(countSql).get(...params);
    const total = countResult ? countResult.total : 0;

    // Sorting whitelist to prevent SQL injection
    const allowedSortFields = ['created_at', 'reward_points', 'deadline', 'title', 'status'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    baseQuery += ` ORDER BY t.${validSortBy} ${validSortOrder} LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const tasks = db.prepare(baseQuery).all(...params);

    // Also get all distinct categories for filter dropdown
    const categories = db.prepare('SELECT DISTINCT category FROM tasks ORDER BY category ASC').all().map(c => c.category);

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      categories,
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
});

// Get single task by ID (preview or edit)
router.get('/:id', authenticate, (req, res) => {
  try {
    const task = db.prepare(`
      SELECT t.*,
             u.display_name as creator_name,
             (SELECT COUNT(*) FROM submissions s WHERE s.task_id = t.id) as total_submissions,
             (SELECT COUNT(*) FROM submissions s WHERE s.task_id = t.id AND s.status = 'pending') as pending_submissions,
             (SELECT COUNT(*) FROM submissions s WHERE s.task_id = t.id AND s.status = 'approved') as approved_submissions,
             (SELECT COUNT(*) FROM submissions s WHERE s.task_id = t.id AND s.status = 'rejected') as rejected_submissions
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const isAdmin = ['super_admin', 'admin'].includes(req.user.role);
    if (!isAdmin && task.status !== 'active') {
      return res.status(403).json({ error: 'This task is not currently available for members.' });
    }

    // Check if current user has already submitted for this task
    let userSubmission = null;
    if (req.user.role === 'member') {
      userSubmission = db.prepare('SELECT * FROM submissions WHERE task_id = ? AND member_id = ? ORDER BY created_at DESC LIMIT 1').get(task.id, req.user.id);
    }

    res.json({ task, userSubmission });
  } catch (err) {
    console.error('Error fetching task details:', err);
    res.status(500).json({ error: 'Failed to retrieve task details.' });
  }
});

// Create new task (Admin or Super Admin only)
router.post('/', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    const { title, description, instructions, category, reward_points, deadline, submission_requirements, status = 'draft' } = req.body;

    // Strict validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Task description is required.' });
    }
    if (!instructions || !instructions.trim()) {
      return res.status(400).json({ error: 'Instructions are required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Category is required.' });
    }
    if (!submission_requirements || !submission_requirements.trim()) {
      return res.status(400).json({ error: 'Submission requirements are required.' });
    }

    const pointsNum = parseInt(reward_points, 10);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      return res.status(400).json({ error: 'Reward points must be a positive integer greater than zero.' });
    }

    if (!['draft', 'active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be one of: draft, active, inactive.' });
    }

    const taskId = 'tsk-' + crypto.randomUUID();

    db.prepare(`
      INSERT INTO tasks (id, title, description, instructions, category, reward_points, deadline, submission_requirements, status, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      taskId,
      title.trim(),
      description.trim(),
      instructions.trim(),
      category.trim(),
      pointsNum,
      deadline || null,
      submission_requirements.trim(),
      status,
      req.user.id
    );

    logAuditAction({
      userId: req.user.id,
      action: 'TASK_CREATED',
      targetType: 'task',
      targetId: taskId,
      details: `Created task "${title.trim()}" (${pointsNum} pts, status: ${status})`,
      req,
    });

    const createdTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    res.status(201).json({ task: createdTask, message: 'Task created successfully.' });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// Update task (Admin or Super Admin only)
router.put('/:id', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const { title, description, instructions, category, reward_points, deadline, submission_requirements, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Task description is required.' });
    }
    if (!instructions || !instructions.trim()) {
      return res.status(400).json({ error: 'Instructions are required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Category is required.' });
    }
    if (!submission_requirements || !submission_requirements.trim()) {
      return res.status(400).json({ error: 'Submission requirements are required.' });
    }

    const pointsNum = parseInt(reward_points, 10);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      return res.status(400).json({ error: 'Reward points must be a positive integer greater than zero.' });
    }

    const validStatus = ['draft', 'active', 'inactive'].includes(status) ? status : task.status;

    db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, instructions = ?, category = ?, reward_points = ?, deadline = ?, submission_requirements = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title.trim(),
      description.trim(),
      instructions.trim(),
      category.trim(),
      pointsNum,
      deadline || null,
      submission_requirements.trim(),
      validStatus,
      task.id
    );

    logAuditAction({
      userId: req.user.id,
      action: 'TASK_UPDATED',
      targetType: 'task',
      targetId: task.id,
      details: `Updated task "${title.trim()}"`,
      req,
    });

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
    res.json({ task: updatedTask, message: 'Task updated successfully.' });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// Duplicate task (Admin or Super Admin only)
// CRITICAL: Ensures duplicating a task does NOT duplicate submissions or award points!
router.post('/:id/duplicate', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task to duplicate not found.' });
    }

    const newTaskId = 'tsk-' + crypto.randomUUID();
    const newTitle = `${task.title} (Copy)`;

    db.prepare(`
      INSERT INTO tasks (id, title, description, instructions, category, reward_points, deadline, submission_requirements, status, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      newTaskId,
      newTitle,
      task.description,
      task.instructions,
      task.category,
      task.reward_points,
      task.deadline,
      task.submission_requirements,
      req.user.id
    );

    logAuditAction({
      userId: req.user.id,
      action: 'TASK_DUPLICATED',
      targetType: 'task',
      targetId: newTaskId,
      details: `Duplicated from "${task.title}" (ID: ${task.id})`,
      req,
    });

    const duplicatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(newTaskId);
    res.status(201).json({ task: duplicatedTask, message: 'Task duplicated successfully as Draft.' });
  } catch (err) {
    console.error('Error duplicating task:', err);
    res.status(500).json({ error: 'Failed to duplicate task.' });
  }
});

// Toggle status: activate, deactivate, or draft (Admin or Super Admin)
router.patch('/:id/status', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'draft'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active, inactive, or draft.' });
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, task.id);

    logAuditAction({
      userId: req.user.id,
      action: 'TASK_STATUS_CHANGED',
      targetType: 'task',
      targetId: task.id,
      details: `Changed status from "${task.status}" to "${status}" for "${task.title}"`,
      req,
    });

    res.json({ message: `Task status updated to ${status}.`, status });
  } catch (err) {
    console.error('Error changing task status:', err);
    res.status(500).json({ error: 'Failed to change task status.' });
  }
});

// Delete task (Admin or Super Admin)
router.delete('/:id', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Delete task (cascade will remove submissions, but let's audit)
    db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);

    logAuditAction({
      userId: req.user.id,
      action: 'TASK_DELETED',
      targetType: 'task',
      targetId: task.id,
      details: `Deleted task "${task.title}"`,
      req,
    });

    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

export default router;
