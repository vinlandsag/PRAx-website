# PRAX

PRAX is a Next.js 16.4.3 application using React 19, TypeScript, Tailwind CSS 4, Node.js 24, and Prisma 7 with Supabase PostgreSQL. Prisma schema and migrations are under `prisma/`; Prisma is the only schema/migration path. Read this file, `AGENT_HANDOFF.md`, `API_CONTRACTS.md`, `DB_SCHEMA.md`, and the latest entries in `PROJECT_STATE.md`, `TODO_NEXT.md`, and `TEST_LOG.md` before continuing backend or release work.

## Current release status

**Not ready for a production release.** Task, submission, review, points, leaderboard, and streak database services are implemented. Registration, invite verification, password login, current-user lookup, admin invite creation/list/revocation, pending-member listing, approval, and guarded first-admin bootstrap now use the existing Prisma `User` and `InviteCode` tables. Database-backed auth integration tests are checked in, but could not be run here because the separate test database is unreachable. Configurable rubric storage and other unfinished service areas (including Workspace/Personal Space, Chat, and notifications) remain disconnected; see `API_CONTRACTS.md`.

No deployment was performed for this handoff. Deployment coordination with Person 5 and explicit deployment approval remain required. The production database migration state, deployed credentials/secrets, backups, and active Supabase Cron job have not been verified from this repository environment.

## Clean local setup

Requirements: Node.js `24.x` and npm (the verified environment used Node `v24.15.0` and npm `11.12.1`). From the repository root:

```sh
npm ci
cp .env.example .env.local
```

Fill `.env.local` locally; never commit it or paste its values into logs/chat. Required for local signed-session flows:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Put the output in `SESSION_SECRET` (at least 32 characters). Generate a private key for each environment. Do not use a shared/default key.

Environment variables:

| Name | Use |
| --- | --- |
| `SESSION_SECRET` | HMAC session signing key; required for signed-session operations, at least 32 characters. `NEXTAUTH_SECRET` is a legacy fallback in code; prefer `SESSION_SECRET`. |
| `NEXT_PUBLIC_APP_URL` | Application origin, default `http://localhost:3000`. |
| `DATABASE_URL` | Supabase PostgreSQL runtime connection, normally the pooled connection URL. |
| `DIRECT_URL` | Direct or session-mode PostgreSQL URL used by Prisma migration commands. |
| `TEST_DATABASE_URL` | Separate disposable, migrated PostgreSQL project for integration/performance fixtures. Never point this at the application/production database. |

The frontend and public health route can start without database URLs. Prisma-backed feature routes need `DATABASE_URL`; do not infer readiness from `/api/health` because it currently returns HTTP 200 with `backend: not_configured`.

Start the app on loopback:

```sh
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000/login`; check `http://127.0.0.1:3000/api/health`. Stop the server with Ctrl+C. The retained `member@prax.build` development fixture works only in development on loopback; it is not a database seed and must never be enabled online.

## Database and migration procedure

There are six checked-in migrations, in order:

1. `20261031100000_initial` — reused `User`/`InviteCode` models and task, submission, points, streak tables, constraints, indexes, and RLS enabled without browser policies.
2. `20261031210000_submission_lifecycle` — `WITHDRAWN` status and one-active-attempt partial unique index.
3. `20261031230000_leaderboard_indexes` — submission status and points time indexes.
4. `20261031233000_ist_streak_engine` — `StreakDay` and secured database streak functions.
5. `20261101170000_user_profile_fields` — editable profile fields on the existing `User` table.
6. `20261101173000_user_preferences` — one-to-one account preference record for theme, notification preferences, and portfolio visibility.

Do not use the historical Supabase CLI schema/seed scaffold; Prisma is the sole migration owner. Before applying a migration, independently confirm the intended Supabase project and connection target, inspect the migration diff, ensure a recoverable backup/PITR point exists, and apply to staging first. With the correct local `.env.local` set:

```sh
npx prisma migrate status
npm run db:validate
npm run db:migrate:deploy
npx prisma migrate status
```

`db:migrate:deploy` uses `DIRECT_URL` and changes the selected database. It is **not** run automatically by app startup or build. Do not run it against production without explicit release approval. Earlier user reports confirm initial and submission migrations were applied to a Supabase project; the current production target's complete migration state has not been verified. The successful integration run confirms the separate test project had the schema needed by these tests, not that the production target is current.

