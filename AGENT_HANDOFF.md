# AGENT_HANDOFF.md

## Phase 4 — Settings persistence handoff (2026-11-01)

The Settings UI now reads profile data from `/api/users/me/profile` and account preferences from `GET /api/users/me/settings`. Account edits reuse `PATCH /api/users/me/profile`; theme, notification preferences, and portfolio visibility use the new `PATCH /api/users/me/settings`. Settings are stored in `UserPreferences`, one-to-one with the existing `User`. Both writes derive ownership from the signed-in account and revalidate persisted approval. ThemeSync reads the server setting; browser local storage remains only an immediate fallback.

New additive migration: `prisma/migrations/20261101173000_user_preferences/migration.sql`. The earlier profile migration `20261101170000_user_profile_fields` is also still pending according to the last agent verification. Review both and verify `.env.local` targets the intended Supabase project before running Prisma deploy; no DB migration was applied here. Notification delivery is not implemented. `showPortfolio` persists but cannot affect public profile reads until that API is implemented. Email and role remain read-only; existing logout handles sign-out.

## Phase 3 — Profile persistence handoff (2026-11-01)

Profile editing is wired to `GET/PATCH /api/users/me/profile`, backed by profile fields on the existing Prisma `User` row. The endpoint uses the signed session ID, rechecks the persisted approved account, rejects unknown fields and unsafe URLs, selects no password/email fields for the profile projection, and rotates the session cookie when display name changes (the existing account guard binds session name to persisted name).

New migration: `prisma/migrations/20261101170000_user_profile_fields/migration.sql`. It is additive and was not applied. Before the user runs `npm run db:migrate:deploy`, they must verify `.env.local` targets the intended Supabase project and inspect the SQL; do not print or share connection strings. No destructive operation is included. The local dev fixture is intentionally unable to save because no persisted User row exists. Public member profile, Settings, Personal Space, Chat, and notification services remain disconnected. Verification: unit suite passed 361, typecheck and webpack build passed; full lint fails on pre-existing errors in the merged `praxora-admin` subtree. Run checks recorded in `TEST_LOG`, then apply the migration manually only to the intended database.

## Phase 11 release readiness handoff (2026-11-01)

Start with README. Current environment verified Node `v24.15.0`, npm `11.12.1`, and Prisma `7.10.1`; five migrations are checked in. Setup uses `npm ci`, ignored `.env.local` copied from `.env.example`, and a private 32+ character `SESSION_SECRET`. There is no seed script. Runtime DB uses pooled `DATABASE_URL`; migration commands use direct/session `DIRECT_URL`; integration runner requires a distinct disposable `TEST_DATABASE_URL`.

Latest auth implementation checks: `npm test` passed 344, with 35 database/opt-in skips; focused auth/admin tests passed 106; lint, typecheck, and `npx next build --webpack` passed (48/48). The user-reported 31/31 PostgreSQL result predates the auth flow integration tests. The agent rerun could not reach the separate DB and stopped before tests. Default Turbopack build hit the sandbox process/port restriction; webpack build passed.

Not production-ready: persisted auth, invites, approval and safe one-time admin bootstrap are implemented but the new database integration flow is not verified here; configurable rubric and Workspace/Chat/notifications remain unavailable. Process-local rate limits and absent durable audit records are release concerns. Confirm primary DB target/migration status/backups and Cron, and coordinate with Person 5 before any deployment. No deployment, migration, seed, Cron operation, commit, or push was performed. Deployment requires explicit approval. Rollback and scheduler steps are in README and DB_SCHEMA.md.

## Database integration handoff (2026-11-01)

Use Supabase as the PostgreSQL host and Prisma 7 as the only ORM/migration system. Prisma schema and migrations live under `prisma/`; runtime uses pooled `DATABASE_URL`, migrations use `DIRECT_URL`. Do not use the removed Supabase JS helper layer or apply a parallel Supabase CLI schema migration. The SQL scaffold that arrived from `main` duplicated tables, included Chat/Personal Space without privacy sign-off, and assumed Supabase Auth RLS despite the application's signed HMAC sessions. Reconsider only after explicit schema/auth/privacy review.

The conflicts from `origin/main` into `milan` are resolved in local merge commit `9eb4d7b`, including docs, env template, dependency lockfile and README. The incoming unused Supabase JS/schema scaffold is excluded. Checks are recorded in `TEST_LOG.md`. The commit has not been pushed; no database command was run.

## Phase 9 performance handoff (2026-11-01)

Benchmark command: `PERF_BENCHMARK=1 PERF_WARMUP_RUNS=5 PERF_MEASURED_RUNS=30 npm test -- src/lib/performance/endpoints.performance.test.ts --reporter=verbose --testTimeout=600000`. The harness takes `TEST_DATABASE_URL` from the environment or `.env.local` and refuses a Supabase project matching `DATABASE_URL` or `DIRECT_URL`; fixtures are tagged and cleaned in `finally`. Dataset/environment and before/after p50/p95 are in TEST_LOG.md. All measured route p95s stayed under 2 seconds. The member submission-history query no longer joins the unused reviewer relation. Results exclude HTTP/TLS; no EXPLAIN plans were captured. Profile is unavailable at `/api/workspace` (503). No migration was run. The full DB integration test run had five failures; review TEST_LOG before relying on broader DB behavior.

## Phase 10 team integration handoff (2026-11-01)

The admin review routes now use the existing signed-session guard and revalidate persisted ADMIN status. Approve accepts `{pointsAwarded}` only; the server supplies `reviewedById` and `mvp-default-v1`. Reject/revision accept `{feedback}`. The approval service writes `reviewedAt` from PostgreSQL transaction time truncated to `TIMESTAMPTZ(3)` precision before recording the streak. Full route flow fixture is `src/app/api/review-flow.integration.test.ts`; unit boundaries are in `src/app/api/admin/submissions/review-routes.test.ts` and `src/lib/reviews/service.test.ts`.

To run the database suite from the repository, make sure local `.env.local` contains `TEST_DATABASE_URL` for the isolated test project plus the app `DATABASE_URL` and `DIRECT_URL`, then run `npm run test:integration`. The runner refuses matching database identities and exits before Vitest if the test DB is unreachable or its Prisma tables/migration ledger are missing. It prints neither URLs nor credentials. The user's first reachable run exposed timestamp precision, stale Streak cleanup and non-isolated task fixture failures. Fixes were applied; the user reports the subsequent `npm run test:integration` passed with 31/31 tests across 5 files. This execution environment could not independently reach the test project. Points-suite startup deletes only stale synthetic users with reserved `points-member-`/`points-admin-` emails and their dependent rows. No migration is needed for this code change. Login/registration and configurable rubric APIs remain pending; integration fixture creates only approved test users and signs sessions directly.

## Authorized GitHub delivery of current work (2026-10-31)

User explicitly requested pushing the current changes to GitHub; continue using the previously selected donel branch at origin https://github.com/vinlandsag/PRAx-website.git. Fetched origin/donel and verified it matches local base 409d475 (0 ahead, 0 behind) before this delivery commit. Scope includes the backend cleanup, notification UI, retained development-only member account, Node 24/upload configuration and current handoff docs. Local-only hosting clarification remains in effect; this Git push does not deploy a website.

Fresh pre-push checks passed: 226 tests/13 files in 8.91 s; tsc --noEmit and full ESLint exit 0; Git whitespace check clean. Limited scan of 157 text candidates found no high-confidence secret markers or configured private session key. .env.local, .next, node_modules and .vercel remain ignored; only blank .env.example is included. Last production build is the passed 47/47 hosting preflight; it was not repeated for this Git-only action.

No global Git author identity is configured; use existing repository convention PRAX Agent <prax-agent@local> for this commit command only. Publish normally to donel, without force pushing or changing main; verify HEAD against the remote receipt afterward. This note records scope/checks before commit/push so the final delivery hash is available from Git history. Keep the local test account and existing local server; do not restart cloud hosting.

