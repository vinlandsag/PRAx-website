-- ============================================================================
-- PRAX Platform Seed Data (PostgreSQL 16 / Supabase)
-- Initial fixtures matching MVP specification & development accounts
-- ============================================================================

-- 1. Pre-seeded Users
INSERT INTO users (
  id,
  email,
  password_hash,
  name,
  role,
  status,
  avatar_url,
  headline,
  bio,
  skills,
  currently_building
) VALUES 
(
  'usr_admin_01',
  'admin@prax.build',
  '5062a3705e7f50ed8c346484dde298f3:f9c641b18b37b21b00f9a4d0eea832c8ae52ec9a1703694830bbced0a98b8decb0cac0e7c3d7178fdf4cb1b3826270dbaa45cea880c8715f056c301037ac31ab',
  'Admin User',
  'ADMIN',
  'APPROVED',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'Platform Architect & Review Lead',
  'Leading the PRAX engineering platform and rubric governance.',
  ARRAY['System Architecture', 'Security', 'TypeScript', 'PostgreSQL'],
  'PRAX Engine v1.0'
),
(
  'usr_member_01',
  'member@prax.build',
  'd4c780cffe757cd1565f09ea93432a82:32e80038621f54a81a9d409509b680ed15c52c393b4234b6accda54da977a298fd803e1cfe6e27b3d8759f314815484561604d2f6f2c30ff1bc55d53984c9c06',
  'Arjun Varma',
  'MEMBER',
  'APPROVED',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'Full-Stack Craftsman & Distributed Systems Enthusiast',
  'Building reliable web services and high-performance user interfaces.',
  ARRAY['TypeScript', 'React', 'Next.js', 'PostgreSQL', 'Node.js', 'Tailwind CSS'],
  'Realtime workspace synchronization'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- 2. Initial Active Invite Code
INSERT INTO invite_codes (
  id,
  code,
  status,
  max_uses,
  used_count,
  created_by_id
) VALUES (
  'inv_init_admin_01',
  'PRAX-INIT-ADMIN',
  'ACTIVE',
  10,
  0,
  'usr_admin_01'
)
ON CONFLICT (code) DO NOTHING;

-- 3. Default Scoring Rubric (v1)
INSERT INTO rubrics (
  id,
  version,
  title,
  criteria,
  max_points,
  updated_by_id
) VALUES (
  'active',
  'v1',
  'PRAX Engineering Excellence Rubric',
  '[
    {"id": "crit_1", "title": "Code Quality & Idiomatic Style", "description": "Clean, typed, idiomatic code adhering to project conventions and zero lint warnings", "maxPoints": 25},
    {"id": "crit_2", "title": "Functionality & Acceptance Criteria", "description": "All specified acceptance criteria met without regressions or edge case bugs", "maxPoints": 30},
    {"id": "crit_3", "title": "Performance & Architecture", "description": "Efficient queries, minimal render overhead, zero blocking operations", "maxPoints": 20},
    {"id": "crit_4", "title": "Testing & Verification", "description": "Comprehensive unit/integration tests with high coverage of critical paths", "maxPoints": 15},
    {"id": "crit_5", "title": "UX Polish & Accessibility", "description": "WAI-ARIA compliance, responsive design, keyboard navigable, clear loading states", "maxPoints": 10}
  ]'::jsonb,
  100,
  'usr_admin_01'
)
ON CONFLICT (id) DO UPDATE SET
  version = EXCLUDED.version,
  title = EXCLUDED.title,
  criteria = EXCLUDED.criteria,
  max_points = EXCLUDED.max_points;

INSERT INTO rubric_versions (
  id,
  version,
  title,
  criteria,
  max_points,
  created_by_id
) VALUES (
  'rbv_v1',
  'v1',
  'PRAX Engineering Excellence Rubric',
  '[
    {"id": "crit_1", "title": "Code Quality & Idiomatic Style", "description": "Clean, typed, idiomatic code adhering to project conventions and zero lint warnings", "maxPoints": 25},
    {"id": "crit_2", "title": "Functionality & Acceptance Criteria", "description": "All specified acceptance criteria met without regressions or edge case bugs", "maxPoints": 30},
    {"id": "crit_3", "title": "Performance & Architecture", "description": "Efficient queries, minimal render overhead, zero blocking operations", "maxPoints": 20},
    {"id": "crit_4", "title": "Testing & Verification", "description": "Comprehensive unit/integration tests with high coverage of critical paths", "maxPoints": 15},
    {"id": "crit_5", "title": "UX Polish & Accessibility", "description": "WAI-ARIA compliance, responsive design, keyboard navigable, clear loading states", "maxPoints": 10}
  ]'::jsonb,
  100,
  'usr_admin_01'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Task Catalog
