# PRAX frontend

Next.js 16.4.3, React 19.3, TypeScript and Tailwind CSS 4. Task lifecycle APIs and their Prisma 7 schema are implemented. The user reported that the initial schema migration was applied to Supabase on 2026-10-31. Persisted authentication, account creation and other production backend services remain disconnected.

## Run locally

Use Node.js 24 and npm. From the repository root:

```sh
npm ci
```

Create an ignored `.env.local` file in the repository root for local settings. The current worktree does not contain `.env.example`; Git shows it as deleted, and this work has left that change untouched. Keep all credentials in `.env.local`, never in tracked files.

The frontend and health endpoint can run without a database. To use the retained local development member login, set a private session key in `.env.local`:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy the command's output into `SESSION_SECRET` in `.env.local`; do not commit or share it. No default signing secret is accepted. The test account `member@prax.build` / `MemberPass123!` works only in development on localhost/127.0.0.1. Login fields remain blank and production rejects this fixture.

Start the local app with `npm run dev -- --hostname 127.0.0.1 --port 3000`, then open http://127.0.0.1:3000/login. The public health check is http://127.0.0.1:3000/api/health. Stop the dev process with Ctrl+C.

`DATABASE_URL`, `DIRECT_URL`, and `TEST_DATABASE_URL` are Supabase PostgreSQL placeholders; keep all actual credentials only in ignored `.env.local`. Copy the pooled transaction-mode connection URL to `DATABASE_URL`; copy a direct or session-mode URL to `DIRECT_URL` for Prisma migration commands. Use a separate disposable test project for `TEST_DATABASE_URL`; integration tests are skipped when it is blank. Prisma generation runs before tests, type checks, and builds.

The schema and migrations are in `prisma/`. The user reported applying both checked-in migrations with `npm run db:migrate:deploy`. This repository does not apply migrations automatically at runtime. The routes recheck signed-session role/status against the persisted User row; task/submission writes require a matching persisted approved account. Authentication/account creation is still disconnected except for the loopback-only development member fixture, which is not inserted into Supabase.

## Backend handoff

Mock runtime data and fake-success fallbacks have been removed. Task list/detail and admin create/content-update APIs are implemented when Supabase is configured; all other unimplemented service routes retain their paths/methods and return HTTP 503 `BACKEND_NOT_CONFIGURED`. Protected routes enforce the existing server-side session/role guard (401/403). Production sign-in/account creation and persisted user lookup remain disconnected, so task requests also require a matching approved User row and signed session. The isolated local member fixture is not seeded in Supabase. The health route reports `backend: not_configured` until connected; logout clears the session cookie.

Next integration work: connect Person 1's persisted auth/current-user lifecycle and provision approved member/admin rows. Then run database integration suites using a separate disposable `TEST_DATABASE_URL`. Admin review, points, streaks and other backend domains remain unimplemented. Real services must recheck account state, enforce ownership, validate writes and handle persistence/transactions. No preview auth bypass or alternate browser storage is included.

The client request helper is src/lib/api/client.ts, typed resource hook is src/lib/api/use-resource.ts, and read models are src/lib/api/contracts.ts. Workspace/chat/profile/settings controls retain their typed request shapes. Loading, unavailable, retry and empty states do not substitute demonstration data. Notification contracts and read/unread behavior are in src/lib/notifications/types.ts and NotificationBell.tsx; there is no simulated notification feed or delivery service.

## Design system

Tokens: src/app/tokens.css and src/lib/design-tokens.ts. Components: src/components/ui. Local Inter and artwork: public/fonts and public/artwork. The development-only /design-system page includes illustrative component specimens and the live notification control; its specimens are isolated from application data and never appear in production navigation.

## Checks

Run the same checks from the repository root:

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

If the default Turbopack build cannot spawn its worker in a restricted environment, the equivalent Next.js webpack build can be checked with `npm run build -- --webpack`; this is a one-off verification flag and does not change project configuration.

Test-only fixtures are synthetic and are not runtime services. Obsolete integration tests for removed prototype implementations were replaced with tests of the disconnected API boundary, retained authorization/session behavior, frontend states and notifications. See TEST_LOG.md for actual results and limitations.

## Backend conventions

See `API_CONTRACTS.md` for the shared route conventions: authenticate and authorize before reading/writing resources; validate bounded request bodies; use `{error:{code,message,status}}` for failures; use bounded `limit`/`offset` pagination; never log credentials, request bodies, tokens or raw exception details; and keep test fixtures synthetic and test-only. Task endpoints use Supabase when configured and otherwise return `503 BACKEND_NOT_CONFIGURED`; other service routes remain disconnected.
