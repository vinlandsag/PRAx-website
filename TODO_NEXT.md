# TODO_NEXT.md

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
| P0       | Decide DB hosting (D-005)                         | TODO   | P3    | —          | D-005 row updated in `DECISIONS.md`                                                              |
| P1       | Sign off `MVP_SPEC.md` assumptions A-003, A-006   | TODO   | All   | Phase 1    | A-001, A-002, A-004, A-005 AGREED; remaining marked AGREED                                       |
| P1       | Sign off integration contracts IC-01 to IC-08     | IN_PRG | All   | —          | IC-01, IC-04, IC-06, IC-06B, IC-Admin-Review AGREED                                              |
| P1       | Decide real-time approach (D-003)                 | TODO   | P4    | —          | D-003 row updated in `DECISIONS.md`                                                              |

### Phase 8 — Person 2 (Frontend) & Person 3 (Backend) Tasks & Submissions

| Priority | Task                                                                                                          | Status | Owner | Depends On   | Acceptance Criteria                                         |
| -------- | ------------------------------------------------------------------------------------------------------------- | ------ | ----- | ------------ | ----------------------------------------------------------- |
| P1       | Implement Task creation, listing, and detail APIs (`GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks`) | TODO   | P3    | Phase 7      | Member/Admin access controls, active task list              |
| P1       | Implement Submission workflow (`DRAFT` -> `SUBMITTED` -> `UNDER_REVIEW` -> `APPROVED`/`REJECTED`)             | TODO   | P3/P2 | Tasks API    | Server-side state validation, single active submission rule |
| P1       | Implement Points Calculation Engine & Streaks Cron                                                            | TODO   | P3    | Submissions  | Non-negative points ledger, streak computation, IC-07       |
| P1       | Install Prisma ORM and generate schema v1                                                                     | TODO   | P3    | D-005 AGREED | `prisma migrate dev` runs; IC-02 fulfilled                  |

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