INSERT INTO tasks (
  id,
  title,
  description,
  category,
  difficulty,
  max_points,
  rules,
  is_active,
  created_by_id
) VALUES 
(
  'task_sql_opt',
  'Optimise one slow SQL query',
  'Profile and add appropriate composite indexes to eliminate table scans on large tables. Submit EXPLAIN ANALYZE proof.',
  'Backend',
  'INTERMEDIATE',
  35,
  ARRAY['Provide EXPLAIN ANALYZE comparison before/after', 'No breaking schema changes', 'Target execution time < 10ms'],
  TRUE,
  'usr_admin_01'
),
(
  'task_nav_bar',
  'Build responsive navigation bar',
  'Create accessible navigation bar conforming to PDF reference design with mobile drawer and keyboard trap management.',
  'Frontend',
  'BEGINNER',
  25,
  ARRAY['WAI-ARIA dialog and disclosure patterns', 'Pixel-perfect match to Figma design tokens', '100% mobile test coverage'],
  TRUE,
  'usr_admin_01'
),
(
  'task_design_system',
  'Design dark navy design tokens',
  'Establish Tailwind theme variables and CSS custom properties for dark navy theme, state badges, and typography scales.',
  'Design',
  'INTERMEDIATE',
  30,
  ARRAY['Zero hardcoded hex values', 'Consistent contrast ratio >= 4.5:1', 'Documented in DESIGN_SYSTEM.md'],
  TRUE,
  'usr_admin_01'
),
(
  'task_auth_flow',
  'Implement secure auth state machine',
  'Develop server-authoritative state transitions, rate limiters, and tamper-proof session cookies for user onboarding.',
  'Backend',
  'ADVANCED',
  50,
  ARRAY['Zero trust client tokens', 'Constant-time crypto comparisons', 'Self-action block and audit trail'],
  TRUE,
  'usr_admin_01'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Initial Chat Channels
INSERT INTO channels (
  id,
  name,
  description,
  is_private
) VALUES 
(
  'chn_general',
  'general',
  'General platform announcements and team discussion',
  FALSE
),
(
  'chn_dev',
  'dev-chat',
  'Engineering, PR reviews, architecture debates and questions',
  FALSE
),
(
  'chn_random',
  'random',
  'Off-topic, memes, and daily coffee banter',
  FALSE
)
ON CONFLICT (id) DO NOTHING;

-- 6. Pre-seeded Welcome Chat Message
INSERT INTO messages (
  id,
  channel_id,
  user_id,
  content
) VALUES (
  'msg_welcome_01',
  'chn_general',
  'usr_admin_01',
  'Welcome to PRAX! Complete tasks, submit your pull requests, and earn points and streaks on the leaderboard.'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Pre-seeded Member Points & Streak
INSERT INTO point_transactions (
  id,
  user_id,
  amount,
  reason,
  idempotency_key,
  admin_id
) VALUES (
  'ptx_init_member_01',
  'usr_member_01',
  85,
  'Initial engineering excellence onboarding bonus',
  'init_bonus_usr_member_01',
  'usr_admin_01'
)
ON CONFLICT (idempotency_key) DO NOTHING;

INSERT INTO streaks (
  id,
  user_id,
  current_streak,
  longest_streak,
  last_activity_date
) VALUES (
  'stk_member_01',
  'usr_member_01',
  5,
  12,
  CURRENT_DATE
)
ON CONFLICT (user_id) DO UPDATE SET
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak;

-- 8. Personal Space for Arjun
INSERT INTO personal_space_pages (
  id,
  user_id,
  title,
  content
) VALUES (
  'psp_member_01',
  'usr_member_01',
  'Arjun''s Engineering Workspace',
  '# Focus Areas\n\n- [x] Query optimization benchmarks\n- [ ] Realtime workspace synchronization\n- [ ] Database replication setup\n'
)
ON CONFLICT (user_id) DO NOTHING;
