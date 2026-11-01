## Profile connection follow-up (2026-11-01)

- [x] Connect Profile reads/writes to the persisted signed-in User through a self-only API.
- [x] Add validation, ownership/approval revalidation, field projection, duplicate-handle handling, session-name refresh, and UI loading/error/success/empty states.
- [x] Add additive Prisma migration and unit tests without applying it to a database.
- [ ] Review `20261101170000_user_profile_fields` and apply it to the intended Supabase project after confirming `.env.local` target; then sign in as a persisted approved account and verify profile save/reload in the browser.
- [ ] Implement public member profile separately with an explicit public-field projection and portfolio privacy check.
- [ ] Plan Personal Space persistence. Keep Chat and Personal Space separate from points/streak queries and obtain Person 4's privacy sign-off before defining Chat storage.

## Settings connection follow-up (2026-11-01)

- [x] Persist theme, review/streak/chat notification preferences, and portfolio visibility under the existing User identity.
- [x] Reuse the own-profile endpoint for account name/handle/avatar and keep email/role read-only.
- [x] Add self-only validated settings GET/PATCH routes and hydrate ThemeSync from persisted preference.
- [x] Add route/service/UI regression tests; record final verification in TEST_LOG.md.
- [ ] Review the profile and preferences additive migrations and apply them to the intended Supabase project only after verifying `.env.local`; then reload/re-login and verify saved settings.
- [ ] Connect notification preference values to an actual delivery service when implemented.
- [ ] Enforce `showPortfolio` in a future public member profile API; that read currently remains unavailable.

## Phase 9 — Performance tuning

- [x] Inspect task browse/detail, submissions, leaderboard, profile/streak paths, Prisma query shapes and current indexes.
- [x] Select isolated test DB as the benchmark environment; recorded D-030.
- [x] Configure local `TEST_DATABASE_URL`; verify the Supabase project differs from application and migration projects.
- [x] Record a synthetic dataset and before/after endpoint p50/p95 in TEST_LOG.md.
- [x] Make the measured submission-history query projection smaller and add a regression test; repeat measurements. All seven measured route p95s are under 2 seconds in this environment.
- [ ] Capture query plans if another tuning change is proposed; current route measurements did not justify further query/index/cache changes.
- [ ] Implement `/api/workspace` before measuring profile reads.
- [x] Re-run the PostgreSQL suite after timestamp precision, points fixture cleanup, and task category isolation fixes (user reports 31/31 tests passed across 5 files).

## Phase 10 — Team integration

- [x] Implement persisted admin review queue, approve, reject, and revision-request routes using the current UI contracts.
- [x] Derive reviewer identity and rubric version server-side; connect approval to one atomic points ledger/streak transaction.
- [x] Add signed-session route-handler core-loop fixtures and denial, forged-field, invalid-score, rejection, revision, and resubmission tests.
- [x] Add `npm run test:integration` with separate-database identity check and read-only reachability/schema preflight.
- [x] Run `npm run test:integration` against the separate migrated database after latest fixes (user reports 31/31 tests passed across 5 files; this environment could not connect independently).
- [ ] Coordinate with Person 1 on persisted login/registration and Person 1/2 on when configurable rubric storage should be implemented. Those endpoints remain 503.
- [ ] Keep Person 4's Chat/Personal Space privacy boundary separate; no related query or score dependency was introduced.

# TODO_NEXT.md

## Backend integration follow-up (2026-11-01)

- [x] Select Supabase Postgres hosting and Prisma 7 as sole ORM/migration path (D-024).
- [x] Exclude unused duplicate Supabase JS/SQL schema scaffold from branch integration; retain main's frontend changes.
- [x] Resolve local merge conflicts and run unit tests, lint, typecheck, Prisma validation, and production webpack build.
- [x] Review and commit the local merge on `milan` (`9eb4d7b`).
- [ ] Push `milan` to origin so the GitHub PR can update.
- [ ] Have Person 4 review the Chat/Personal Space privacy boundary before any schema adoption for those domains.
- [ ] Person 1 to connect persisted auth and admin review to points approval service.
- [ ] Run PostgreSQL integration tests only against isolated migrated `TEST_DATABASE_URL`.

## Authorized GitHub delivery of current work (2026-10-31)

User explicitly requested pushing the current changes to GitHub; continue using the previously selected donel branch at origin https://github.com/vinlandsag/PRAx-website.git. Fetched origin/donel and verified it matches local base 409d475 (0 ahead, 0 behind) before this delivery commit. Scope includes the backend cleanup, notification UI, retained development-only member account, Node 24/upload configuration and current handoff docs. Local-only hosting clarification remains in effect; this Git push does not deploy a website.

Fresh pre-push checks passed: 226 tests/13 files in 8.91 s; tsc --noEmit and full ESLint exit 0; Git whitespace check clean. Limited scan of 157 text candidates found no high-confidence secret markers or configured private session key. .env.local, .next, node_modules and .vercel remain ignored; only blank .env.example is included. Last production build is the passed 47/47 hosting preflight; it was not repeated for this Git-only action.

No global Git author identity is configured; use existing repository convention PRAX Agent <prax-agent@local> for this commit command only. Publish normally to donel, without force pushing or changing main; verify HEAD against the remote receipt afterward. This note records scope/checks before commit/push so the final delivery hash is available from Git history. Keep the local test account and existing local server; do not restart cloud hosting.

## Latest clarification — run locally (2026-10-31)

