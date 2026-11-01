# Database and operations handoff

## Current state (2026-11-01)

Supabase hosts PostgreSQL. Prisma 7 is the sole ORM and migration system. The application reuses the existing `User` concept and Person 1's `InviteCode` concept; it does not define a second account/auth system. Six migration folders are checked in, including the pending profile-field and preferences migrations. The user reports that initial and submission lifecycle migrations were applied to a Supabase project. The user also reports that all 31 database integration tests passed against a separate migrated test project. Neither report confirms the migration ledger or operational state of the intended production project.

No migration, seed, Cron setup, or production database operation was performed for Phase 11. Before deployment, confirm the correct project/ref and run read-only `npx prisma migrate status` using the intended `DIRECT_URL`. Check the target's backups/PITR with its owner. Apply only reviewed migrations after explicit approval. Do not use the historical Supabase CLI schema/seed scaffold; it duplicates Prisma-owned tables and included Person 4 domains without privacy review.

## Models and ownership

### User profile fields (2026-11-01)

Migration `20261101170000_user_profile_fields` adds editable profile attributes to the existing `User` row: nullable unique `handle`, `bio`, `skills`, `currentProject`, and HTTP(S) URL strings for portfolio, GitHub, LinkedIn, and avatar. It does not create another user/profile identity table. Existing rows receive empty defaults for optional fields; handles remain null until saved and the API returns a stable display-only fallback. Profile metrics are derived from existing PointTransaction, Submission, and Streak rows; they are not stored on User or accepted from the client. Apply with the normal reviewed Prisma migration procedure after verifying the intended Supabase project. This migration has not been applied by the implementation agent.

### User preferences (2026-11-01)

Migration `20261101173000_user_preferences` creates a one-to-one `UserPreferences` row keyed by the existing user's ID with a cascading foreign key and enables RLS without browser-facing policies. It stores color theme, review/streak/chat notification preferences, and the portfolio visibility preference. Defaults match the existing Settings UI. Preferences do not grant authorization and are never included in task, points, leaderboard, streak, Chat, or Personal Space queries. Both this migration and the preceding profile-fields migration are pending; deploy in Prisma migration order after confirming the intended database.

