import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'operations.db');

let dbInstance;
try {
  dbInstance = new Database(dbPath);
  // Enable WAL mode for high concurrency & foreign key constraints
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');
  dbInstance.pragma('busy_timeout = 5000');
} catch (err) {
  console.error(`❌ SQLite Database connection failure at "${dbPath}": ${err.message}`);
  throw err;
}

export const db = dbInstance;

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'member')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
      points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
      avatar_url TEXT,
      bio TEXT,
      muted_until TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'member')),
      max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses >= 1),
      uses_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      instructions TEXT NOT NULL,
      category TEXT NOT NULL,
      reward_points INTEGER NOT NULL CHECK (reward_points > 0),
      deadline TEXT,
      submission_requirements TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      content TEXT NOT NULL,
      proof_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      review_comment TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS point_transactions (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      submission_id TEXT,
      points INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('reward', 'adjustment', 'penalty')),
      note TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flagged_messages (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      flagged_by TEXT NOT NULL,
      reason TEXT NOT NULL CHECK (reason IN ('Spam', 'Harassment', 'Inappropriate', 'Off-topic', 'Malicious Link', 'Other')),
      details TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
      reviewed_by TEXT,
      reviewed_at TEXT,
      moderator_notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
      FOREIGN KEY (flagged_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Performance Indices
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
    CREATE INDEX IF NOT EXISTS idx_submissions_task ON submissions(task_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_member ON submissions(member_id);
    CREATE INDEX IF NOT EXISTS idx_point_tx_member ON point_transactions(member_id);
    CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_flagged_status ON flagged_messages(status);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);

  seedDefaultData();
}

function seedDefaultData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  const defaultPassword = 'Password123!';
  const passwordHash = bcrypt.hashSync(defaultPassword, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, role, status, points, bio, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();

  // Seed Users
  insertUser.run('usr-superadmin', 'superadmin@system.local', passwordHash, 'Sarah Jenkins (Super Admin)', 'super_admin', 'active', 1500, 'Principal Systems Architect and Super Admin', daysAgo(90));
  insertUser.run('usr-admin', 'admin@system.local', passwordHash, 'David Chen (Admin)', 'admin', 'active', 850, 'Platform Operations Lead & Task Coordinator', daysAgo(60));
  insertUser.run('usr-mod', 'moderator@system.local', passwordHash, 'Amina Patel (Moderator)', 'moderator', 'active', 450, 'Community Moderator & Safety Reviewer', daysAgo(45));
  insertUser.run('usr-member1', 'alex.rivera@system.local', passwordHash, 'Alex Rivera', 'member', 'active', 320, 'Full-stack enthusiast and quest solver', daysAgo(30));
  insertUser.run('usr-member2', 'jordan.lee@system.local', passwordHash, 'Jordan Lee', 'member', 'active', 180, 'Cybersecurity researcher & bug bounty hunter', daysAgo(20));
  insertUser.run('usr-member3', 'taylor.swift@system.local', passwordHash, 'Taylor Cruz', 'member', 'active', 90, 'Frontend developer working with React and Tailwind', daysAgo(10));
  insertUser.run('usr-member4', 'sam.fisher@system.local', passwordHash, 'Sam Fisher', 'member', 'suspended', 0, 'Account under administrative review for suspicious activity', daysAgo(15));

  // Seed Invitations
  const insertInvite = db.prepare(`
    INSERT INTO invitations (id, code, role, max_uses, uses_count, expires_at, status, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertInvite.run('inv-1', 'QUEST-VIP-2026', 'member', 50, 14, new Date(now.getTime() + 30 * 86400000).toISOString(), 'active', 'usr-superadmin', daysAgo(15));
  insertInvite.run('inv-2', 'MOD-STAFF-ONBOARD', 'moderator', 5, 2, new Date(now.getTime() + 14 * 86400000).toISOString(), 'active', 'usr-superadmin', daysAgo(7));
  insertInvite.run('inv-3', 'DEV-ACCESS-EXPIRED', 'member', 10, 10, daysAgo(2), 'expired', 'usr-admin', daysAgo(30));

  // Seed Tasks
  const insertTask = db.prepare(`
    INSERT INTO tasks (id, title, description, instructions, category, reward_points, deadline, submission_requirements, status, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTask.run(
    'tsk-1',
    'Audit OWASP Top 10 API Security Checklist',
    'Perform a comprehensive security audit on the external authentication microservice and verify JWT validation, rate limiting, and parameter pollution defenses.',
    '1. Inspect API endpoint definitions.\n2. Verify rate-limiting headers.\n3. Validate secret entropy and expiration times.\n4. Submit a detailed findings report with remediation steps.',
    'Security & Audit',
    150,
    new Date(now.getTime() + 14 * 86400000).toISOString(),
    'Detailed markdown report with code snippets, CVSS scoring, and recommended patches.',
    'active',
    'usr-admin',
    daysAgo(12)
  );

  insertTask.run(
    'tsk-2',
    'Implement Accessible Design System Primitives',
    'Ensure all modal dialogs, drawer menus, and dropdowns conform to WCAG 2.1 AA specifications with correct ARIA attributes and focus trapping.',
    'Build keyboard accessible focus traps, ensure contrast ratios exceed 4.5:1, and verify screen reader announcement for live status regions.',
    'Accessibility & UI',
    100,
    new Date(now.getTime() + 7 * 86400000).toISOString(),
    'GitHub PR link or codesandbox showing axe-core test pass with zero violations.',
    'active',
    'usr-admin',
    daysAgo(8)
  );

  insertTask.run(
    'tsk-3',
    'Benchmark SQLite WAL Mode Under Heavy Concurrency',
    'Conduct a stress test measuring read/write throughput using transactional queries and measure lock contention under high multi-threaded load.',
    'Use benchmark suite to simulate 500 concurrent connections submitting point transactions and verify zero database locks or journal corruption.',
    'Backend Performance',
    200,
    new Date(now.getTime() + 21 * 86400000).toISOString(),
    'Benchmark graph, reproducible script, and latency percentiles (p50, p95, p99).',
    'active',
    'usr-superadmin',
    daysAgo(5)
  );

  insertTask.run(
    'tsk-4',
    'Automated Playwright E2E Integration Suite',
    'Draft comprehensive browser-based integration scenarios for submission approval workflows and role-based route guards.',
    'Test edge cases including session timeouts, unauthorized route visits, and rapid double-clicking of approval triggers.',
    'DevOps & QA',
    120,
    daysAgo(1),
    'Playwright test report HTML or video proof of all tests passing.',
    'inactive',
    'usr-admin',
    daysAgo(25)
  );

  insertTask.run(
    'tsk-5',
    'Zero-Knowledge Proof Concept Investigation',
    'Explore integrating lightweight zk-SNARK verifications for anonymous credential checks in member verification.',
    'Draft exploratory whitepaper outlining feasibility, gas/compute costs, and client side proving times.',
    'Research & Cryptography',
    250,
    new Date(now.getTime() + 60 * 86400000).toISOString(),
    'Research document with cryptographic schema diagrams and library comparisons.',
    'draft',
    'usr-superadmin',
    daysAgo(2)
  );

  // Seed Submissions & Point Transactions
  const insertSub = db.prepare(`
    INSERT INTO submissions (id, task_id, member_id, content, proof_url, status, review_comment, reviewed_by, reviewed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPtTx = db.prepare(`
    INSERT INTO point_transactions (id, member_id, submission_id, points, type, note, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Approved Submission for Alex
  insertSub.run(
    'sub-1',
    'tsk-1',
    'usr-member1',
    'Completed the OWASP API audit. Found 2 high severity findings in authorization header parsing and missing rate limits on /api/auth/reset-password.',
    'https://github.com/questline-community/security-audit-alex-2026',
    'approved',
    'Exemplary audit report. Well documented vulnerability vectors and actionable remediation code.',
    'usr-admin',
    daysAgo(6),
    daysAgo(8)
  );
  insertPtTx.run('tx-1', 'usr-member1', 'sub-1', 150, 'reward', 'Approved submission for OWASP API Security Checklist', 'usr-admin', daysAgo(6));

  // Approved Submission for Jordan
  insertSub.run(
    'sub-2',
    'tsk-2',
    'usr-member2',
    'Implemented focus trapping using Radix UI patterns and verified axe DevTools reports zero contrast or keyboard focus errors.',
    'https://github.com/questline-community/ui-a11y-pr-42',
    'approved',
    'Superb keyboard accessibility implementation and comprehensive test coverage.',
    'usr-superadmin',
    daysAgo(3),
    daysAgo(4)
  );
  insertPtTx.run('tx-2', 'usr-member2', 'sub-2', 100, 'reward', 'Approved submission for Accessible Design System Primitives', 'usr-superadmin', daysAgo(3));

  // Pending Submission from Taylor
  insertSub.run(
    'sub-3',
    'tsk-1',
    'usr-member3',
    'Drafted testing procedures for parameter pollution and reviewed all route middleware handlers. Included reproduction curl commands.',
    'https://gist.github.com/taylorcruz/api-audit-notes',
    'pending',
    null,
    null,
    null,
    daysAgo(1)
  );

  // Rejected Submission from Alex
  insertSub.run(
    'sub-4',
    'tsk-3',
    'usr-member1',
    'Ran benchmark with only 5 requests. Could not reproduce any latency spikes.',
    'https://pastebin.com/raw/benchtest',
    'rejected',
    'Insufficient sample size. The task specifically requires testing 500 concurrent connections and latency percentiles.',
    'usr-superadmin',
    daysAgo(2),
    daysAgo(3)
  );

  // Pending Submission from Jordan
  insertSub.run(
    'sub-5',
    'tsk-3',
    'usr-member2',
    'Completed benchmark with 500 concurrent connections over 60 seconds. SQLite WAL handled 14,200 req/sec with p99 latency under 4.2ms.',
    'https://github.com/jordan-security/sqlite-wal-benchmark-2026',
    'pending',
    null,
    null,
    null,
    daysAgo(0)
  );

  // Seed Chat Messages
  const insertChat = db.prepare(`
    INSERT INTO chat_messages (id, sender_id, content, is_pinned, is_deleted, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertChat.run(
    'msg-1',
    'usr-superadmin',
    '🚨 Announcement: Welcome to the Questline Operations Hub. Please review the community safety guidelines and remember that all task submissions are manually verified by team leads.',
    1,
    0,
    daysAgo(14)
  );

  insertChat.run(
    'msg-2',
    'usr-admin',
    'Reminder: New security bounties and backend tasks for the upcoming sprint have been posted in the Task Manager!',
    0,
    0,
    daysAgo(5)
  );

  insertChat.run(
    'msg-3',
    'usr-member1',
    'Hey everyone! Does anyone have advice on testing rate limiting against the proxy server locally?',
    0,
    0,
    daysAgo(3)
  );

  insertChat.run(
    'msg-4',
    'usr-member2',
    'You can use ApacheBench or autocannon: `npx autocannon -c 50 -d 10 http://localhost:5000/api/tasks`',
    0,
    0,
    daysAgo(3)
  );

  insertChat.run(
    'msg-5',
    'usr-member4',
    'FREE CRYPTO AIRDROP CLICK HERE IMMEDIATELY: http://malicious-scam-airdrop.xyz/claim-free-coins',
    0,
    0,
    daysAgo(2)
  );

  insertChat.run(
    'msg-6',
    'usr-member3',
    'Has anyone had a chance to review the accessibility PR #42 yet?',
    0,
    0,
    daysAgo(1)
  );

  // Seed Flagged Messages
  const insertFlag = db.prepare(`
    INSERT INTO flagged_messages (id, message_id, flagged_by, reason, details, status, reviewed_by, reviewed_at, moderator_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertFlag.run(
    'flg-1',
    'msg-5',
    'usr-member1',
    'Malicious Link',
    'Phishing / crypto scam link posted in public chat.',
    'pending',
    null,
    null,
    null,
    daysAgo(2)
  );

  // Seed Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run('aud-1', 'usr-superadmin', 'USER_ROLE_UPDATED', 'user', 'usr-admin', 'Assigned role "admin" to David Chen', '127.0.0.1', daysAgo(60));
  insertAudit.run('aud-2', 'usr-admin', 'TASK_CREATED', 'task', 'tsk-1', 'Created task "Audit OWASP Top 10 API Security Checklist"', '127.0.0.1', daysAgo(12));
  insertAudit.run('aud-3', 'usr-admin', 'SUBMISSION_APPROVED', 'submission', 'sub-1', 'Approved submission for Alex Rivera and credited 150 points', '127.0.0.1', daysAgo(6));
  insertAudit.run('aud-4', 'usr-superadmin', 'USER_SUSPENDED', 'user', 'usr-member4', 'Suspended Sam Fisher due to malicious phishing link post', '127.0.0.1', daysAgo(2));
  insertAudit.run('aud-5', 'usr-admin', 'INVITATION_GENERATED', 'invitation', 'inv-1', 'Created invitation code QUEST-VIP-2026 for 50 uses', '127.0.0.1', daysAgo(15));
}