User clarified “host it” means local hosting. This supersedes the pending Vercel deployment/sign-in next step. Do not continue cloud deployment or request Vercel authorization for this task. Prior device-login exec session 44678 is no longer available; no site was deployed. Existing hosting-preparation files remain harmless local changes; no application code changed in this run.

Started npm run dev -- --hostname 127.0.0.1 --port 3000 using installed Node/npm (exec session 41439), ready in 728 ms. Confirmed health HTTP 200/environment development and login page HTTP 200; queued the local login browser panel. Server remains running on loopback only. The original local member test account is preserved; backend-dependent data remains disconnected. No secret, commit, push or remote deployment. Tests/lint/build not repeated for this server-only action. Next step: open http://127.0.0.1:3000/login and use the retained test credentials.

## Hosting request — pending provider sign-in (2026-10-31, D-023)

- DONE: inspect hosting/account setup; choose native Next.js deployment without changing framework.
- DONE: .vercelignore secret-safe upload allowlist; Node 24.x package/lock metadata; 17 inclusion/exclusion checks and successful fresh production build.
- PENDING USER: finish Vercel device sign-in using the link shown in chat and reply Done. CLI session 44678 awaits authorization; temporary unauthenticated hosting was unavailable.
- NEXT: verify authenticated account/project scope, deploy the current local source and verify actual ready URL/login/health responses. No real deployment yet.
- KEEP: local test account, production auth restrictions, removed mock services, current dirty work and GitHub branch history. Do not upload .env.local, enable online fixture login, or silently publish a stale GitHub checkout.

## Latest correction — keep local test account (2026-10-31, D-022)

- DONE: restore and retain member@prax.build / MemberPass123! for local npm run dev; no credential prefills or production fixture access.
- DONE: local current-user read, HttpOnly signed development-only cookie, private key setup, Origin/Host checks, password verification and rate limits.
- DONE: reject development-issued fixture cookies outside development, including when the private signing key is reused.
- DONE: 226 tests/13 files, lint, typecheck, formatting/build and live login/me/dashboard smoke checks; temporary verification server stopped.
- KEEP: this test member during later cleanup unless the user explicitly requests otherwise. Keep the rest of D-021 cleanup; real data-backed features remain unavailable until implemented.
- NEXT BEST: start npm run dev and sign in with the retained test member; backend team can then implement real account/workspace service contracts without restoring fake runtime data.
- No new commit or push; existing local cleanup on donel preserved.

## Current tasks — real backend integration after cleanup (2026-10-29, D-021)

- DONE: user-authorized removal of runtime mock APIs/stores, seed accounts/data, sample catalog/rankings/profiles, fake metrics/activity and success-on-error fallbacks.
- DONE: retain typed UI/contracts, explicit service-unavailable responses, loading/retry/empty states and secure server-side session/role/status boundaries. No prototype login remains.
- DONE: functional notification dialog with real API request seam, error/retry/empty/list/unread states, accepted mark-all-read updates, dismissal/focus and settings link. No fake unread dot/delivery.
- DONE: remove starter metadata/icons, exposed magic token UI, prefilled credentials and fabricated onboarding info; provide truthful README and blank .env.example; remove built-in signing keys.
- DONE: 212 tests, lint, typecheck, production build (47/47), scoped formatting and browser/live HTTP smoke checks.
- NEXT BEST: backend team implements real authentication/current-user lookup and supplies real accounts, persistence and current account/ownership validation. Then connect workspace/task/notification and other documented contracts, including transactional points and secure durable media.
- OPEN: real notification read persistence/delivery, actual uploads/download ranges/scanning policy, auth email integration, production operation and device/browser coverage. No database/provider choice made.
- DELIVERY: current cleanup is local on donel after published 409d475; do not automatically push. The older process-memory features and running agent server notes below are historical. User-owned server on port 3000 was reused during verification.

## Latest requested follow-up — interaction profiles and media chat (2026-10-29)

- DONE: profiles open from chat/leaderboard names and avatars with correct return action; no standalone Members section/directory API.
- DONE: existing approved accounts viewable before first workspace visit; safe public projection and portfolio privacy; labelled sample profiles without auth records.
- DONE: select/drop/preview/remove/send up to 3 image/video/file attachments, attachment-only messages, errors/retry, protected content delivery and video ranges, message-deletion cleanup.
- DONE: server size/type/signature/ownership checks, quotas/expiry, case-sensitive multipart regression, prototype extension rejection, Next proxy buffer alignment.
- DONE: 235 tests, full lint/typecheck/scoped format/build; browser profile and media-send/playback checks; live HTTP document/range/auth/12 MB upload checks.
- NEXT BEST: durable authorized workspace/media storage after D-005. Current uploads reset with the server.
- OPEN verification: in-app browser cancelled save-to-disk; new mobile viewport check timed out. Recheck these on a working browser/download connection. No new deployment/commit/dependency.

## Latest cursor follow-up (2026-10-29)

- DONE: reference-style rounded dark arrow and matching hand with pale outline and static violet halo.
- DONE: transparent PNG exports, SVG authoring sources, aligned hotspot tokens, light/dark preview, asset serving checks, 207 tests, lint/types/scoped formatting/build.
- NEXT: refresh /profile and inspect the actual system pointer on normal, clickable, text and disabled controls. Browser automation connection currently fails, so this visual check remains unverified.
- Prior member-flow work and its durable-storage next step below are unchanged. No new screen, deployment, dependency or backend work in this follow-up.