## Latest clarification — run locally (2026-10-31)

User clarified “host it” means local hosting. This supersedes the pending Vercel deployment/sign-in next step. Do not continue cloud deployment or request Vercel authorization for this task. Prior device-login exec session 44678 is no longer available; no site was deployed. Existing hosting-preparation files remain harmless local changes; no application code changed in this run.

Started npm run dev -- --hostname 127.0.0.1 --port 3000 using installed Node/npm (exec session 41439), ready in 728 ms. Confirmed health HTTP 200/environment development and login page HTTP 200; queued the local login browser panel. Server remains running on loopback only. The original local member test account is preserved; backend-dependent data remains disconnected. No secret, commit, push or remote deployment. Tests/lint/build not repeated for this server-only action. Next step: open http://127.0.0.1:3000/login and use the retained test credentials.

## Hosting continuation — Vercel authorization needed (2026-10-31)

User says “host it”. Source is prepared: .vercelignore app/config allowlist; Node engines 24.x in package.json/lock; fresh build 47/47 passed; prior full tests 226 pass. Official CLI 65.9.0 available through npm exec --offline --yes --package=vercel@65.9.0 -- vercel. Use the installed npm.cmd at LocalAppData/Programs/nodejs with that directory on process PATH. No hosting account, project id or live URL confirmed yet.

whoami reported logged out. Normal deploy --dry --json refused without credentials; deploy --temporary --dry --json said temporary deployments unavailable and started device login. Exec session 44678 is awaiting the user's authorization. User was given the provider's device link and an async Done prompt; do not copy the one-time link/token into repository docs. open_in_codex queued the auth page. On reply, poll session, verify CLI account, inspect appropriate project/scope and deploy. Device flow may expire; if so start a fresh login. Do not mistake a successful dry run for deployment.

All code is still local on donel after 409d475; latest cleanup/test-account changes have not been pushed to GitHub. Deploy current source rather than stale remote branch. Local member fixture remains development-only and production login/data services are not connected. Do not weaken auth to make online test login work. No source migration, paid-plan change or new Sites project.

## Latest user correction — retain test member (2026-10-31)

User explicitly asked to keep the test account. D-022 narrows the preceding cleanup: member@prax.build / MemberPass123! is restored for local npm run dev on localhost/127.0.0.1 (also loopback IPv6). Keep this account during future cleanup. No implicit permission to remove it again. Identity remains usr_member_01, Arjun Varma, MEMBER/APPROVED. There is no restored administrator fixture.

Implementation: development-member.ts holds immutable fixture identity and lazy scrypt password verification; login issues a normal HttpOnly signed cookie with developmentOnly:true. Session verifier rejects this marker outside development. me returns the fixture only for its matching authenticated identity, never a production or arbitrary real user. All other unimplemented services stay 503 after auth; data-dependent screens therefore remain unavailable until backend integration. Same-origin login, loopback Host validation, rate limits and private key requirement tested. Missing local signing key was generated in ignored .env.local, not source or logs.

226 tests, lint/typecheck/scoped format/build pass; live HTTP login/me/dashboard 200, workspace 503. Temporary verification server on 3100/session 27127 was stopped; no new server left occupying a project dev lock. Use npm run dev in the user's terminal. No browser/UI geometry check needed for this server-only follow-up. Preserve all preceding uncommitted cleanup changes on donel. No new commit/push.

## Latest handoff — no mock backend, working notification UI (2026-10-29)

Latest instruction: clean unwanted prototype content so backend/database teams can integrate; explicit answer **Remove mock APIs too**. This overrides the earlier requirement to keep process-local APIs. Runtime stores and seed data are gone. Do not restore fixture accounts, fake invite generation, default signing keys, in-memory ledgers/uploads or success-on-error UI. Development review/test fixtures may remain solely for component review and tests. Existing frontend controls must wait for actual service success.

Integration seam: lib/api/backend.ts returns no-store 503 BACKEND_NOT_CONFIGURED; pendingEndpoint uses existing authorize for private/admin routes. Public login/register/magic-link/invite verification are unavailable and issue no tokens. Health and real cookie logout remain. Auth helpers/route guards retained; real backend must recheck current stored account status/ownership rather than treating the placeholder guard as a complete auth implementation. Local SESSION_SECRET must be at least 32 characters; no fallback key. .env.example intentionally blank. Read README and latest API_CONTRACTS first.

NotificationBell in TopNav loads /api/notifications, opens shared Modal, reports errors/retry, displays returned unread state and supports PATCH mark-all-read after confirmation by backend. No fabricated count/dot. Settings link opens tab=notifications. Review at /design-system#notifications (development-only) for anonymous UI inspection without auth bypass. Screenshot: prax-notification-cleanup.jpg in visualization workspace. Browser Escape returned focus to bell; no narrow-panel overflow. Tests also cover populated/read/failed-write states using fixtures only.

212 tests/12 files, lint/typecheck/build/scoped formatting passed. Build 47/47; no duplicate dev server started, existing localhost:3000 responds. Source changes local on donel after 409d475; no new commit or push authorized/performed. Previous published branch remains intact. Best next step is backend authentication/current-user integration, then workspace/tasks/notifications. Do not claim chat saves, uploaded bytes, mail or database persistence now work.

## Latest handoff — social profile entry points and chat media (2026-10-29)

Final user steering: remove the Members section; open others' profiles from chat/leaderboard interactions; add images/videos/files in chat. Implemented. Preserve all earlier dirty foundation/cursor/member-flow work. No new subagents were used.

Profile hrefs come from src/lib/workspace/members.ts. Real account lookup and current APPROVED status are checked by /api/workspace?memberId=. Public field selection/portfolio privacy stay in workspaceStore.publicProfile, which can provide safe defaults without initializing private collections. Default handles use account ids rather than unpublished email prefixes. Sample fixtures use demo_ ids, are labelled and have no auth records. Profile return destinations are whitelisted chat/leaderboard strings; no standalone /members page or /api/members API remains.

Media: shared extension/size policy, server attachment store, upload POST, protected GET with range support and pending DELETE, typed message attachment metadata, ChatComposer/ChatAttachments components. Files remain private to uploader until claimed atomically by a sent message, then approved channel members may read them. Author/admin message removal deletes bytes; admin pin/delete audit behavior remains. Unknown/prototype extension keys, invalid signatures, empty/oversized files, foreign uploads, duplicate claims and unsupported fields are rejected. No storage dependency added. Pending files expire lazily after 30 minutes; quotas 60 MB/account and 128 MB/process; latest 500 messages retained. Full multipart stream is capped at 25 MB + 64 KB, and proxyClientMaxBodySize is 26mb per installed Next docs. Preserve original multipart Content-Type case: Blob.type would lowercase WebKit boundaries.

235 tests/14 files, full lint/typecheck, scoped formatting and final production build passed. Browser saw real Admin User before its first visit, labelled Meera demo, Kabir leaderboard link and return actions; selected/sent PNG+MP4+TXT; decoded video 960x540, duration 5.055, readyState 4, played to end. API live check: TXT 200 with exact bytes and attachment disposition, video 206 exact range, anonymous 401; 12 MB upload 201 and pending cleanup 204. In-app save-to-disk test was cancelled twice; do not claim it passed. Viewport attempt timed out/reset the automation session; new mobile visual check remains unverified. Screenshot: C:/Users/donel/.codex/visualizations/2026/10/28/01a18347-0763-7b91-accc-1289d479dbf1/prax-chat-media-verified.jpg. Created chat tab 2 marked deliverable; original tab 1 points to removed historical /design-system/profile-regression fixture (404). Local server session 9844 runs on 3000; don't start a second server. One non-sensitive test message with three media attachments remains.

No production deployment/database operation/commit/push. Next best task: durable private upload storage and workspace persistence after D-005, retaining ownership tests; current data resets on server restart. Downloads passed HTTP delivery checks but browser saving should be rechecked when the in-app download mechanism is available. Test MP4 is MDN's public flower sample, downloaded to the visualization directory, not shipped in the repo.

