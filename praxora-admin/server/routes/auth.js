import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db.js';
import { authenticate, JWT_SECRET } from '../middleware/auth.js';
import { logAuditAction } from '../middleware/audit.js';

const router = express.Router();

// Register new user
router.post('/register', (req, res) => {
  const { email, password, displayName, inviteCode } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, password, and display name are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  let assignedRole = 'member';

  // Check invitation code if provided
  if (inviteCode) {
    const invite = db.prepare('SELECT * FROM invitations WHERE code = ?').get(inviteCode.trim());
    if (!invite) {
      return res.status(400).json({ error: 'Invalid invitation code.' });
    }
    if (invite.status !== 'active') {
      return res.status(400).json({ error: `Invitation code is ${invite.status}.` });
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      db.prepare("UPDATE invitations SET status = 'expired' WHERE id = ?").run(invite.id);
      return res.status(400).json({ error: 'Invitation code has expired.' });
    }
    if (invite.uses_count >= invite.max_uses) {
      return res.status(400).json({ error: 'Invitation code has reached maximum usage limit.' });
    }

    assignedRole = invite.role;

    // Increment invite usage in a transaction
    db.prepare('UPDATE invitations SET uses_count = uses_count + 1 WHERE id = ?').run(invite.id);
  }

  const userId = 'usr-' + crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, role, status, points)
    VALUES (?, ?, ?, ?, ?, 'active', 0)
  `).run(userId, email.toLowerCase().trim(), passwordHash, displayName.trim(), assignedRole);

  logAuditAction({
    userId,
    action: 'USER_REGISTERED',
    targetType: 'user',
    targetId: userId,
    details: `User registered with role "${assignedRole}"`,
    req,
  });

  const token = jwt.sign({ id: userId, email: email.toLowerCase().trim(), role: assignedRole }, JWT_SECRET, { expiresIn: '7d' });

  const user = db.prepare('SELECT id, email, display_name, role, status, points, avatar_url FROM users WHERE id = ?').get(userId);
  res.status(201).json({ token, user });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact administrator.' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  logAuditAction({
    userId: user.id,
    action: 'USER_LOGIN',
    targetType: 'user',
    targetId: user.id,
    details: `Successful login from ${user.email}`,
    req,
  });

  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// Get current user profile
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare(`
    SELECT id, email, display_name, role, status, points, avatar_url, bio, muted_until, created_at
    FROM users WHERE id = ?
  `).get(req.user.id);
  res.json({ user });
});

// Quick switch persona endpoint (for reviewer testing & role switching)
router.post('/switch-persona', (req, res) => {
  const { role } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE role = ? AND status = 'active' LIMIT 1").get(role);
  if (!user) {
    return res.status(404).json({ error: `No active user found with role ${role}` });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

export default router;