## Latest requested follow-up (2026-10-29)

- DONE: functional global search, combined task category/status/search/sort and correct task-detail id.
- DONE: detailed private to-dos with custom difficulty, priority, date, completion and view/edit/remove; private filters; notes/goals editors and shortcuts.
- DONE: weekly/all-time changes podium/list/standing using labelled sample rankings.
- DONE: chat three-dot actions, shared stream, author/admin enforcement and moderation audits.
- DONE: editable own profile/skills/current project/portfolio; add-portfolio empty state; public profile privacy.
- DONE: saved account/theme/notification/privacy preferences, dark mode, security information and session sign-out.
- DONE: 207 tests, full lint/type/build, scoped formatting, authenticated browser checks, mobile overflow and keyboard/font verification.
- NEXT BEST: durable workspace persistence after D-005; preserve private ownership and chat permission tests.
- OUTSIDE THIS FIX: live points-ledger/activity integration, real notification delivery, production chat transport (D-003), hosted photo uploads and cross-browser/device checks.
- No commit, push, DB operation or deployment was performed. Older phase/foundation next-actions below are historical.

Prioritized task list. Each task has a status, owner, dependency, and acceptance criteria.

> Use ISO dates (YYYY-MM-DD). Record facts, not guesses.

---

## Active Tasks

### Phase 7 Close-out / Phase 8 Tasks & Submissions (Person 3)

| Priority | Task                                              | Status | Owner | Depends On | Acceptance Criteria                                                                              |
| -------- | ------------------------------------------------- | ------ | ----- | ---------- | ------------------------------------------------------------------------------------------------ |
| P0       | Implement Phase 7 Rubric Engine & Points Boundary | DONE   | P1    | Phase 6    | Editable rubric, versioning, contract with Person 3, boundary validation, 146/146 pass (P1 100%) |
| P0       | Decide DB hosting (D-005)                         | DONE   | P3    | —          | Supabase/PostgreSQL and Prisma ORM 7 recorded in D-024                                           |
| P1       | Sign off `MVP_SPEC.md` assumption A-003           | TODO   | All   | Phase 1    | A-006 superseded by user-confirmed D-028; confirm remaining A-003 separately                     |
| P1       | Sign off integration contracts IC-01 to IC-08     | IN_PRG | All   | —          | IC-01, IC-04, IC-06, IC-06B, IC-Admin-Review AGREED                                              |
| P1       | Decide real-time approach (D-003)                 | TODO   | P4    | —          | D-003 row updated in `DECISIONS.md`                                                              |

### Phase 8 — Person 2 (Frontend) & Person 3 (Backend) Tasks & Submissions

| Priority | Task                                                                                                          | Status | Owner | Depends On  | Acceptance Criteria                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------- | ------ | ----- | ----------- | ------------------------------------------------------------------------------------------------- |
| P1       | Implement Task creation, listing, and detail APIs (`GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks`) | DONE   | P3    | Phase 7     | Implemented; auth persistence and DB integration remain pending                                   |
| P1       | Implement Submission workflow (`DRAFT` -> `SUBMITTED` -> `UNDER_REVIEW` -> `APPROVED`/`REJECTED`)             | IN_PRG | P3/P2 | Tasks API   | Member/admin APIs implemented; PostgreSQL core-loop suite awaits reachable TEST_DATABASE_URL      |
| P1       | Implement Points Calculation Engine & Streaks Cron                                                            | IN_PRG | P3    | Submissions | Engine and review integration implemented; verify DB-time fix and live Cron setup in test project |
| P1       | Install Prisma ORM and generate schema v1                                                                     | DONE   | P3    | D-024       | Prisma 7 schema/migrations generated; latest additive migration pending deployment                |

---

## Completed Tasks