## Latest handoff — reference cursor (2026-10-29)

Latest request: match Screenshot 2026-10-29 084833.png cursor. Implemented compact rounded arrow with #171421 fill, #faf5ff outline, subtle violet edge/halo, plus matching hand. Both are static transparent 32x32 PNGs used by --cursor-default (8,8) / --cursor-pointer (13,6), with SVG sources retained in public/artwork. The halo is baked into the PNG, not generated by app-side animation or a moving DOM layer. Preserve earlier app functionality/dirty work.

Source changes limited to the four cursor assets, tokens.css, globals.css comment/formatting, DESIGN_SYSTEM.md and required memory updates. No package installation; existing Next dependency sharp was resolved through createRequire(require.resolve('next/package.json')) to rasterize the SVGs. Future cursor source edits must regenerate the corresponding PNGs.

207 tests, TypeScript, full ESLint, scoped CSS formatting, build (39/39 pages; compiled 924 ms), native asset decoding/alpha checks and HTTP 200 byte-match checks passed. Preview: C:/Users/donel/.codex/visualizations/2026/10/28/01a18347-0763-7b91-accc-1289d479dbf1/prax-glow-cursor-preview.png (enlarged and actual-size artwork on light/dark).

Browser inventory lists tabs 3/4, but getTab, retained tab and direct documented tab APIs fail with browser.user unavailable. No live cursor/CSS-state verification is claimed for this follow-up. No user session changes or navigation completed. Next: refresh the existing /profile browser tab and inspect arrow/hand alignment and native text/disabled cursors when the connection is available.

## Current handoff — functional member flows (2026-10-29)

The latest user request was a seven-part bug list, not further cursor design. All reported visible controls are wired and verified locally. No new agents were spawned for this list; the earlier four-agent profile task remains historical. Preserve the existing dirty foundation/cursor/profile changes.

Shared behavior lives in src/lib/workspace: typed data/contracts, seed task catalog, pure filters/search/ranking, per-account server store and client synchronization hook. /api/workspace GET/PATCH rechecks actual account status/role, validates data, binds all private changes to the authenticated account, enforces chat author/admin permissions, protects browser-origin writes and uses no-store. Public member reads omit private collections/settings and apply portfolio privacy. Moderation uses the existing audit utility without message content.

Pages implement the requested controls. ThemeSync is inside Suspense and rechecks the account preference on pathname changes; only theme is cached in localStorage. Mutations broadcast response data in the same window, avoiding redundant refetches and stale settings synchronization. Dynamic task/member routes and query-driven personal-space content have Suspense boundaries for this Next version. Personal Space keys edit/save buttons separately to prevent a click becoming an immediate form submission; the date field handles native input/change events.

Last checks: 207/207 tests in 12 files; full lint/typecheck; changed-source formatting; final production build (39/39 pages, 959 ms compilation) passed. Browser tested actual seeded member login, task filters, search, to-do save/reload/edit/date/completion, notes, goals, profiles, privacy, settings, dark mode, chat editing and logout/relogin. At 390x844, all six main pages had document width 390. At 1440x900 dialog Tab wraps inside, Escape closes and restores the opener; Inter loaded. Desktop screenshot: C:/Users/donel/.codex/visualizations/2026/10/28/01a18347-0763-7b91-accc-1289d479dbf1/prax-functional-dark-desktop.jpg. Viewport reset; browser remains signed in as the seeded member. It was left at /space and was observed at /profile while handoff notes were being written. Local QA to-do, note, profile/project and edited chat message remain as demonstration data in the current process.

No DB/migrations/new dependencies/environment variables were added. Server restart clears workspace saves; multiple Node instances diverge. Sample rankings/activity are not a live ledger. Notification delivery and socket chat remain future work. Next best task: durable persistence once D-005 is resolved. Do not follow historical commit/push instructions without fresh authorization.

## Latest session - Profile header bug fix (2026-10-29)

Fixed the screenshot-reported profile identity overlap and square avatar rim in `src/components/profile/ProfileView.tsx`. Only the avatar now overlaps the banner; the circular rim, name, handle, bio, links and action stay correctly placed. Added local wrapping constraints, including exceptionally long unbroken display names. Shared Avatar and authentication code were not changed.

Verification: 172 tests across 10 files passed; full ESLint, standalone typecheck, scoped formatting and production build passed. Parent browser tested the exact component through a temporary development-only fixture in 17 cases at 1916,1080,768 and390 px; independent tester/coordinator reviewed saved geometry and screenshots. Authenticated page navigation itself was not visually exercised. Temporary fixture was removed before the final build; no new route remains. No commit, push or deployment.

Best next step: refresh `/profile` in the user's signed-in browser and review the corrected header. Historical foundation and cursor notes follow.

## Latest session - UI foundation (2026-10-28)

This section supersedes historical current-state and next-action statements below. Actual checkout: branch `main`, HEAD `e9f009c`, initially clean. This request covers the reusable frontend foundation only; existing screens and backend modules were preserved.

All 20 PDF pages were rendered and inspected. Added centralized CSS tokens, typed primitives, self-hosted Inter (400/500/600/700/800), PDF task artwork, and the functional development-only `/design-system` route. Native cursors now distinguish clickable, editable and disabled controls. See `DESIGN_SYSTEM.md` for structure, reference audit and usage.

Verified: 168 tests / 9 files, typecheck, ESLint, production build; desktop 1080 x 675 and mobile 390 x 844; font loading, form validation, tab/radio keyboard navigation, image selection/preview/removal, dialog focus wrapping/Escape/restoration, 44 px mobile controls / 16 px field text, no page-wide mobile overflow. Browser measurements: task card 182.25 px, artwork 79.5 x 75 px, radius 12.75 px. Production `/design-system` returned 404; trailing slash redirects to the canonical route. Existing protected dashboard still redirects.

Repository-wide Prettier reports existing formatting issues; changed source files were formatted separately. No commit, push or deployment was performed. Upload previews remain local. Global token/font changes propagate to existing consumers; comprehensive legacy screen fidelity review is deferred.

Best next step: review `/design-system` before authorizing application-screen work.

Handover document for the next engineer or agent picking up the PRAX Platform repository.

---

## 1. Current Goal and Phase

- **Product Goal:** Build the PRAX platform — an invite-only team workspace where members complete tasks, submit proof for rubric-based admin review, earn non-negative points and maintain daily streaks, and communicate via community chat and personal spaces.
- **Current Phase:** **Phase 7 (Rubric Engine and Points Boundary) Complete — Person 1 (Head Lead & System Architect) Deliverables 100% Complete**.
  - Editable scoring rubric engine (`src/lib/rubric/rubric-store.ts`) with versioning (`v1`, `v2`, ...), criterion validation, and max points calculation.
  - Server endpoints: `GET /api/rubric` (accessible to approved members & admins), `PUT /api/rubric` (admin-only, validates criteria, increments version, emits `RUBRIC_UPDATED` audit event).
  - Admin rubric management UI (`src/app/admin/rubric/page.tsx`): live fetch, modal editor allowing criteria additions, modifications, deletions, live score calculations, and save.
  - Person 1 ↔ Person 3 points transaction boundary (`src/lib/points/points-boundary.ts`, `dispatchApprovedPoints`) with idempotency keys (`pts_${submissionId}_${rubricVersion}`).
  - Strict 0-to-max server-side point validation rejecting negative, non-numeric, over-maximum, fractional, and malformed inputs.
  - Rollback / failure simulation in transaction boundary triggering safe 500 rejection and preventing dirty state.
  - 16 new tests in `src/lib/rubric/rubric.test.ts`. Full suite: **146/146 tests** across 7 test suites.
  - All checks pass: typecheck, lint, format, tests, build.
- **Handoff Target:** Ready for Person 2 (Frontend Lead) and Person 3 (Backend & Data Lead) to build member task flows, submission workflows, DB persistence, and leaderboard calculations.