| Model                 | Purpose and key controls                                                                                                                                                                                                                                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`                | Existing identity row, unique email and normalized-email index; persisted role/status are rechecked on protected service routes. `UserRole` is MEMBER/ADMIN; `UserStatus` includes pending, approved, rejected, suspended, disabled. Registration/login/current-user, pending approval, guarded first-admin bootstrap, and self-profile persistence use this model.                    |
| `UserPreferences`     | Optional one-to-one settings row keyed by the existing User ID. Stores theme, notification preference flags, and portfolio visibility; never grants access. RLS enabled with no browser policy.                                                                                                                                                                                        |
| `InviteCode`          | Reused invite concept; persist `codeHash`, never a recoverable plaintext code. Unique hash, status/expiry and creator indexes; usage bounds are checked in SQL. Persisted invite APIs/auth registration use this model.                                                                                                                                                                |
| `Task`                | Admin-created task with title/description/category, `pointsMax >= 0`, due date, checklist, lifecycle (DRAFT/PUBLISHED/ARCHIVED), thumbnail type, creator and timestamps. Member visibility is server-filtered to published tasks.                                                                                                                                                      |
| `Submission`          | Task/member proof URL and note, submitted code/checklist, workflow status, reviewer, feedback, score/rubric snapshot and timestamps. Owner comes from the authenticated persisted user. Partial unique index permits only one DRAFT/SUBMITTED/UNDER_REVIEW attempt per user/task; prior rejected/revision/approved/withdrawn attempts remain history. No upload storage is integrated. |
| `PointTransaction`    | Immutable award ledger and source for weekly/all-time totals. Unique submission and idempotency key, task max/rubric/reviewer snapshots, amount bounds, recipient/time indexes. No materialized balance.                                                                                                                                                                               |
| `Streak`, `StreakDay` | Derived only from approved submissions and server-authored `reviewedAt`; daily marker primary key `(userId,activityDate)` uses IST calendar date. Advisory transaction lock and unique key make refresh idempotent.                                                                                                                                                                    |

Relations use restrictive foreign keys for history-bearing rows. SQL migrations enable RLS without browser-facing policies; the app accesses data server-side via Prisma. Chat, Chat attachments, Personal Space (`Todo`, `Note`, `Goal`, private profile/settings) are not queried as input to scoring, leaderboard or streak calculations. Person 4 privacy sign-off is still outstanding for any future integration.

### Migrations (apply in this order)

| Migration                             | Contents                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `20261031100000_initial`              | Enums and User, Task, Submission, PointTransaction, Streak, InviteCode tables; initial constraints/indexes and RLS. |
| `20261031210000_submission_lifecycle` | `WITHDRAWN` status and partial unique index for one active attempt per user/task.                                   |
| `20261031230000_leaderboard_indexes`  | Submission user/status and points createdAt/user indexes.                                                           |
| `20261031233000_ist_streak_engine`    | `StreakDay` plus secured SQL functions for transactional and scheduled refresh.                                     |
| `20261101170000_user_profile_fields`  | Additive editable profile columns and unique nullable handle index on the existing `User` table.                    |
| `20261101173000_user_preferences`     | Adds the one-to-one `UserPreferences` row/table and `ThemePreference` enum.                                         |

Review SQL under `prisma/migrations/` and schema under `prisma/schema.prisma`. No seed script exists. Do not manually seed production users/awards. Synthetic fixtures exist only in tests and are scoped/cleaned by those tests.

### Safe migration workflow

After verifying the project and local `.env.local` values (never print/share them):

```sh
npx prisma migrate status
npm run db:validate
npm run db:migrate:deploy
npx prisma migrate status
```

`DIRECT_URL` is used by Prisma migration commands. `db:migrate:deploy` changes the selected database. Run this workflow first on staging and only with database-owner/release approval on production. No reviewed automatic down migrations exist; prefer a forward-fix. For destructive recovery, stop writes and follow the verified provider backup/PITR restore process with the database owner. Never reset migration history or drop tables as rollback.

## Points and review transaction

The Phase 10 admin review routes call `dispatchApprovedPoints`. They revalidate the signed-in persisted approved ADMIN; reviewer identity, recipient, task maximum and `mvp-default-v1` rubric marker are server-owned. Only integer `pointsAwarded` from 0 through the persisted task maximum is accepted. Approval changes submission state, writes one immutable ledger record, and refreshes the streak in one transaction. Exact retries return the existing award; conflicting retries fail. Any transaction failure rolls back all writes. Rejection/revision award no points; a later attempt is a new submission row.

Configurable rubric storage remains unimplemented. Do not accept reviewer/user/role/status/points/streak values as trusted client fields. See `API_CONTRACTS.md` for HTTP payloads and `SECURITY_NOTES.md` for authorization and privacy details.

## Streak policy and Supabase Cron

Only approved submissions count (including a zero-point approval), using `reviewedAt` interpreted as an Asia/Kolkata date. Multiple approvals on one day produce one day marker. Current streak includes activity today or yesterday; after one full missed IST day it resets to zero while longest is retained. Login is not an activity event. Approval refresh is immediate in the award transaction.

Supabase Cron is a daily reconciliation/reset path at `18:35 UTC` (`00:05 IST`). The job has **not** been verified as configured. After confirming the target database has the streak migration applied, an authorized project operator can use Supabase Dashboard → SQL Editor. Enable `pg_cron` first if necessary. This SQL replaces an existing job with the same name and creates one schedule:

```sql
select cron.unschedule(jobid)
from cron.job
where jobname = 'prax-refresh-streaks';