| Task                                                  | Completed  | Notes                                                                                                                                                               |
| ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create project memory files                           | 2026-10-27 | 9 files created                                                                                                                                                     |
| Phase 0 reconnaissance                                | 2026-10-27 | Report written; all acceptance criteria met                                                                                                                         |
| Phase 1 MVP spec                                      | 2026-10-27 | `MVP_SPEC.md` written; `API_CONTRACTS.md` updated; all acceptance criteria met                                                                                      |
| Initialize git repository & first commit              | 2026-10-27 | Commit `d855889` on `main`                                                                                                                                          |
| Create `.gitignore` and `.env.example`                | 2026-10-27 | Verified no secrets committed                                                                                                                                       |
| Scaffold Next.js 16 + TypeScript project              | 2026-10-27 | App Router, TS strict, Turbopack                                                                                                                                    |
| Configure Tailwind CSS v4                             | 2026-10-27 | `@tailwindcss/turbopack` and `tailwindcss` v4 configured                                                                                                            |
| Configure Vitest test runner & coverage               | 2026-10-27 | Vitest 3 configured with `@vitejs/plugin-react`                                                                                                                     |
| Implement `src/lib/errors.ts` standard API envelope   | 2026-10-27 | MVP_SPEC §8 error codes typed; 8 unit tests in `src/lib/errors.test.ts` passing                                                                                     |
| Implement `src/lib/env.ts` centralized validator      | 2026-10-27 | Typed env access with production required guards                                                                                                                    |
| Implement `GET /api/health` route                     | 2026-10-27 | Public health endpoint returning 200 OK                                                                                                                             |
| Write comprehensive `README.md`                       | 2026-10-27 | Prerequisites, setup, commands, project structure                                                                                                                   |
| Run full CI verification suite locally                | 2026-10-27 | `typecheck`, `lint`, `format:check`, `test`, `build` all pass                                                                                                       |
| Adopt PRAX UI Design System (D-007)                   | 2026-10-28 | Aligned with `PRAX_Redesigned_High_Fidelity_Desktop_UI.pdf`                                                                                                         |
| Implement design tokens & Tailwind theme              | 2026-10-28 | `src/lib/design-tokens.ts` and `@theme` in `src/app/globals.css`                                                                                                    |
| Build atomic UI component library                     | 2026-10-28 | Button, Badge, Card, Input, Avatar, StatCard, Tabs, Modal in `src/components/ui`                                                                                    |
| Build Member & Admin workspace shells                 | 2026-10-28 | Persistent sidebars, top navigation, breadcrumbs, user stats, responsive drawer                                                                                     |
| Implement all 20 desktop screens from reference PDF   | 2026-10-28 | Auth, Onboarding, Dashboard, Tasks, Submissions, Leaderboard, Streaks, Space, Profile, Settings, Chat, Admin Queue, Task Mgr, Editor, Members, Rubric, Moderation   |
| Refine tokens & WAI-ARIA accessibility (D-008)        | 2026-10-28 | Centralized tokens, WAI-ARIA tabs/inputs/modals/buttons, extracted ProfileView component, 23/23 tests pass                                                          |
| Refine ProfileView fidelity (D-009)                   | 2026-10-28 | Banner tagline, 8-ray star graphic, 4 standalone metric cards, inline links, stacked skills & currently building, momentum bar chart matching Pages 10 & 11         |
| Verify UI build & smoke test all routes               | 2026-10-28 | 23/23 unit tests pass, Turbopack build succeeds across all 25 routes                                                                                                |
| Implement Phase 3 Auth & Invite codes (D-004/D-010)   | 2026-10-28 | Password + magic link auth, signed session cookies, invite lifecycle (ACTIVE/USED/EXPIRED/REVOKED), sliding-window rate limiter, 35 new tests (58 total pass)       |
| Implement Phase 4 State Machine & Onboarding (D-011)  | 2026-10-28 | Lifecycle state machine, self-action guards, secret-scrubbed audit trail, admin user routes, live UI on /admin/members & /onboarding, 23 new tests (81 total pass)  |
| Implement Phase 5 RBAC & Route/API Protection (D-012) | 2026-10-28 | Centralized RBAC engine, deny-by-default, permission matrix, Next.js 16 Proxy Middleware, resource ownership, role tampering/stale session defense (115 total pass) |
| Implement Phase 6 Admin Review Queue (D-013)          | 2026-10-28 | 3-col review workspace, pending age badges, keyboard shortcuts, safe proof links, server-validated approve/reject/revision, 15 new tests (130 total pass)           |
| Implement Phase 7 Rubric Engine & Points (D-014)      | 2026-10-28 | Versioned rubric store, GET/PUT /api/rubric, interactive admin UI, Person 3 transaction boundary, idempotency, strict bounds, 16 new tests (146 total pass)         |

---

_Last updated: 2026-10-28 · Phase 7 Rubric Engine & Points Boundary Complete (Person 1 Scope 100% Done)_

## Current requested stage (2026-10-28)

- DONE: 20-page audit, tokens, explicit Inter, all requested primitives, development review page and native mouse pointers.
- DONE: Desktop/mobile, keyboard and font checks; 168 tests, typecheck, ESLint, production build and review-route exclusion.
- NEXT: Review /design-system before authorizing full application screens.
- OPEN outside this stage: existing repository-wide Prettier warnings, future server upload validation/storage, comprehensive audit of older screens after shared font/token corrections.
- No commit, push, deployment or backend expansion was performed.

## Textured cursor follow-up (2026-10-28)

Added small violet stipple-textured SVG arrow/hand cursors, controlled by --cursor-default/--cursor-pointer in tokens.css. Applied only for fine mouse pointers with hover and no forced colors. Text editing and disabled states retain native cursors; fallback auto/pointer remains. Browser verified both asset rendering and computed arrow/hand/text/not-allowed states. Production build, typecheck, scoped lint, 20 foundation tests and changed CSS formatting passed. Next action: inspect the texture on the open design-system page.

## Profile header follow-up (2026-10-29)

- DONE: name/banner overlap, square avatar rim and unbroken-name clipping corrected locally.
- DONE: 4 profile-content tests added; full172-test suite, typecheck, full lint, scoped formatting and production build passed.
- DONE: 17 desktop/tablet/mobile fixture cases, screenshot/geometry review by tester and coordinator, temporary fixture removal.
- NEXT: user visual review of `/profile` in a signed-in browser; no further implementation stage started.

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

# Phase 0 integration follow-up (historical; backend-provider/schema items superseded by Phase 3)

- [ ] Resolve D-005: select database provider/hosting and record the migration/deployment workflow.
- [ ] Agree initial durable user/task/submission schema and ownership boundaries with auth/onboarding/RBAC and frontend owners before adding ORM or migrations.
- [ ] Specify durable submission review and points ledger transaction: server-derived identity/score bounds, unique idempotency key, single approval award, and atomic submission+ledger+aggregate update.
- [ ] Specify streak event source, calendar timezone/day boundary, backfill policy and idempotent daily processing before implementing streaks/leaderboards.
- [ ] Reconcile the `/api/workspace?memberId=` public profile lookup with private workspace authorization; define separate response shapes and public-field allowlist.
- [ ] Update API contracts after implementation to distinguish persistence semantics, validation, ownership, and error responses; add integration tests with the selected database.