---

## 2. Completed Work

- **Phase 0 (Reconnaissance & Setup):** Inspected runtime (Node 24, TS 5), initialized project memory files, verified empty repository.
- **Phase 1 (Product Architecture & Spec):** Created `MVP_SPEC.md` (roles, user lifecycle, review states, scoring constraints, ownership matrix, error catalogue) and `API_CONTRACTS.md` (IC-01 to IC-08).
- **Phase 2 (Minimal App Foundation):** Next.js 16 (App Router + Turbopack + TS strict mode), Tailwind CSS v4, centralized env helper (`src/lib/env.ts`), standard error envelope (`src/lib/errors.ts`), unit tests with Vitest 3, and health route (`GET /api/health`).
- **UI Design System Phase (All 20 Screens):**
  - Centralized design tokens matching `PRAX_Redesigned_High_Fidelity_Desktop_UI.pdf`.
  - Reusable atomic UI library: `Button`, `Badge`, `Card`, `Input`, `Avatar`, `StatCard`, `Tabs`, `Modal` (`src/components/ui/`).
  - Persistent layout shells: `MemberSidebar`, `AdminSidebar`, `TopNav`, `AppShell` (`src/components/layout/`).
  - Shared builder profile component: `ProfileView` (`src/components/profile/ProfileView.tsx`).
  - All 20 reference desktop screens implemented across 25 Next.js App Router routes.
- **Phase 3 (Authentication & Invite Codes — Person 1):**
  - Salted password hashing (`crypto.scrypt` with random salt and constant-time verification).
  - Passwordless magic link request and verification (`crypto.randomBytes(32)` high-entropy token, SHA-256 hash storage, 15-minute TTL, single-use invalidation).
  - Stateless tamper-proof signed session cookies (`prax_session`) using HMAC-SHA256, `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, 7-day expiration.
  - Public registration (`POST /api/auth/register`) with invite code validation and automatic placement into `PENDING_APPROVAL`.
  - Cryptographically secure invite code lifecycle (`ACTIVE`, `USED`, `EXPIRED`, `REVOKED`) with atomic check-and-increment.
  - Sliding-window rate limiter on login, verification, and registration endpoints.
- **Phase 4 (Onboarding & Approval State Machine — Person 1):**
  - Server-side state machine engine (`transitionUserStatus`) enforcing transitions according to `MVP_SPEC.md §3`.
  - Self-action guard preventing admins from approving, rejecting, suspending, unsuspending, or disabling themselves.
  - Mandatory reason validation for rejection, suspension, and disablement (minimum 3 non-whitespace characters).
  - Append-only, immutable audit trail engine (`src/lib/audit/audit.ts`) with automated recursive secret scrubbing.
  - Admin management endpoints: `GET /api/admin/users`, `POST /api/admin/users/:id/approve|reject|suspend|unsuspend|disable`, and `GET /api/admin/audit-log`.
  - UI integration: live member approval/rejection queue on `/admin/members` and real status polling with auto-redirect on `/onboarding`.
- **Phase 5 (RBAC and Route/API Protection — Person 1):**
  - Pure RBAC engine (`src/lib/auth/rbac.ts`) with granular permission definitions, role-to-permission mappings, deny-by-default validation, and resource ownership checks.
  - Next.js 16 Proxy Middleware (`src/proxy.ts`) providing server-authoritative route and API protection against direct navigation bypass.
  - Defense-in-depth API route guard enhancements (`src/lib/auth/guard.ts`) with permission, role, stale session, and resource ownership validation.
  - Detailed Permission Matrix and security threat mitigations documented in `SECURITY_NOTES.md`.
- **Phase 6 (Admin Review Queue & Review Efficiency — Person 1):**
  - Thread-safe in-memory submissions store (`src/lib/db/submissions-store.ts`) with pre-seeded test data.
  - Safe URL validator/sanitizer (`src/lib/utils/url.ts`).
  - Review API routes: `GET /api/admin/submissions`, `POST .../[id]/approve`, `POST .../[id]/reject`, `POST .../[id]/request-revision`.
  - Full 3-column review workspace UI (`src/app/admin/page.tsx`) with pending age badges, keyboard shortcuts, rubric scoring, and loading/empty/error states.
  - 15 tests in `src/app/admin/review-queue.test.ts`.
- **Phase 7 (Rubric Engine & Points Boundary — Person 1):**
  - Versioned scoring rubric store (`src/lib/rubric/rubric-store.ts`) with criterion validation and version history.
  - Endpoints: `GET /api/rubric`, `PUT /api/rubric`.
  - Person 1 ↔ Person 3 transaction boundary (`src/lib/points/points-boundary.ts`, `dispatchApprovedPoints`) with idempotency keys (`pts_${submissionId}_${rubricVersion}`).
  - Strict point bounds validation rejecting `-1`, `"thirty"`, `maxPoints + 1`, `15.5`, `NaN`.
  - Live interactive rubric editor UI (`src/app/admin/rubric/page.tsx`).
  - 16 tests in `src/lib/rubric/rubric.test.ts`.

---

## 3. Person 1 Deliverable Status (Milan — Head Lead & System Architect)

| Deliverable (per Task Allocation)          | Spec / Phase | Status           | Verification                            |
| :----------------------------------------- | :----------- | :--------------- | :-------------------------------------- |
| **1. Authentication & Access Flow**        | Phase 3      | ✅ 100% Complete | `auth.test.ts` (35 tests pass)          |
| **2. User Onboarding Logic**               | Phase 4      | ✅ 100% Complete | `state-machine.test.ts` (23 tests pass) |
| **3. Role-Based Access Control (RBAC)**    | Phase 5      | ✅ 100% Complete | `rbac.test.ts` (34 tests pass)          |
| **4. Admin Review Queue Engine**           | Phase 6      | ✅ 100% Complete | `review-queue.test.ts` (15 tests pass)  |
| **5. Review Efficiency Tools & Shortcuts** | Phase 6      | ✅ 100% Complete | `/admin` UI + keyboard shortcuts        |
| **6. Points Rules & Rubric Engine**        | Phase 7      | ✅ 100% Complete | `rubric.test.ts` (16 tests pass)        |

---

## 4. Exact Files Changed in Phase 7

### Added Files (3 files)

1. `src/lib/rubric/rubric-store.ts` — Thread-safe rubric engine with versioning and criteria validation.
2. `src/lib/points/points-boundary.ts` — Person 1 ↔ Person 3 transactional boundary service.
3. `src/lib/rubric/rubric.test.ts` — 16 unit and integration tests.
4. `src/app/api/rubric/route.ts` — `GET /api/rubric` and `PUT /api/rubric` route handlers.

### Modified Files

1. `src/app/api/admin/submissions/[id]/approve/route.ts` — Integrated point boundary validation, rubric versioning, and transaction dispatch.
2. `src/app/admin/rubric/page.tsx` — Live rubric management workspace with modal editor.
3. `src/lib/db/submissions-store.ts` — Added `rubricVersion` and `transactionId` to submission interface.
4. Memory files: `AGENT_HANDOFF.md`, `API_CONTRACTS.md`, `CHANGELOG_DEV.md`, `DECISIONS.md`, `PROJECT_STATE.md`, `SECURITY_NOTES.md`, `TEST_LOG.md`, `TODO_NEXT.md`.

---

## 5. Commands Actually Run and Results

All checks executed locally on macOS (Darwin 24.3.0, Node.js v24.15.0):

| Command                                       | Actual Result                                                                                                                                                                                                            | Exit Code  |
| :-------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------- |
| `npm run typecheck` (`tsc --noEmit`)          | Finished with 0 type errors                                                                                                                                                                                              | `0` (PASS) |
| `npm run lint` (`eslint .`)                   | 0 errors, 0 warnings                                                                                                                                                                                                     | `0` (PASS) |
| `npm run format:check` (`prettier --check .`) | All matched files use Prettier code style                                                                                                                                                                                | `0` (PASS) |
| `npm test` (`vitest run`)                     | 7 test files, 146/146 tests pass (`rubric.test.ts` [16], `review-queue.test.ts` [15], `rbac.test.ts` [34], `state-machine.test.ts` [23], `auth.test.ts` [35], `components.test.tsx` [15], `errors.test.ts` [8]) in 4.65s | `0` (PASS) |
| `npm run build` (`next build`)                | Next.js 16 Turbopack successfully compiled all routes + Proxy                                                                                                                                                            | `0` (PASS) |

---

## 6. Contract with Person 3 (Backend & Data Lead)

Defined in `API_CONTRACTS.md §IC-06B` and `DECISIONS.md §D-014`:

- **Boundary Service:** `src/lib/points/points-boundary.ts` (`PointsBoundaryService` / `dispatchApprovedPoints`).
- **Idempotency Key:** `pts_${submissionId}_${rubricVersion}`.
- **Contract Boundary:**
  - Person 1 validates awarded points (`0 <= pointsAwarded <= maxPoints`), attaches active rubric version, and dispatches to `PointsBoundaryService`.
  - Person 3 consumes this boundary event to write immutable `PointTransaction` records, increment user points balance, and calculate streaks.
  - Person 1 **does not** create a duplicate points ledger or mutate user balances directly.

---

## 7. Current Branch, Commit, and Remote

- **Current Branch:** `milan` (tracking `origin/milan`)
- **Remote:** `https://github.com/vinlandsag/PRAx-website.git`
- **Working Tree Status:** All Phase 7 source code and tests complete, passing 146 tests, ready for push.