select cron.schedule(
  'prax-refresh-streaks',
  '35 18 * * *',
  $$select public.refresh_all_streaks();$$
);
```

Verify in Database → Cron Jobs or with:

```sql
select jobid, jobname, schedule
from cron.job
where jobname = 'prax-refresh-streaks';
```

Do not run this against an unconfirmed project. Same-day approval updates do not depend on Cron. The SQL functions derive user/date only from persisted approved submissions and do not query Chat or Personal Space.

## Integration database safety

Keep three connection URLs in ignored `.env.local`: application `DATABASE_URL`, migration `DIRECT_URL`, and a **different disposable project** for `TEST_DATABASE_URL`. The test runner checks identities and performs read-only connectivity/schema preflight before Vitest. It refuses matching database identities and does not print URLs. Never point it at production: integration tests insert/update/delete synthetic records. Latest user-run result was 31/31 across five suites; see `TEST_LOG.md`. The Phase 11 agent environment could not reach that project and its retry ran no tests.

## Release blockers and unknowns

- Intended production/staging Supabase project ID and full migration status are unverified here.
- Backup/PITR and restore procedure must be confirmed with the database owner.
- Cron activation must be checked after target migration review.
- Registration/login/current-user, hashed invite onboarding, admin invitation management/member approval, and guarded first-admin provisioning are implemented against the existing schema with no new migration. Their complete database integration flow still needs to pass from an environment that can reach the isolated test project. Configurable rubric and remaining admin member lifecycle actions are not implemented.
- Coordinate deploy/build/rollback/smoke responsibilities with Person 5 and obtain explicit deployment approval. No deployment was performed.

## Persisted auth and first-admin setup (2026-11-01)

Authentication reuses the existing `User` and `InviteCode` tables. No schema change or migration was required. Password hashes use the existing scrypt helper; invite codes use SHA-256 hashes. New registrations are always `MEMBER/PENDING_APPROVAL`; the client cannot supply IDs, roles, or account status. Invite count increment and user insert share a transaction. First-admin setup is protected by a temporary `FIRST_ADMIN_BOOTSTRAP_TOKEN`, a PostgreSQL transaction advisory lock, and a check that no ADMIN already exists. Exact API shapes and errors are in the Phase 12 section of `API_CONTRACTS.md`.

The registered pending member receives the existing signed session cookie for the waiting page; this is an auth-flow change only and requires no schema migration. Server middleware and persisted current-user checks continue to deny workspace access until approval.

Never insert account or invite rows by hand. Keep the temporary bootstrap token and password local; after the first-admin endpoint returns 201, remove the token from `.env.local` and restart the local app. The bootstrap endpoint then returns 404, and it independently refuses a second admin even if accidentally re-enabled. No database was accessed for this implementation. A temporary admin HTTP request is still required after the project owner confirms the correct `DATABASE_URL`; see README for operator steps.

# Phase 5 data integration review (2026-11-01)

Dashboard uses existing relations only; no migration is necessary. Its points total reads the immutable `PointTransaction` ledger constrained to the authenticated user and currently `APPROVED` submissions. Approved task count/activity read only that user's approved `Submission` rows and associated task title. Current streak reads only that user's `Streak`; weekly rank delegates to the existing approved-user leaderboard query. Chat and Personal Space models are neither queried nor included.

The following disconnected services have no Prisma persistence in the current schema: Personal Space todo/note/goal data, shared Chat messages/attachments, notifications/read state, configurable rubric versions/criteria, moderation reports, and durable audit entries. Before migrations are authored, define ownership and retention, constraints/indexes, event/source semantics, and—where applicable—Person 4 privacy and storage/transport review. The admin user lifecycle routes can reuse `User`, but each allowed status transition and reason/audit behavior still needs a written contract. No migration was created or applied for Phase 5.

# Phase 6 API/data access audit (2026-11-01)

No schema modification is required for the Dashboard integration. The route reads the existing User, PointTransaction, Submission, Task, and Streak relations through Prisma; identity filters come from `requirePersistedAccount`. The handler issues no direct Supabase JS, `pg`, or raw SQL query. Weekly rank delegates to the existing leaderboard service, which uses its established Prisma raw-query implementation and repeatable-read transaction. The shared client uses Prisma's PostgreSQL adapter with the app's configured database URL. No migration was authored or applied.

# Phase 8 schema status (2026-11-01)

No schema or migration changed in Phase 8. Profile and Settings work from preceding phases did add fields to the existing `User` model and a one-to-one `UserPreferences` model using additive migrations `20261101170000_user_profile_fields` and `20261101173000_user_preferences`. Project records state these migrations were not applied by the agent; verify the intended Supabase project with read-only `npx prisma migrate status` before any operator applies them. Do not print or share `.env.local` values.

Dashboard uses existing `PointTransaction`, `Submission`, `Task`, and `Streak` data and requires no dashboard table. Workspace/Chat, notifications, configurable rubric, moderation reports, and durable audit still have no Prisma models. Do not add these models until ownership/privacy, storage, event, retention, and review-flow contracts are approved. Phase 8 itself made no database call or migration.

# 2026-11-01 — Sign-out UI integration

No database or migration changes were made for the global sign-out control. Logout clears the existing browser session cookie only.

# 2026-11-01 — Registration diagnostics

No database or migration change. This update adds only safe server-side diagnostic context for registration failures.

The observed registration P2028 prompted explicit bounded transaction limits matching bootstrap; there is no schema or data change.