# Phase 1 schema review gate (partially superseded by approved schema implementation)

- [x] Reconcile current User/invite/points interfaces and frontend submission requests (inspection only).
- [x] Draft provider-aware logical schema, keys, constraints, indexes, ownership, and non-destructive migration plan in `DB_SCHEMA.md`.
- [ ] Person 1 review: reuse User and InviteCode, ID semantics, invite hash/return behavior, persisted role/status checks, points transaction/idempotency, reviewer/rubric authority.
- [ ] Person 2 review: task lifecycle vs member display status, submission response/write fields, retry and resubmission semantics.
- [ ] Person 4 review: confirm Chat/Personal Space exclusion and privacy boundary.
- [x] Resolve D-005 provider (Supabase) and ORM (Prisma 7); see D-024.
- [x] Create additive migration and opt-in database constraint tests; user reports initial migration applied. Transaction tests for approvals/invites remain pending.

# Phase 2 backend conventions follow-up (historical; persistence added in Phase 3)

- [x] Document repeatable Node/npm local setup, health endpoint and checks; clarify SESSION_SECRET and unused DATABASE_URL placeholders.
- [x] Add bounded JSON parsing helper and use it in development-only login; preserve shared validation error envelope.
- [x] Add shared bounded limit/offset pagination convention for future collection routes.
- [x] Add safe structured failure logging helper and tests proving request identifiers are redacted.
- [x] Add synthetic test-only helper tests for validation/pagination/logging; retain existing API fixture integration tests.
- [x] Implement task repository/service and guarded APIs against Prisma.
- [ ] Implement remaining domains (submission review, points/streak transactions) only after owner semantics are agreed.

# Phase 3 task APIs — original gate checklist (superseded by completed implementation below)

- [x] Reconcile frontend task list/detail/create/update paths, filters, sort, and acceptance checklist in `API_CONTRACTS.md`.
- [ ] Approve Phase 1 task schema and resolve D-005 database provider/ORM before implementing successful persistence routes.
- [ ] Confirm task lifecycle visibility and member status derivation, including repeated submissions/revisions, with Persons 1/2.
- [ ] Implement authorized list/detail/admin create/update services against the approved repository; keep DELETE/activation out unless separately contracted.
- [ ] Add repository-backed tests for status filters, newest/points ordering, empty results, invalid/repeated pagination/query values, task visibility, 401/403, and admin CRUD.
- [ ] Add DB constraint/integration coverage and update this API contract when actual route behavior is implemented.

# Phase 3 task APIs — implementation complete, database/auth integration pending (2026-10-31)

- [x] User-approved schema and Supabase/Prisma 7 decision recorded (D-024); no duplicate User or InviteCode system.
- [x] Additive initial migration and DB constraints prepared; user reports migration applied successfully.
- [x] Implement protected member/admin task listing, detail, admin create and content-only PATCH; omit activation/delete.
- [x] Add query/body validation, visibility/ownership, role/status revalidation, stable sorting, pagination, and safe errors.
- [x] Add unit, route and opt-in PostgreSQL integration tests; update API contract and setup documentation.
- [x] Configure Supabase URLs in ignored local env and apply migration (success reported by user); independent status command still needs to be rerun from a networked environment.
- [ ] Set an isolated disposable `TEST_DATABASE_URL` and run database integration tests against a separately migrated test database.
- [ ] Connect Person 1's persisted auth/session lifecycle and provision approved member/admin records before live task endpoints can succeed.
- [ ] Run database integration tests against the configured test DB; separately coordinate task resubmission/lifecycle semantics with Persons 1/2 and streak/ledger semantics with their owners.
- [ ] Review npm install audit output (22 findings: 20 moderate, 2 critical) before dependency refresh; no `npm audit fix` was run.

# Phase 4 submission lifecycle — implementation and migration complete; DB tests/review integration pending (2026-10-31)

- [x] Implement own list/detail/create/edit/soft-withdraw APIs with persisted ownership checks.
- [x] Validate HTTP(S) proof links and bounded notes; reject forged IDs/status/points/reviewer fields.
- [x] Preserve reviewed attempts; permit rejected/revision-requested resubmission as a new attempt.
- [x] Add withdrawn state and DB partial unique index migration; user reports it successfully applied to Supabase.
- [x] Add unit, route and opt-in DB integration tests.
- [ ] Configure a separate disposable `TEST_DATABASE_URL`, apply migrations there, and run PostgreSQL transition/ownership/duplicate tests.
- [ ] Connect persisted auth/user creation; current local fixture is not present in Supabase.
- [x] Implement admin review queue/approve/reject/revision routes and connect approval to the points transaction (Phase 10).
- [ ] Run the PostgreSQL route-handler core-loop suite against a reachable isolated migrated test database.
- [ ] Confirm D-025 attempt/revision semantics with Persons 1 and 2.

# Phase 5 transactional points engine — implemented; PostgreSQL integration pending (2026-10-31)