---

## 8. Exact Next Steps for Team

1. **Push branch `milan` to `origin/milan`** and open Pull Request to `main`.
2. **Person 2 (Frontend Lead):** Pull `milan`/`main` to build Member Tasks view, Submission modal, Leaderboard UI, and Builder profiles.
3. **Person 3 (Backend & Data Lead):** Implement Task CRUD API routes, PostgreSQL/Prisma integration, and PointTransaction persistence adhering to IC-06B.

---

## 9. Copy-Paste Command to Run Project and Checks

```bash
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build && npm run dev
```

---

_Last updated: 2026-10-28T13:46:00+05:30 · Phase 7 Rubric Engine & Points Boundary Complete (Person 1 100% Done)_

## Textured cursor follow-up (2026-10-28)

Added small violet stipple-textured SVG arrow/hand cursors, controlled by --cursor-default/--cursor-pointer in tokens.css. Applied only for fine mouse pointers with hover and no forced colors. Text editing and disabled states retain native cursors; fallback auto/pointer remains. Browser verified both asset rendering and computed arrow/hand/text/not-allowed states. Production build, typecheck, scoped lint, 20 foundation tests and changed CSS formatting passed. Next action: inspect the texture on the open design-system page.

## Local website run check (2026-10-29)

Port 3000 already had a PRAX server. Starting another next dev instance returned EADDRINUSE, so the existing server was reused. Local GET /login returned HTTP 200. Requested opening http://127.0.0.1:3000 in Codex; UI returned queued. No application source changes. Next action: open the local website.

### Local run request (2026-10-29)

Started the existing Next.js development server on port 3000 (session 26883); reported Ready in 749 ms. No application code, interface, security policy or design decision changed. Existing process-memory reset limits apply. No tests/build rerun for this server-only action.

### npm terminal diagnosis (2026-10-29)

Read-only environment checks found Node v24.22.1 from the Codex bundled runtime, but no npm/npm.cmd on this terminal's PATH or in the standard Node install locations checked. package.json already defines dev as next dev. No attached user terminal was available, so its exact error is unverified. No application/configuration change, installation or test/build run. Direct node node_modules/next/dist/bin/next dev --port 3000 is the available equivalent here.

### Windows terminal runtime follow-up (2026-10-29)

User supplied CMD error: node is not recognized. Verified the absolute Codex runtime node.exe path executes and reports v24.22.1; standard Node installation paths checked were absent. Provided a quoted absolute-path launch command and official Node Windows installer guidance for node/npm on PATH. No installation, PATH modification, application code change or tests/build performed.

### Windows Node/npm setup completed (2026-10-29)

Resolved the user's CMD node/npm not recognized errors by installing the official Node.js v24.22.2 win-x64 archive (includes npm 11.19.1) at C:\Users\donel\AppData\Local\Programs\nodejs. Downloaded over HTTPS from nodejs.org/dist/latest-v24.x/ and verified SHA256 ca1bff5d8ead13c9f2ea404a176db46bd430704d5b5113734049fa365e7799e2 against the official checksum before extraction. Added only this directory to persistent User PATH, preserving existing entries; broadcast WM_SETTINGCHANGE. No machine PATH, execution policy, app code, dependencies, API or backend changes. Temporary archive/extraction directory retained under Windows Temp.
Passed (exit 0): CMD using Machine+User saved PATH resolved node/npm to the new install; node --version returned v24.22.2; npm --version returned 11.19.1; npm run dev -- --help invoked next dev --help successfully. This command verifies script resolution without starting another server. Tests/lint/build not run for environment-only setup. Existing CMD/terminal host may need full restart to inherit PATH. Next step: reopen terminal, cd to repository, npm run dev. Existing process-memory persistence limits remain.

### Development server handed to user terminal (2026-10-29)

User successfully invoked npm run dev, but Next detected the agent-started PRAX instance (PID 20028) on port 3000 and refused a duplicate project server. Verified PID was the Codex bundled node.exe and stopped that process, leaving the server stopped for the user's CMD launch. A Node net.createServer probe successfully bound and released 127.0.0.1:3000 (exit 0), confirming availability. No new persistent server was started. Earlier running-session notes are superseded. Stopping the process resets its temporary workspace/chat/upload state. No application code, dependency, API or security-policy change; no tests/build needed for this operational action. Next step: npm run dev from the user's CMD, then open localhost:3000.

### Git push readiness review (2026-10-29)

User asked whether they can push the current work. Read-only Git checks: branch main, HEAD e9f009c, origin https://github.com/vinlandsag/PRAx-website.git; many accumulated modified/untracked platform files, nothing staged. No branch, commit or push performed. Suggested committing current work on a new codex/ branch for review. Only required memory documents changed during this review.
Fresh passed commands: node node_modules/vitest/vitest.mjs run (235/235 tests, 14 files, 11.38 s); node node_modules/typescript/bin/tsc --noEmit (exit 0); node node_modules/eslint/bin/eslint.js . (exit 0). Git diff --check clean with core.safecrlf=false. git check-ignore confirmed .env, .env.local, node_modules, .next ignored; git ls-files found no tracked env/private-key/credential-named files in the checked patterns. Limited high-confidence secret marker scan over 162 tracked/nonignored candidate files found zero matches; no candidate file over 10 MiB. This is not a comprehensive secret or security audit. Production build not rerun; prior app-change build remains the last build evidence. No network fetch/push or remote write. Temporary process storage limits remain; saving source to Git does not persist runtime uploads/workspace data.

### Authorized donel branch delivery (2026-10-29)

The user explicitly requested committing and pushing all current PRAX work to https://github.com/vinlandsag/PRAx-website/tree/donel, superseding the earlier suggested codex/ branch. Fetched origin/donel at 405452c5417f797615d58a7f677699eb247931fa; it is an ancestor of the current e9f009c checkout (7 local commits ahead, 0 remote-only). Created local donel from the current checkout with origin/donel upstream, preserving all accumulated source/assets/tests/documentation. Main remains at its existing commit. Delivery is a normal fast-forward push; no reset, force push, deployment or new application behavior in this operation.
The commit includes the PDF-based design foundation, explicit Inter/assets, cursor/profile corrections, functional workspace controls, interaction-based public profiles, chat attachments and session documentation. Fresh preflight remains 235/235 tests (14 files), TypeScript and full ESLint passed; Git whitespace check clean. Limited secret-marker/large-file checks passed in the preceding readiness review, and env/dependencies/build folders are ignored. No new code change since those checks; build not repeated (previous production build passed). Runtime workspace/uploads remain process-memory data. Commit and remote receipt should be checked with git log/status and git ls-remote after delivery; this entry records scope and authorization before publishing.

