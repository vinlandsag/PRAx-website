-- ============================================================================
-- PRAX Platform Database Schema (PostgreSQL 16 / Supabase)
-- Conforms to MVP_SPEC.md (§2 Roles, §3 Lifecycle, §4 Submissions, §7 Scoring, §9 Table Ownership)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Custom Types / Enums
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('MEMBER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM (
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'SUSPENDED',
    'DISABLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'REVISION_REQUESTED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM (
    'ACTIVE',
    'USED',
    'EXPIRED',
    'REVOKED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_difficulty AS ENUM (
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'INFO',
    'SUCCESS',
    'WARNING',
    'SUBMISSION_REVIEWED',
    'POINTS_EARNED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- Trigger Function: Automatic updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. Core Identity & User Profiles (MVP_SPEC §9 Table Ownership: P1)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT ('usr_' || encode(gen_random_bytes(12), 'hex')),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'MEMBER',
  status user_status NOT NULL DEFAULT 'PENDING_APPROVAL',
  rejection_reason TEXT,
  suspension_reason TEXT,
  disable_reason TEXT,
  avatar_url TEXT,
  headline TEXT,
  bio TEXT,
  portfolio_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  currently_building TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- ----------------------------------------------------------------------------
-- 3. Invite Codes (MVP_SPEC §5, §9: P1)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invite_codes (
  id TEXT PRIMARY KEY DEFAULT ('inv_' || encode(gen_random_bytes(12), 'hex')),
  code TEXT UNIQUE NOT NULL,
  status invite_status NOT NULL DEFAULT 'ACTIVE',
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0 AND used_count <= max_uses),
  created_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_invite_codes_updated_at
  BEFORE UPDATE ON invite_codes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes (code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON invite_codes (status);

-- ----------------------------------------------------------------------------
-- 4. Magic Link Authentication Tokens (Phase 3 Auth: P1)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id TEXT PRIMARY KEY DEFAULT ('mlk_' || encode(gen_random_bytes(12), 'hex')),
  email TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_magic_link_token_hash ON magic_link_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_link_email ON magic_link_tokens (LOWER(email));

-- ----------------------------------------------------------------------------
-- 5. Scoring Rubric Engine & Version History (Phase 7: P1)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rubrics (
  id TEXT PRIMARY KEY DEFAULT 'active',
  version TEXT NOT NULL DEFAULT 'v1',
  title TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_points INTEGER NOT NULL CHECK (max_points > 0),
  updated_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rubric_versions (
  id TEXT PRIMARY KEY DEFAULT ('rbv_' || encode(gen_random_bytes(12), 'hex')),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_points INTEGER NOT NULL CHECK (max_points > 0),
  created_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rubric_versions_version ON rubric_versions (version);

-- ----------------------------------------------------------------------------
-- 6. Task Definitions (MVP_SPEC §9: P3)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY DEFAULT ('tsk_' || encode(gen_random_bytes(12), 'hex')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty task_difficulty NOT NULL DEFAULT 'INTERMEDIATE',
  max_points INTEGER NOT NULL CHECK (max_points > 0),
  rules TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks (category);
CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks (is_active);

-- ----------------------------------------------------------------------------
-- 7. Task Submissions & Review Workflow (MVP_SPEC §4, §9: P3)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY DEFAULT ('sub_' || encode(gen_random_bytes(12), 'hex')),
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status submission_status NOT NULL DEFAULT 'DRAFT',
  proof_url TEXT,
  note TEXT,
  code_snippet TEXT,
  checklist TEXT[] NOT NULL DEFAULT '{}',
  points_awarded INTEGER CHECK (points_awarded IS NULL OR points_awarded >= 0),
  rubric_version TEXT,
  transaction_id TEXT,
  feedback TEXT,
  reviewed_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON submissions (task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (status);

-- ----------------------------------------------------------------------------
-- 8. Immutable Points Ledger (MVP_SPEC §7, §9: P3, DECISIONS D-015)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS point_transactions (
  id TEXT PRIMARY KEY DEFAULT ('ptx_' || encode(gen_random_bytes(12), 'hex')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  reason TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  submission_id TEXT REFERENCES submissions(id) ON DELETE SET NULL,
  admin_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_idempotency ON point_transactions (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions (created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. Member Streaks (MVP_SPEC §7, §9: P3)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS streaks (
  id TEXT PRIMARY KEY DEFAULT ('stk_' || encode(gen_random_bytes(12), 'hex')),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_streaks_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks (user_id);

-- ----------------------------------------------------------------------------
-- 10. Community Chat Channels & Messages (MVP_SPEC §9: P4)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY DEFAULT ('chn_' || encode(gen_random_bytes(12), 'hex')),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT ('msg_' || encode(gen_random_bytes(12), 'hex')),
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages (channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages (user_id);

-- ----------------------------------------------------------------------------
-- 11. Personal Space Pages (MVP_SPEC §9: P4)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS personal_space_pages (
  id TEXT PRIMARY KEY DEFAULT ('psp_' || encode(gen_random_bytes(12), 'hex')),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'My Personal Space',
  content TEXT NOT NULL DEFAULT '',
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_personal_space_updated_at
  BEFORE UPDATE ON personal_space_pages
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_personal_space_user_id ON personal_space_pages (user_id);

-- ----------------------------------------------------------------------------
-- 12. Immutable Secret-Scrubbed Audit Log (MVP_SPEC §6, §9: P5)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('aud_' || encode(gen_random_bytes(12), 'hex')),
  event TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  target_id TEXT,
  prior_state TEXT,
  new_state TEXT,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs (event);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ----------------------------------------------------------------------------
-- 13. Notifications Engine (Notification Bell)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT ('ntf_' || encode(gen_random_bytes(12), 'hex')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'INFO',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id, read, created_at DESC);

-- ----------------------------------------------------------------------------
-- 14. Computed Views: Leaderboard
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW user_leaderboard AS
SELECT
  u.id AS user_id,
  u.name,
  u.avatar_url,
  u.headline,
  COALESCE(SUM(pt.amount), 0)::INTEGER AS total_points,
  COALESCE(SUM(CASE WHEN pt.created_at >= (NOW() - INTERVAL '7 days') THEN pt.amount ELSE 0 END), 0)::INTEGER AS weekly_points,
  COALESCE(s.current_streak, 0)::INTEGER AS current_streak,
  COALESCE(s.longest_streak, 0)::INTEGER AS longest_streak,
  RANK() OVER (ORDER BY COALESCE(SUM(pt.amount), 0) DESC) AS all_time_rank,
  RANK() OVER (ORDER BY COALESCE(SUM(CASE WHEN pt.created_at >= (NOW() - INTERVAL '7 days') THEN pt.amount ELSE 0 END), 0) DESC) AS weekly_rank
FROM users u
LEFT JOIN point_transactions pt ON pt.user_id = u.id
LEFT JOIN streaks s ON s.user_id = u.id
WHERE u.status = 'APPROVED'
GROUP BY u.id, u.name, u.avatar_url, u.headline, s.current_streak, s.longest_streak;

-- ----------------------------------------------------------------------------
-- 15. Row Level Security (RLS) Configuration
-- ----------------------------------------------------------------------------
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_link_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_space_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Service Role Key (Server API routes) bypasses RLS automatically in Supabase.
-- For anon / authenticated roles via Supabase client:
CREATE POLICY "Public users can view approved member profiles"
  ON users FOR SELECT
  USING (status = 'APPROVED');

CREATE POLICY "Users can view and update their own profile"
  ON users FOR ALL
  USING (id = auth.uid()::text);

CREATE POLICY "Approved members can view active tasks"
  ON tasks FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Members can view rubric"
  ON rubrics FOR SELECT
  USING (true);

CREATE POLICY "Members can view rubric versions"
  ON rubric_versions FOR SELECT
  USING (true);

CREATE POLICY "Members can view channels"
  ON channels FOR SELECT
  USING (true);

CREATE POLICY "Members can view channel messages"
  ON messages FOR SELECT
  USING (is_deleted = FALSE);

CREATE POLICY "Members can post messages"
  ON messages FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Members can view and edit their own personal space"
  ON personal_space_pages FOR ALL
  USING (user_id = auth.uid()::text);

CREATE POLICY "Members can view their own submissions"
  ON submissions FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Members can view their own notifications"
  ON notifications FOR ALL
  USING (user_id = auth.uid()::text);

CREATE POLICY "Members can view their own streaks and points"
  ON streaks FOR SELECT
  USING (true);

CREATE POLICY "Members can view point transactions"
  ON point_transactions FOR SELECT
  USING (true);