- [x] Reuse PointTransaction as the only auditable points ledger; no separate balance/cache.
- [x] Validate integer awards from zero through persisted task maximum; derive member and reviewer authority server-side.
- [x] Conditionally approve and insert award in one transaction; exact retry idempotency and unique conflict handling.
- [x] Derive weekly (Monday 00:00 IST) and all-time leaderboard totals from the ledger.
- [x] Document D-026, DB/API behavior, and Person 1 integration boundary.
- [ ] Configure a separate disposable PostgreSQL `TEST_DATABASE_URL`, apply both migrations there, and run award/rollback/concurrency/aggregate integration tests.
- [x] Connect the admin approval route to `dispatchApprovedPoints` (Phase 10).
- [ ] Implement the configurable rubric API/storage; the current review flow uses the server-owned fixed MVP version until then.
- [ ] Connect persisted auth/current-user lifecycle and provision approved users before end-to-end review and leaderboard usage.

# Phase 6 leaderboard APIs — implemented locally; migration/integration pending (2026-10-31)

- [x] Match Person 2's weekly/all-time UI and IST Monday boundary.
- [x] Add limit/offset validation and pagination response plus an independent current-user standing row.
- [x] Define stable tie order (points desc, lowercase name asc, ID asc) and ordinal ranks.
- [x] Exclude users without an approved award and exclude ledger rows whose submission is not currently APPROVED.
- [x] Keep Chat and Personal Space out of leaderboard queries.
- [x] Add indexes and tests for query validation, UI paging, tie order, period boundary, and eligibility.
- [ ] Apply `20261031230000_leaderboard_indexes` to the intended database after verifying `DIRECT_URL`; do not use a placeholder or the primary test-unsafe database.
- [ ] Run points/tasks/submission PostgreSQL integration suites against a separate migrated `TEST_DATABASE_URL`.

# Phase 7 streak engine — implemented locally; database rollout pending (2026-10-31)

- [x] Record user-confirmed policy: approved submissions count, including zero-point awards; IST calendar day; reset after one full missed day; Supabase Cron.
- [x] Add `StreakDay` unique per member/date, transaction-scoped per-user lock, approval transaction hook, and Cron reconciliation function.
- [x] Implement authenticated `GET /api/streaks`, deriving member identity from the session and returning recent active IST dates.
- [x] Document D-028, API behavior, migration, and exact Supabase Cron SQL in `DECISIONS.md`, `API_CONTRACTS.md`, and `DB_SCHEMA.md`.
- [x] Add route/unit tests and opt-in PostgreSQL coverage for IST boundaries, same-day duplicates, consecutive/missed days, invalid status, and concurrent retries.
- [ ] Apply `20261031233000_ist_streak_engine` to the intended Supabase project after confirming the local connection target; then create and verify the one-time Cron job in Supabase Dashboard → SQL Editor.
- [ ] Run the PostgreSQL integration suites on a separate migrated `TEST_DATABASE_URL`; 27 integration tests are currently skipped because it is not configured.
- [x] Connect admin approval route to `dispatchApprovedPoints` (Phase 10); verify its PostgreSQL streak behavior in the isolated integration suite.

# Phase 8 isolation & security audit (2026-10-31)

- [x] Audit active task/submission/leaderboard/streak API guards, persisted account revalidation, object ownership, role/status checks, and request-controlled identifiers.
- [x] Fail closed on unknown account statuses in route and proxy guards; reject empty resource-owner IDs.
- [x] Scope member submission detail lookup by owner ID in SQL and avoid selecting passwordHash during account checks.
- [x] Verify point/streak query sets exclude Workspace, Chat, attachments, todos, notes, goals, and private profiles; add test coverage for audit fixes.
- [x] Document D-029, findings, fixes, authorized admin access, and unresolved integration risks.
- [ ] Obtain Person 4's explicit privacy-boundary sign-off; no suitable messaging connector was available during this audit.
- [ ] Person 1 must implement durable auth and admin review routes; pass reviewer identity from the authenticated persisted ADMIN session, not a request body.
- [ ] Review removal of `authorEmail` from the owner/admin submission detail DTO with API owners; current contract includes it, but no frontend usage was found.
- [ ] Run the 28 PostgreSQL integration tests against a separate migrated `TEST_DATABASE_URL`; do not use primary Supabase for synthetic fixtures.
- [ ] Verify RLS and StreakDay security-definer functions in a non-production migrated Supabase branch before deployment.

# Phase 11 — Release readiness & handoff (2026-11-01)

- [x] Document clean install and env placeholders; preserve secrets in ignored `.env.local` only.
- [x] Document Prisma migration order, no-seed policy, verification commands, auth/RBAC boundaries, scheduler steps, idempotency, safe logging, performance results, and rollback notes in README and handoff docs.
- [x] Run unit tests, lint, typecheck, Prisma validation, production build; results recorded in TEST_LOG.md.
- [x] Record user-reported database integration result (31/31) and the agent environment's unreachable-host preflight honestly.
- [ ] Coordinate with Person 5 on target environment, release commands, smoke checks, and rollback owner; no deployment until explicit approval.
- [ ] Confirm intended production/staging Supabase project, all four migration statuses, backup/PITR and access policy with its owner before migration/deployment.
- [ ] Configure/verify Supabase Cron job `prax-refresh-streaks` after target migration review.
- [ ] Treat real persisted auth/register/current-user, admin bootstrap, and configurable rubric as release blockers; coordinate owners (Persons 1/2).
- [ ] Do not call the product production-ready until blocking seams and operational checks above are closed.

# Persisted auth/onboarding continuation (2026-11-01)