Commit preflight note: first commit attempt failed because user.name/user.email are unset. Existing repository history uses PRAX Agent <prax-agent@local>; use that same neutral agent identity via per-command Git configuration for this delivery, without changing global identity or attributing the work to a guessed human account.

### Login screenshot diagnosis (2026-10-29)

User supplied a screenshot of magic-link mode showing a development token. Read-only inspection confirmed the request API generates a token but has no email delivery integration; the login page displays the token without completing verification, while a separate POST verification API exists. Password sign-in is implemented, with the documented local seeded member fixture. No live token from the screenshot was copied into code, logs or documentation. No application behavior changed or tests rerun. Clarify the requested screenshot change before altering authentication; local testing can use the password sign-in toggle. Main app delivery remains commit 409d475 on origin/donel, previously verified; this diagnosis only updates the required memory notes and is not committed/pushed.

# Person 3 — Phase 1 schema proposal awaiting review (2026-10-31)

`DB_SCHEMA.md` contains a logical schema/migration plan only; no ORM, migration, database constraint, product code, or test was added. It reuses the existing User and InviteCode contracts, defines Task/Submission/PointTransaction/Streak candidates, and keeps Person 4's Chat/Personal Space out of scoring and streak calculations.

Review requested before implementation: Person 1 should confirm durable user/invite fields, invite code hash/one-time return behavior, persisted role/status validation, and the `pts_${submissionId}_${rubricVersion}` approval award boundary. Person 2 should confirm task lifecycle mapping, submission fields/response projections, and resubmission/retry behavior. Person 4 should confirm the privacy exclusion. D-005 hosting/provider and ORM choice remain unresolved. No live coordination connector was available, so no sign-off is claimed. Do not create migrations or install an ORM until approvals and decisions are recorded.

# Phase 2 backend foundation handoff (2026-10-31)

Added `src/lib/api/request.ts` (bounded JSON object parser, now used by local dev login), `pagination.ts` (limit/offset), and `logger.ts` (allowlisted safe event logging), with unit tests. Route handlers remain thin Next.js App Router handlers, existing guard/error envelope is retained, fixtures remain test-only, and all persistence service routes remain guarded 503 seams. README documents Node 24/npm setup, local health URL and checks; `.env.example` still contains placeholders only. No database, ORM, API implementation or external service added.

Checks: 246/246 tests, ESLint, final tsc, webpack production build (47/47) passed. One tsc attempt overlapped Next's `.next/types` regeneration and failed; it was rerun successfully after build completion. Default Turbopack build hit a worker-port sandbox restriction twice; one-off webpack fallback succeeded. Temporary local server health returned 200/backend not_configured and was stopped. Follow-up: await Phase 1 database/schema review, then implement repository and service layers without weakening auth/ownership.

# Phase 3 task API handoff (2026-10-31)

Frontend contract has been reconciled in `API_CONTRACTS.md`: collection filters/status derivation, newest/points ordering, shared pagination, task detail checklist-as-requirements, and admin POST/PATCH scope are recorded. Existing `/api/tasks` and `/api/tasks/:id` handlers remain guarded 503 responses. The Phase 1 schema in `DB_SCHEMA.md` is still explicitly awaiting review, D-005/provider and ORM are unresolved, and no task repository exists. Do not add a runtime fixture or successful empty response to simulate persistence. Next step is approve task schema/provider and confirm lifecycle/revision semantics with Persons 1/2, then implement repository-backed routes and tests.

## Phase 3 task API handoff (2026-10-31)

Task list/detail and admin create/content PATCH are implemented against Prisma 7/PostgreSQL, with signed-session guard plus persisted approved User/role/name validation. The user reported that `npm run db:migrate:deploy` successfully applied the initial migration to Supabase. A local read-only `npx prisma migrate status` attempt returned a blank schema-engine error, so independent status verification is pending. Keep connection URLs private; configure an isolated `TEST_DATABASE_URL` before running DB integration tests. Auth user creation/current-user lookup remains disconnected: the development fixture is not seeded and production task requests need a persisted approved account plus matching signed session. Coordinate persisted IDs/status semantics with Person 1 and task/resubmission behavior with Person 2 before relying on production endpoints.

## Phase 4 submission lifecycle handoff (2026-10-31)

Member submission list/detail/create/edit/withdraw APIs are implemented. The user reported successful application of `20261031210000_submission_lifecycle` to Supabase on 2026-10-31. The user’s persisted account is revalidated; owner ID comes from session, and a submission becomes `SUBMITTED` on the current frontend POST. Edits/withdrawals are allowed in `DRAFT`/`SUBMITTED`; rejected/revision-requested resubmits create a new attempt. `TEST_DATABASE_URL` must point to a separately migrated disposable database for PostgreSQL integration tests. Phase 10 has since implemented admin review actions; persisted auth login/register and configurable rubric remain 503. No persistent upload system exists; current API accepts proof URL plus note only.

## Phase 5 transactional points handoff (2026-10-31)

`src/lib/points/service.ts` exports `dispatchApprovedPoints(prisma, payload)`. Phase 10's approval route now authorizes the signed-in admin and calls this service; it supplies the persisted reviewer ID, server-owned `mvp-default-v1`, and `pts_${submissionId}_${rubricVersion}` idempotency key. The service derives member/max from Submission/Task, conditionally approves SUBMITTED/UNDER_REVIEW, and inserts the unique PointTransaction in one Prisma transaction. It owns the atomic approval+ledger+streak change; callers must not separately maintain totals. Exact retry returns `alreadyProcessed:true`; conflicting retry fails. `GET /api/leaderboard?period=weekly|alltime` sums ledger rows; weekly begins Monday 00:00 IST. No migration is required. PostgreSQL integration/concurrency/rollback tests need a migrated disposable `TEST_DATABASE_URL`; the current environment could not reach it. Configurable rubric remains a 503 seam, so do not describe rubric editing as operational.

## Phase 6 leaderboard handoff (2026-10-31)

`GET /api/leaderboard` now returns `{entries,total,pagination,currentUser,userAhead}`. Pagination is `limit`/`offset` (default 20/0; max 100/100000); period accepts `weekly|alltime` and defaults weekly. The UI obtains its standing from `currentUser`, not by searching only the visible page. Eligibility is approved member plus at least one PointTransaction tied to a currently APPROVED Submission. Equal scores order by lowercase name then ID under `C` collation, producing unique ordinal ranks. Weekly boundary stays Monday 00:00 IST. Additive index migration `20261031230000_leaderboard_indexes` was generated/reviewed but not deployed. Run it only against the intended database after confirming `DIRECT_URL`; run opt-in leaderboard tests only with an isolated `TEST_DATABASE_URL`. Chat and Personal Space are excluded.

## Phase 7 streak engine handoff (2026-10-31)

Streak policy is D-028: approved submissions count by `reviewedAt` in Asia/Kolkata, including zero-point approvals; one full missed IST day resets current and longest persists. Login is not counted. `dispatchApprovedPoints` calls `public.record_approved_submission_streak(submissionId)` in the same transaction as approval and the points log. The new `StreakDay` table has one `(userId,activityDate)` row per day and RLS is enabled. The authenticated `/api/streaks` endpoint ignores caller-supplied IDs and returns 42 calendar dates of active-day data.

Manual rollout after reviewing the intended Supabase project:
1. From the repo terminal, run `npm run db:migrate:deploy` with this repo's real `.env.local`/`DIRECT_URL` configured. Do not paste connection strings into chat.
2. In Supabase Dashboard → SQL Editor, run the job setup SQL in `DB_SCHEMA.md`. If Cron is unavailable, enable `pg_cron` under Database → Extensions first.
3. Verify one `prax-refresh-streaks` row under Database → Cron Jobs or with the verification query documented in `DB_SCHEMA.md`.
4. Admin approval now calls `dispatchApprovedPoints`. The remaining manual step is to run `npm run test:integration` from a machine that can reach the separate `TEST_DATABASE_URL`; no schema migration is needed for Phase 10.

