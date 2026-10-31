import express from 'express';
import { db } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdminOrAbove } from '../middleware/rbac.js';
import { scrubSensitiveData } from '../middleware/audit.js';

const router = express.Router();

router.get('/', authenticate, requireAdminOrAbove, (req, res) => {
  try {
    const {
      search = '',
      action = '',
      targetType = '',
      page = 1,
      limit = 20,
    } = req.query;

    let query = `
      SELECT a.*, u.display_name as user_name, u.role as user_role, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ' AND (a.details LIKE ? OR a.action LIKE ? OR u.display_name LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    if (action) {
      query += ' AND a.action = ?';
      params.push(action);
    }

    if (targetType) {
      query += ' AND a.target_type = ?';
      params.push(targetType);
    }

    const countSql = `SELECT COUNT(*) as total FROM (${query})`;
    const countResult = db.prepare(countSql).get(...params);
    const total = countResult ? countResult.total : 0;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const logs = db.prepare(query).all(...params);
    const sanitizedLogs = logs.map(log => ({
      ...log,
      details: scrubSensitiveData(log.details),
    }));

    const distinctActions = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action ASC').all().map(r => r.action);

    res.json({
      logs: sanitizedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      distinctActions,
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

export default router;