There is no seed command or production seed data. Tests create tagged synthetic fixtures and clean them up. Do not add users or invites manually in Supabase. To create the first administrator, set a temporary `FIRST_ADMIN_BOOTSTRAP_TOKEN` of at least 32 random characters in the local server environment, restart the app, and make the local-only bootstrap request below. Remove that variable and restart the app immediately after the first admin is created; the endpoint also refuses to create an admin once any ADMIN exists. Never paste the token or password into chat or commit them.

Example local first-admin bootstrap (keep the token and password private in this terminal only; substitute values locally):

```sh
export FIRST_ADMIN_BOOTSTRAP_TOKEN="$(node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))')"
```

Put that value in `.env.local` as `FIRST_ADMIN_BOOTSTRAP_TOKEN`, restart `npm run dev`, then from another terminal send the request to `http://127.0.0.1:3000/api/auth/bootstrap-admin` with header `x-first-admin-token: <same local token>` and JSON `{ "name": "Your name", "email": "you@example.com", "password": "a unique password of at least 12 characters" }`. Use a local REST client or `curl`; do not put a real password in shell history. After a `201` response, remove `FIRST_ADMIN_BOOTSTRAP_TOKEN` from `.env.local` and restart the server. Then sign in at `/login`, open Admin → Members, create an invite, and share the returned code privately (it is shown only once). A new member registers with that code and remains pending until an admin approves them. `/api/users/me` refreshes persisted status into the signed session after approval; have the member reload or sign in again before using member APIs.

## Verification commands

Run from the repository root:

```sh
npm test
npm run lint
npm run typecheck
npm run db:validate
npm run build -- --webpack
```

`npm test` runs unit/handler tests and skips database-gated/opt-in suites unless explicitly enabled. Typecheck/build/test scripts generate Prisma Client. The webpack build is the verified production build command for restricted environments; default `npm run build` uses Next's configured default builder.

For isolated PostgreSQL integration tests, set all three `DATABASE_URL`, `DIRECT_URL`, and `TEST_DATABASE_URL` in local `.env.local`; the runner refuses missing or matching database identities and performs read-only connectivity/schema checks before Vitest:

```sh
npm run test:integration
```

This suite creates synthetic database records, including cleanup of only reserved test fixtures. Never run it against production. The last user-run result predates the new auth flow suite: 5 files, 31 tests passed (tasks 5, submissions 8, points 12, streaks 3, review flow 3). Three auth flow tests have since been added; they remain unverified against PostgreSQL. From this environment the same command stopped at its guard because the separate test host was unreachable; no tests ran in that attempt. See `TEST_LOG.md` for full history.

Auth/RBAC regression checks:

```sh
npm test -- src/lib/auth/rbac.test.ts src/lib/auth/development-member.test.ts src/app/api/admin/submissions/review-routes.test.ts
```

These verify role/status guards, the loopback-only development member, and admin review denial/forged-field behavior. Auth handler unit tests are included in `npm test`. A real persisted login smoke test needs configured database access and a first admin created using the procedure above.

## Review, score, streak, and scheduling

The admin review API revalidates the persisted approved ADMIN; client-supplied reviewer identity and rubric version are rejected/ignored. Approval validates `0..Task.pointsMax` and atomically writes submission review state, the immutable unique points ledger entry, and the IST streak refresh. The leaderboard derives totals from the ledger. Exact retries are idempotent. See `API_CONTRACTS.md` for request/response details and `SECURITY_NOTES.md` for data boundaries.

Streak activity is approved submissions by IST calendar date; one missed IST day resets current streak and longest is retained. Same-day approval updates immediately in the approval transaction. Supabase Cron is a daily reconciliation/reset path at `18:35 UTC` (`00:05 IST`), not a request-path dependency. After the streak migration is deployed, a project operator must configure and verify the `prax-refresh-streaks` Cron job using the SQL in `DB_SCHEMA.md`. Cron activation is not verified here.

Logs are allowlisted to fixed error event names and a validated opaque request ID. Do not add credentials, request payloads, tokens, proof content, or raw exceptions to logs.