Do not run DB integration tests against the primary Supabase project. They require a separate migrated `TEST_DATABASE_URL`; 27 DB tests are presently skipped. No migration, database function, or Cron job was applied by this agent. Current checks: 320 tests passed, 27 skipped; lint/typecheck/Prisma validation and generation/scoped formatting/build passed. Full results are in `TEST_LOG.md`.

## Phase 8 security handoff (2026-10-31)

D-029 records the audit boundary. Route guard and Next proxy reject unknown role/status values. Persisted account validation selects only `id/name/role/status`; member submission detail queries include the session owner in SQL. Empty owner IDs fail closed. Points retry comparison ignores current task max because ledger `maxPoints` is an award-time snapshot. Tests cover these cases.

No score/streak code imports or queries Workspace, Chat, attachment, Todo, Note, Goal, or private profile data. Workspace/Chat APIs are guarded 503 stubs. The generic submission detail endpoint permits owner or approved ADMIN per API contract and includes author email; no frontend use was found, so review the field with API owners before extending access. Person 4 could not be contacted through available connectors; obtain explicit privacy sign-off when coordination is available. Admin approval and durable auth routes remain 503; Person 1 must bind `reviewedById` to the authenticated persisted ADMIN session before wiring `dispatchApprovedPoints`.

Verification: 329 tests passed; 28 PostgreSQL tests skipped without isolated `TEST_DATABASE_URL`. Lint, typecheck, Prisma validation, webpack build (47 static pages), and diff whitespace check passed. No Supabase database or Cron was accessed.

## Persisted auth and first-admin onboarding handoff (2026-11-01)

Registration, invite verification, password login, current-user lookup, invite admin management, pending-user list/approval, and guarded first-admin creation now use the existing User/InviteCode schema. There is no migration. See the Phase 12 contract and README for endpoint behavior and first-admin steps. After the database owner confirms the intended environment, use the local app to bootstrap exactly one admin; remove `FIRST_ADMIN_BOOTSTRAP_TOKEN` and restart immediately. Admin creates an invite (the raw code is shown only once), a member registers and awaits approval, then `/api/users/me` refreshes the persisted approval state.

Verification in this environment: 344 unit tests passed, 35 skipped; focused auth/admin suite 106 passed; typecheck, lint and `npx next build --webpack` passed. Default Turbopack build failed due sandbox process/port restriction. Auth PostgreSQL integration tests were not run because `npm run test:integration` failed its separate-test-host reachability preflight before executing tests. User's earlier 31/31 run predates these auth tests. No DB writes, migrations, seed, deploy, commit or push.

Known remaining work: run the new auth integration tests against separate migrated `TEST_DATABASE_URL`; coordinate Person 5 release environment; configure/verify Cron; implement remaining admin reject/suspend/disable/unsuspend and configurable rubric; decide durable admin audit model and shared rate limiting. Prior Phase 8 statement that durable auth routes remain 503 is superseded by this section. Do not use the primary Supabase project for tests.

## First-admin bootstrap HTTP 500 follow-up (2026-11-01)

User verified `migrate status` up to date and a read-only runtime `DATABASE_URL` `SELECT 1` works; bootstrap still returned HTTP 500. Likely issue: Prisma raw-query result decoding of the advisory lock's PostgreSQL `void` value. Local code now executes that transaction-scoped lock inside a materialized CTE and returns an integer scalar. Focused auth test/typecheck/targeted lint pass. Restart the local Next server and retry with a newly chosen password only after confirming `FIRST_ADMIN_BOOTSTRAP_TOKEN` remains set. The earlier password shared in chat is exposed. The retry remains unverified; no database change was made by the agent.

The user retried and still got HTTP 500. Bootstrap now logs only a fixed stage label and sanitized Prisma error code. After restarting the local Next server, retry once with a fresh password, then copy only the JSON diagnostic line from the server terminal. Do not share password/token/URL or raw request content. Focused auth/logger tests pass 15/15; runtime database transaction remains unresolved.

The latest user diagnostic was `P2028` at `database_transaction`. The bootstrap Prisma transaction now has explicit `maxWait: 10_000` and `timeout: 15_000` because the default connection wait is a likely cause. Restart the dev server and retry once with a fresh password. If it still fails, share only the safe JSON log line. Tests 15/15, typecheck and targeted lint pass. No DB write/migration or commit/push.

User reports the next bootstrap request succeeded with HTTP 201 in 5.1 seconds. First admin now exists in the user's configured database. Operator must remove `FIRST_ADMIN_BOOTSTRAP_TOKEN` from local `.env.local` and restart, then sign in and create the invite in Admin → Members. Bootstrap code/diagnostics are still uncommitted and unpushed on local `main`.
# Phase 5 handoff — Dashboard and disconnected tabs (2026-11-01)

The `/api/dashboard` retry is now backed by Prisma and the existing approved-data sources. It checks the persisted signed-in account, returns the existing response contract, and does not read Workspace/Chat data. Tests: `npm test -- --run src/app/api/dashboard/dashboard-route.test.ts` (4/4 pass); `npm run typecheck` (pass). No migration/database mutation occurred.

For the next integration pass, use `API_CONTRACTS.md` for the verified remaining-tab matrix. Do not try to persist Personal Space/Chat/attachments or moderation reports until Person 4 privacy and ownership boundaries plus storage/transport are reviewed. Notifications, configurable rubric, durable audit, and admin user lifecycle routes also lack required schemas or agreed semantics. The current API contract intentionally returns 503 for these seams. Existing local modifications and profile/settings migrations were present before Phase 5 and must be preserved; migrations remain unapplied. Next best step: agree domain contracts with the responsible teammates, then implement additive Prisma migrations and endpoint-specific tests for the highest-priority area.
# Phase 6 API/database integration audit (2026-11-01)

The Phase 5 Dashboard route was reviewed against the repository's Prisma 7/PostgreSQL adapter, signed-session/persisted-account checks, standard response envelope, no-store policy, and safe logger. All database access flows through `getPrismaClient()`; no duplicate Supabase JS or direct `pg` route access is present. No schema change or code correction was indicated, and the existing response contract remains unchanged. The independent reads have no multi-write consistency requirement; `getLeaderboard()` already handles its ranking reads at repeatable-read isolation. Focused Dashboard tests (4/4), typecheck, and `git diff --check` passed. No database was contacted.
# Phase 7 testing handoff (2026-11-01)

Dashboard/Settings gained page-level UI tests; Profile's existing route/service/component tests were rerun. `npm test` passed 379 tests with 35 integration tests skipped; `npm run typecheck` and targeted ESLint passed. Full `npm run lint` still fails with 13 pre-existing errors (73 warnings) under `praxora-admin`. Default Turbopack `npm run build` is blocked here by a child-process port permission error; `npx next build --webpack` passed (50/50 static pages). `npm run test:integration` stopped at the safe preflight because the isolated test database is unreachable, so it ran no tests. UI persistence was simulated via mocked GET/PATCH responses; a live database save/reload and authenticated browser check remain outstanding. No database mutation occurred.
# Phase 8 agent handoff — connected pages and remaining Retry seams (2026-11-01)

## Verified current state

- Dashboard: `/dashboard` → `GET /api/dashboard`, implemented with Prisma and the existing ledger/submission/streak/leaderboard records.
- Profile: `/profile` editor → `GET/PATCH /api/users/me/profile`, self-only and backed by the existing `User` row plus server-derived stats.
- Settings: `/settings` → `GET/PATCH /api/users/me/settings`, self-only `UserPreferences` persistence; account edits reuse Profile API.
- Tasks, submissions, leaderboard, streaks, admin review, invite/member approval, and persisted auth have API implementations in this worktree. See `API_CONTRACTS.md`; use integration results with their stated database limitations.
- Root cause of the original Retry screens was explicit `pendingEndpoint` 503 behavior. Dashboard was replaced with a real handler; Profile/Settings received dedicated handlers. Other 503 seams are listed in the API contract and TODO.