- [x] Connect registration, invite verification, login and current-user lookup to persisted User/InviteCode tables without duplicating auth or schema.
- [x] Add admin invite CRUD needed for onboarding, pending-member list/approval, one-time invite display, and guarded one-time first-admin bootstrap.
- [x] Add auth handler unit tests, admin user route tests and separate-database auth flow integration tests; include the integration suite in the guarded runner.
- [x] Update README, API contract, schema status, security notes, decisions, test log and handoff.
- [ ] Run `npm run test:integration` from a machine that can reach the separate `TEST_DATABASE_URL`; this environment's safety preflight stopped before tests because the DB host was unreachable. New auth flow coverage is therefore not yet verified against PostgreSQL.
- [ ] For real onboarding, first have the DB owner confirm the intended local `DATABASE_URL`; start the app, use the README bootstrap procedure to create the first admin, remove `FIRST_ADMIN_BOOTSTRAP_TOKEN` and restart, then create an invite in the Admin UI. Do not insert records manually in Supabase.
- [ ] Coordinate a shared/distributed rate limiter and durable admin audit approach before production; the current limiter is process-local and the schema has no audit model.
- [ ] Implement remaining admin reject/suspend/disable/unsuspend actions and configurable rubric; magic-link auth also remains unimplemented.
- [ ] Continue Phase 11 release tasks: coordinate with Person 5, confirm target project/migrations/backups, verify Supabase Cron, and obtain explicit deployment approval before any deploy.

This entry supersedes older checklist statements that persisted registration/login/current-user and admin approval are unimplemented. Phase 8 security notes about these specific routes being 503 are historical; see the 2026-11-01 auth handoff in `AGENT_HANDOFF.md`.

## Waiting-page session handoff (2026-11-01)

- [x] Successful registration issues a signed pending-member cookie and opens the existing onboarding page.
- [x] Verify server middleware keeps PENDING_APPROVAL accounts out of all workspace pages/APIs.
- [x] Waiting page polls persisted status and routes to the member dashboard only after approval.
- [ ] Run the PostgreSQL auth integration suite from a host that can reach the separate test database and confirm the user's browser flow with a newly issued invite.

## First-admin setup follow-up (2026-11-01)

- [x] Confirm schema migration status is current (user reported) and runtime `DATABASE_URL` read-only connectivity succeeds (user reported).
- [x] Change bootstrap advisory lock result to Prisma-safe integer and add regression assertion.
- [ ] Restart local Next dev server and retry bootstrap using a new password; earlier password was exposed in chat. Confirm whether response is `201` or report only HTTP code/message.
- [ ] If HTTP 500 persists, capture safe server-side Prisma error code without logging credentials or raw request data, then fix the underlying database transaction issue.
- [ ] Keep `.env.local`, Supabase URLs, bootstrap token, and passwords out of chat; don't rerun migrations for this code-only fix.

The bootstrap still returned HTTP 500 after the first SQL adjustment. Safe stage/code logging is now implemented and tested. Restart the local dev server before retrying; use only the new diagnostic line to continue. No migration/deploy is needed.

Latest diagnostic: `P2028` at transaction stage. Explicit 10-second max wait and 15-second timeout were implemented and locally tested. The user reports bootstrap then succeeded (HTTP 201).

- [x] Bootstrap succeeded in user's local environment (reported HTTP 201, 5.1s).
- [ ] Remove `FIRST_ADMIN_BOOTSTRAP_TOKEN` from `.env.local` and restart PRAX.
- [ ] Sign in with the new admin account and create/copy an invite under Admin → Members.
- [ ] Commit/push the local bootstrap transaction/logging fix if the user requests delivery; currently local `main` has these uncommitted changes.

# Phase 5 remaining-tab integration (2026-11-01)

- [x] Connect member Dashboard to persisted points, approved submissions, streak, and weekly leaderboard.
- [x] Add route tests for authentication, metrics, empty result, account-state denial, and user scoping.
- [x] Inventory other existing tabs and verify their current endpoints/failure causes in `API_CONTRACTS.md`.
- [ ] Resolve Person 4 privacy/ownership and persistence/storage/transport contract before Personal Space, Chat, chat attachments, or moderation reports.
- [ ] Define a durable notification event/read model and delivery policy before implementing `/api/notifications`.
- [ ] Define rubric persistence/versioning and compatibility with review approval before implementing `/api/rubric`.
- [ ] Define audit schema, event scope, retention and access policy before implementing `/api/admin/audit-log`.
- [ ] Specify allowed admin member lifecycle transitions/reason semantics; then implement and test reject/suspend/disable/unsuspend routes already called by the admin UI.
- [ ] Re-run full unit suite, lint, and production build after remaining service decisions/implementation; current Phase 5 run only covered Dashboard tests and typecheck.

# Phase 6 API/database integration review (2026-11-01)

- [x] Confirm Dashboard uses shared Prisma client/PostgreSQL adapter, existing session and persisted account guard, standard responses, and safe logs.
- [x] Confirm no schema or API contract change is needed; no migration or database operation performed.
- [x] Rerun focused Dashboard tests (4/4), typecheck, and whitespace validation.
- [ ] Continue Phase 5 integrations only after required storage, privacy, event, and lifecycle contracts are agreed; see the Phase 5 matrix above.

# Phase 7 — connected-page test verification (2026-11-01)