## Performance evidence

`TEST_LOG.md` records the Phase 9 synthetic test-project dataset and before/after p50/p95/max timings: 501 users, 2,500 tasks, 10,000 approved submissions, 10,000 ledger rows, 42 streak days; five warmups and 30 route-handler samples. All seven measured endpoint p95s were below two seconds for that environment. Timings exclude network/TLS/client latency. At the time of that benchmark, `GET /api/workspace` was a 503 seam, so own-profile and settings reads were not measured. These numbers are not a general production guarantee.

## Rollback and incident notes

- Application rollback: redeploy the last known-good artifact only after confirming it remains compatible with the current schema. The repo does not define a deployment provider/rollback pipeline here.
- Database rollback: migrations have no reviewed automatic down migrations. Prefer a reviewed forward-fix. For destructive recovery, stop writes and use the target project's verified backup/PITR/restore procedure with the database owner; never drop tables, reset migrations, or restore production data without explicit approval.
- Points awards are immutable/idempotent. Do not delete ledger rows to “undo” an award; design an auditable compensating entry/workflow with the product/data owner.
- Streak Cron can be unscheduled and rescheduled using the `prax-refresh-streaks` job name in `DB_SCHEMA.md`; same-day approval streak updates continue in the transaction.
- Preserve logs without adding private payloads. Current errors intentionally expose only safe generic messages.

## Known gaps and handoff

1. **Release blockers:** the database-backed auth integration suite was not runnable in this environment; configurable rubric endpoint remains 503. Distributed rate limiting, durable admin audit records, and the remaining reject/suspend/disable/unsuspend member actions also need resolution before production sign-off.
2. Confirm primary/staging project IDs, current migration status, backup/PITR, and database owner before deployment or migration.
3. Coordinate environment variables, build/deploy, rollback, and smoke-test ownership with Person 5. Do not deploy until explicit approval.
4. Configure and verify Supabase Cron after the intended project migration is confirmed.
5. Keep Chat and Personal Space outside scoring/streak queries. Their owning Person 4's privacy sign-off is still outstanding; no such data is in these score/streak operations.

There is no deploy script or seed script. Do not assume a successful build or the local development fixture proves production readiness.

## Repository map

- `src/app/api/`: Next.js route handlers.
- `src/lib/auth/`: signed session, authorization, role/status and local-only development account.
- `src/lib/tasks/`, `submissions/`, `reviews/`, `points/`, `streaks/`: database service boundaries.
- `src/lib/db/prisma.ts`: Prisma PostgreSQL adapter/client.
- `prisma/schema.prisma`, `prisma/migrations/`: schema and reviewed migration history.
- `API_CONTRACTS.md`, `DB_SCHEMA.md`, `SECURITY_NOTES.md`: contracts, schema/scheduler, security boundaries.
- `TEST_LOG.md`: actual checks, integration reports, and performance measurements.

## Chat and Personal Space (Aleena)

Status as of 2026-11-01, on branch `aleena`. Details: `API_CONTRACTS.md` (Stage 5 section), `DECISIONS.md` (D-037 to D-041), `DB_SCHEMA.md`, `SECURITY_NOTES.md`.

### What was built

One shared `#general` community chat and a private Personal Space (to-dos, notes, goals). Every route needs a signed-in APPROVED member, and the account is re-checked in the database on each request.

| Route | Purpose |
| --- | --- |
| `GET /api/space` | The signed-in member's to-dos, notes and goals |
| `PATCH /api/space` | Create, update or delete one to-do, note or goal |
| `GET /api/chat/messages` | Latest page, an older page (`before`), or newer messages and changes (`after` + `updatedSince`) |
| `POST /api/chat/messages` | Post a message (refused until the community rules are accepted) |
| `PATCH` / `DELETE /api/chat/messages/[id]` | Edit own message / soft-delete own message (a persisted admin can delete any) |
| `POST /api/chat/messages/[id]/pin` | Pin or unpin (admins only) |
| `POST /api/chat/messages/[id]/reactions` | Toggle one of six emoji reactions |
| `POST /api/chat/rules/accept` | Record acceptance of the community rules |

Files:

