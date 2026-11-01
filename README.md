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

There are four checked-in migrations, in order:

1. `20261031100000_initial` — reused `User`/`InviteCode` models and task, submission, points, streak tables, constraints, indexes, and RLS enabled without browser policies.
2. `20261031210000_submission_lifecycle` — `WITHDRAWN` status and one-active-attempt partial unique index.
3. `20261031230000_leaderboard_indexes` — submission status and points time indexes.
4. `20261031233000_ist_streak_engine` — `StreakDay` and secured database streak functions.

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

`TEST_LOG.md` records the Phase 9 synthetic test-project dataset and before/after p50/p95/max timings: 501 users, 2,500 tasks, 10,000 approved submissions, 10,000 ledger rows, 42 streak days; five warmups and 30 route-handler samples. All seven measured endpoint p95s were below two seconds for that environment. Timings exclude network/TLS/client latency. `GET /api/workspace` remains a 503 seam, so profile reads were not measured. These numbers are not a general production guarantee.

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