- [x] Add Dashboard page checks for loading, empty result, populated result, API failure, and functioning retry.
- [x] Add Settings page checks for load, preference save, server response after remount, and functioning retry.
- [x] Re-run existing Profile API/service/component tests and verify signed-in ownership and denial cases.
- [x] Run full unit suite (379 pass / 35 skipped), typecheck, targeted ESLint, and Webpack production build (50 pages).
- [ ] Restore reachability of the separate test database and run `npm run test:integration`; current attempt stopped before tests.
- [ ] Apply reviewed profile/preferences migrations to the intended database, then verify real Profile/Settings save and refresh with an approved account.
- [ ] Resolve the 13 existing repository-wide lint errors in `praxora-admin` in its own scoped task.
- [ ] Perform an authenticated browser smoke test when a browser automation environment is available.

# Phase 8 documentation handoff / remaining integrations (2026-11-01)

## Connected in the current worktree

- [x] Dashboard: Prisma-backed self summary from approved point ledger/submissions, existing IST leaderboard and Streak.
- [x] Profile: own profile `GET/PATCH /api/users/me/profile`; server validation and caller ownership.
- [x] Settings: own preferences `GET/PATCH /api/users/me/settings`; account edits reuse Profile API.
- [x] Tasks, submissions, leaderboard, streaks, admin review, invites/member approval, and auth endpoints exist; separate live verification limitations are documented in `TEST_LOG.md`.
- [x] Add Dashboard/Settings page tests and document root causes, endpoints, exact connected files, test results, and next-agent steps.

## Remaining or not live-verified

- [ ] Review migrations `20261101170000_user_profile_fields` and `20261101173000_user_preferences`, confirm intended Supabase target, obtain DB-owner approval, apply, and verify status. Do not expose `.env.local` contents.
- [ ] Restore separate test DB reachability and rerun `npm run test:integration`; last attempt stopped at preflight and ran no tests.
- [ ] Run authenticated browser/real DB Profile and Settings save-reload/second-user denial checks after migrations. Current UI tests mock HTTP.
- [ ] Workspace/Personal Space/Chat/attachments: currently explicit 503; define persistence, ownership, privacy and storage/transport with Person 4 before schema work.
- [ ] Notifications: define persisted events/read state and delivery policy; current endpoint returns explicit 503.
- [ ] Rubric: define persistence/versioning and review compatibility; current endpoint returns explicit 503 and approval uses server-owned `mvp-default-v1`.
- [ ] Moderation reports and durable audit: define source tables, event/retention and access policies; endpoints return explicit 503.
- [ ] Admin reject/suspend/disable/unsuspend: define allowed transitions and reason semantics, then implement/tests; current actions return explicit 503.
- [ ] Resolve existing repository-wide lint failures in `praxora-admin` in a separate scoped task. Use `npx next build --webpack` here because sandbox restrictions block Turbopack's child process/port operation.
- [ ] Keep worktree changes uncommitted/unpushed unless separately requested; no deployment authorization was given.

# Admin sign-in follow-up (2026-11-01)

- [x] Confirm screenshot reports the existing login 429 limiter, not a password rejection.
- [ ] Stop the local PRAX dev server with Ctrl+C and restart it (or wait 15 minutes from the last failed attempt).
- [ ] Sign in with the exact email/password used for successful first-admin bootstrap; verify locally that the current app uses the same database project.
- [ ] If the correct password is unavailable, obtain an approved admin password-recovery procedure. Do not bootstrap a second admin or edit Supabase rows manually; no password-reset endpoint exists.

# Sign-out follow-up (2026-11-01)

- [x] Make global logout reachable without loading Settings or Profile data.
- [ ] User should refresh localhost:3000 and click **Sign out** in the header; verify redirect to `/login`.
- [ ] Separately investigate why the intended admin account is marked inactive before granting access; do not bypass approval/status checks.

# Registration 500 follow-up (2026-11-01)

- [x] Add safe stage/Prisma-code diagnostics and regression coverage for unexpected registration failures.
- [x] Match registration transaction limits to bootstrap after observing P2028.
- [ ] Restart/reload local server and retry once with a fresh invite; confirm 201 or capture only safe stage/code if it still fails.

## Person 4 — chat and Personal Space (2026-11-01)

- [x] Stage 3: split chat and space hooks/types, avatars, first-visit rules dialog, reactions UI, task link on to-dos, Upcoming filter fix, soft-delete wording, polling-failure fix, tests.
- [ ] Stage 4: add Todo, Note, Goal, ChatMessage, MessageReaction and `UserPreferences.chatRulesAcceptedAt`; write the migration SQL for review; do not apply it until told "go", and only to the owner's dev database.
- [ ] Stage 5: build `/api/space` and the `/api/chat/…` routes with `authorize` + `requirePersistedAccount`, owner-scoped queries, and the isolation, state and validation tests.
- [ ] Stage 6: D-003 (Pusher vs Socket.io) stays PROPOSED until the team confirms; install nothing before then.
- [ ] Last: chat attachments, blocked on a team answer (files versus links, storage). The Attach button is untouched and fails against the 503 stub until then.
- [ ] Chat Report button: waiting on Juel's moderation work; out of scope for now.

## Person 4 — Stage 4 (2026-11-01)

- [x] Stage 4: Prisma models, enums, `chatRulesAcceptedAt` and migration SQL `20261101190000_personal_space_and_chat` written and checked.
- [ ] Owner review of the migration SQL; then, on a "go", apply it to the owner's development database only (`npx prisma migrate status`, `npm run db:migrate:deploy`).
- [ ] Mariya reviews the schema on the PR.
- [ ] Stage 5: routes, services and tests (owner-scoped queries; integration tests need `TEST_DATABASE_URL`).