## Next agent steps

1. Preserve the current dirty worktree on `main`; do not reset, clean, stage, commit, or push unrelated user changes.
2. For live Profile/Settings persistence, first confirm privately that `.env.local` points to the intended Supabase project. Do not print/share credentials. Review `20261101170000_user_profile_fields` and `20261101173000_user_preferences`; run read-only `npx prisma migrate status`. Apply reviewed migrations only with the database owner's approval, then run `npm run db:migrate:deploy` against that confirmed target and verify status again.
3. Restore reachability of the isolated `TEST_DATABASE_URL` and run `npm run test:integration`. The runner has a database identity/reachability guard; the last attempt stopped before Vitest and created no fixtures.
4. With a persisted approved account, verify Dashboard load; Profile edit/reload; Settings preference edit/reload; anonymous denial; same-origin writes; and a second user cannot read/update the first user's records. Capture only status/behavior, never credentials or private profile data.
5. Coordinate Person 4 ownership/privacy and storage/transport before Workspace, Chat, attachments, or reports. Decide persistence/event semantics before notifications, rubric versioning before configurable rubric, audit retention before audit log, and allowed state transitions before admin reject/suspend/disable/unsuspend.
6. Keep the release limitations visible: full lint has 13 pre-existing errors/73 warnings in `praxora-admin`; default Turbopack build is sandbox-blocked, while Webpack build passed; database integration and authenticated browser checks remain outstanding.

Latest evidence is recorded in `TEST_LOG.md`. Phase 8 is documentation-only; no code/schema/database changes or deployment were made. Existing local changes remain uncommitted/unpushed.
# Admin login troubleshooting (2026-11-01)

The user's latest screenshot displays `Too many requests. Please try again later.` Verified source: `src/lib/auth/rate-limit.ts` sets login policy to 5 attempts per 15 minutes; the Map is in process memory. `src/app/api/auth/login/route.ts` checks this limiter before parsing credentials or looking up the account, so the screenshot does not indicate whether the email/password are valid. A full local dev-server process restart clears this in-memory counter; alternatively wait 15 minutes after the last attempt. Do not keep submitting attempts.

After cooldown, sign in using the exact email and password entered when the first-admin bootstrap returned 201, and ensure the running app points to the same database used for bootstrap. The email visible in the screenshot appears different from the address shown in the earlier bootstrap terminal exchange. Do not put either address/password or `.env.local` values in shared logs. If the original password is unavailable, don't attempt another bootstrap or manually edit Supabase; the first-admin endpoint refuses once an ADMIN exists and no password reset flow is implemented. A database-owner-approved password recovery path would be needed. No login retry, account mutation, code change, or database operation was performed in this diagnosis.
# Latest handoff — sign-out from inactive account (2026-11-01)

Added a Sign out button to the shared TopNav so account-status API failures do not hide logout. It POSTs to the existing `/api/auth/logout`, which clears the session cookie, then redirects to `/login`; failed requests show an accessible error and keep the user on the page. `TopNav.test.tsx` covers both outcomes (2/2 pass). Typecheck, targeted ESLint/Prettier, `git diff --check`, and `npx next build --webpack` passed (50/50 pages). No schema/API change. User screenshot displayed `Your account is not active`; logout only clears the session and does not reactivate the account. If account access is needed, an administrator must separately review the persisted status. The user's pre-existing dirty changes remain; do not discard or reset them.
# Latest handoff — registration 500 diagnosis (2026-11-01)

The user reported `POST /api/auth/register 500` with only `unexpected_error`. Registration's catch previously omitted safe failure context unlike first-admin bootstrap, preventing diagnosis. It now logs allowlisted stage and Prisma code, covered by an injected P2028 route test. The earlier root cause remains unconfirmed until a retry produces the new safe stage/code. No DB/schema/API change. Never ask the user to share the invitation/password/email; the invite was visible in their screenshot and should be revoked by the issuing admin if still active.

The user then supplied `stage=database_transaction`, `code=P2028`. Registration was given the same explicit Prisma transaction limits as bootstrap (10-second maxWait, 15-second timeout). Auth route tests and typecheck pass; live confirmation is still needed. Use a fresh invite because the screenshot exposed the prior code. Do not ask for credentials or the code.
# Latest handoff — invite registration waiting page (2026-11-01)

Fixed the registration/onboarding seam: successful registration now issues the existing signed HttpOnly cookie for the server-created pending MEMBER, allowing the existing `/onboarding` page and `GET /api/users/me` to work immediately. The page polls persisted status every five seconds and redirects to dashboard only when approved. Middleware already restricts pending sessions to onboarding/current-user status and rejects workspace page/API access. No schema/migration change. Focused auth/RBAC/onboarding tests passed 52/52. Typecheck, targeted ESLint/Prettier, diff check, and webpack build results are in TEST_LOG. Live DB/browser confirmation remains pending. Preserve all other existing dirty files.

## Requested delivery to `milan` (2026-11-01)

The user authorized committing and pushing the current connected Profile/Settings/Dashboard and auth/onboarding changes to `origin/milan`. The checked-out `main` is a fast-forward descendant of `origin/milan` (`origin/milan...HEAD` was 0/4 before this delivery), including the already merged Juel PR #8. A normal fast-forward push may carry that existing main merge commit to `milan`; do not force-push, deploy, or run DB commands.

## Stage 3 handoff — chat and Personal Space UI (2026-11-01, Person 4)

Done: types split, `src/lib/workspace/use-chat.ts` and `use-space.ts`, `src/components/chat/ChatReactions.tsx` and `ChatRulesDialog.tsx`, rewritten `src/app/chat/page.tsx`, updated `src/app/space/page.tsx` and `GlobalSearch.tsx`, filter fix, tests. The contract the UI expects is under "PLANNED chat and Personal Space contract" in API_CONTRACTS.md.

Next (each needs the owner's "go"): Stage 4 add the Prisma models and write migration SQL for review (do not apply it); Stage 5 build the routes, services, authorization and isolation tests; Stage 6 D-003 stays PROPOSED until the team confirms. Known pending: the Attach button still posts to the 503 `/api/chat/attachments` stub and will fail; attachments are blocked on a team answer (files versus links, storage). Until Stage 5 the chat and space pages cannot load data; that is expected, not a regression to patch with fake data (D-018, D-021).

Environment note: `npm run typecheck` needs the generated Next types (`.next/types`, created by `npx next typegen`, `next dev` or `next build`); without them it reports `LayoutProps` not found in `src/app/layout.tsx`. Whole-repo lint failures are all inside `praxora-admin/` and were not touched.

## Stage 4 handoff — Personal Space and chat schema (2026-11-01, Person 4)

Done: `prisma/schema.prisma` (additive) and `prisma/migrations/20261101190000_personal_space_and_chat/migration.sql`. Review the SQL before anything touches a database. Apply only to the owner's development database after an explicit "go": `npx prisma migrate status`, then `npm run db:migrate:deploy`. A fresh development database applies all earlier migrations first, and the streak migration grants to the Supabase roles `service_role` and `postgres`, so the database must be a Supabase project (or define those roles). Schema review by Mariya happens on the PR.

Next (needs the owner's "go"): Stage 5 builds the routes and services described under "PLANNED chat and Personal Space contract" in API_CONTRACTS.md, with owner-scoped queries (D-039) and the isolation tests; integration tests need `TEST_DATABASE_URL`. API code must bump `ChatMessage.updatedAt` on edits, pins, deletes and reaction changes, and must enforce the emoji palette and the 100-item caps (the database does not). Stage 6 (D-003) stays PROPOSED. Attachments remain deferred and the Attach button is untouched.