- API and services: `src/app/api/space/`, `src/app/api/chat/messages/`, `src/app/api/chat/rules/`, `src/lib/space/service.ts`, `src/lib/chat/service.ts`.
- Client: `src/lib/workspace/use-chat.ts` (15-second polling that keeps messages on screen and keeps polling after a failed request), `use-space.ts`, `src/app/chat/page.tsx`, `src/app/space/page.tsx`, `src/components/chat/ChatReactions.tsx`, `ChatRulesDialog.tsx`.
- Schema: `Todo`, `Note`, `Goal`, `ChatMessage`, `MessageReaction` and `UserPreferences.chatRulesAcceptedAt` in `prisma/schema.prisma`; migration `prisma/migrations/20261101190000_personal_space_and_chat/`. The migration has not been applied to any database yet.

Chat features: avatars, timestamps, six-emoji reactions, first-visit rules dialog (the server refuses posts until accepted), pinned messages, soft delete, paging of older messages. Personal Space features: priority, difficulty and due date on to-dos, Today / Upcoming / Done filters (undated open to-dos appear under Upcoming), an optional link to a published platform task, and goal progress bars.

### How Personal Space privacy works

- The owner id comes only from the database account matched to the session, never from the request. A `userId` in a body or query string is rejected or ignored.
- Every to-do, note and goal read, update and delete is filtered by that id. Another member's item id, or an admin using it, returns 404.
- No admin route reads these tables. Admins hold the same space permissions as members, so the separation comes from the queries, not from the role.
- This is enforced in application code only. Row level security is enabled on the new tables without policies (this blocks Supabase's browser roles), but the database does not stop a server query that forgets the owner filter, and whether the Prisma connection role bypasses RLS has not been verified. Nothing is encrypted.
- Chat is shared on purpose: every approved member reads the channel. Reactions are returned only as a count per emoji plus whether you reacted yourself; other members' identities are never returned.

### How to run and test

Install without the lockfile. `package-lock.json` has 11 nested `@tailwindcss/oxide-*` entries with no `version` (around line 1372), and `npm ci` is reported to fail on Windows because of it:

```sh
npm install --no-package-lock
cp .env.example .env.local
copy .env.example .env.local   # Windows CMD
```

Fill `.env.local` yourself (`SESSION_SECRET`, `DATABASE_URL`, `DIRECT_URL`, and a separate `TEST_DATABASE_URL`). Review the migration SQL, then apply it to a development database only:

```sh
npx prisma migrate status
npm run db:migrate:deploy
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Sign in as a real approved member from the database (see the first-admin steps above). The local `member@prax.build` fixture is not a database row, so these routes reject it. Until the migration is applied, the routes fail with a generic 500.

Unit tests (database not needed):

```sh
npm test
npx eslint src
npm run typecheck
```

At the last run `npm test` passed 609 tests with 56 skipped (database-gated suites). `npm run typecheck` needs the generated Next types; run `npx next typegen` once if it reports `LayoutProps` not found. `npm run lint` over the whole repo reports 13 errors in `praxora-admin/`, which is not part of this work.

**Integration tests: written but not yet run.** `src/lib/space/space.integration.test.ts` (11 tests) and `src/lib/chat/chat.integration.test.ts` (10 tests) are registered in `scripts/run-integration-tests.mjs` and run with `npm run test:integration`. They need a separate, migrated `TEST_DATABASE_URL` that includes the Chat/Space migration. No database was available, so their behavior is unverified; only the mocked unit tests have passed.

### Not done

- **Chat attachments**: waiting on a team decision (files or links, and where to store them). The Attach button is unchanged and still calls the 503 stub `/api/chat/attachments`; the message route rejects attachment ids.
- **Real-time**: chat polls every 15 seconds. D-003 (Pusher or Socket.io) is still PENDING in `DECISIONS.md`; no real-time library is installed. The `after` / `updatedSince` reads are the intended seam for a push transport.
- **Rich-text notes**: notes are plain text (up to 5000 characters); no editor is installed.
- **Chat rate limiting**: none, so posting is not throttled.
- **Report button**: not built; the admin reports API (`/api/admin/reports`) is still a 503 stub.
- **Audit events**: none are written for pin or delete.
- `/api/workspace` (public profile) is unchanged and still returns 503.
