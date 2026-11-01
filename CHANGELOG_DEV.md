## 2026-11-01 — Phase 9 performance reconnaissance

- Benchmarked seven route-handler reads against the separate migrated Supabase test project in `eu-north-1` using a synthetic dataset (501 users, 2,500 tasks, 10,000 approved submissions, 10,000 point transactions, 42 streak days; 5 warmups and 30 measurements).
- All route p95s were below 2 seconds. Removed the unused reviewer relation from member submission history; its p95 moved from 1,730.6 ms to 1,314.4 ms. No index, leaderboard, task, or caching change was justified by the measurements.
- Added an opt-in, tagged-fixture benchmark harness with isolated-project guard and cleanup. Profile remains unmeasured because `/api/workspace` returns 503. Timings exclude HTTP/TLS; query plans were not captured.
- No migration or production database operation was run. Full database test failures and check results are recorded in TEST_LOG.md.

## 2026-11-01 — Phase 10 team integration

- Implemented admin review queue, approval, rejection and revision-request endpoints, retaining the current frontend payloads and response projections.
- Approval validates score bounds in the points service, takes reviewer identity and the fixed `mvp-default-v1` rubric version from server state, then atomically updates approval, points ledger and streak.
- Approval writes PostgreSQL `CURRENT_TIMESTAMP` truncated to the `TIMESTAMPTZ(3)` column precision so the streak function does not reject a rounded-forward timestamp.
- Added denied/forged-input/transition unit coverage, an isolated DB route-handler end-to-end fixture, and `npm run test:integration` with database identity and read-only connectivity/schema guards.
- Database integration could not run here because the separate Supabase test host is unreachable. No schema migration or primary-database operation was run. Results are in TEST_LOG.md.
- The user's later reachable DB run exposed timestamp precision, stale Streak fixture cleanup and non-isolated task fixture failures. Fixed these after the run. The user reports a subsequent `npm run test:integration` passed: 31/31 tests across 5 files. This environment could not independently reach the test host.

# CHANGELOG_DEV.md

## 2026-11-01 — Connect Settings preferences

- Added a one-to-one `UserPreferences` model related to the existing `User`, with defaults for theme, review/streak/chat notifications, and portfolio visibility. Added additive Prisma migration `20261101173000_user_preferences`; neither this nor the preceding profile migration was applied by this agent.
- Added self-only `GET/PATCH /api/users/me/settings` with existing session authorization, persisted-approved-account checks, bounded JSON, strict allowlisting/type validation, no-store responses, and server-derived ownership.
- Rewired Settings to load the persisted profile and preferences from their APIs, reuse the own-profile API for account edits, and save the active section. ThemeSync now reads the saved server theme.
- Email and role remain read-only; sign-out uses the existing logout endpoint. Preferences persist but notification delivery is not implemented. Portfolio visibility is stored, but public member profile reads remain unavailable.
- Added service and route tests and updated Settings/theme interaction coverage. Verification is recorded in TEST_LOG.md.

## 2026-11-01 — Connect own Profile to Prisma

- Added profile columns and a nullable unique handle to the existing `User` model with additive Prisma migration `20261101170000_user_profile_fields`; no database migration was executed.
- Added `GET/PATCH /api/users/me/profile`, using the signed session and persisted approved account, field validation, own-row selection/update, no-store responses, duplicate-handle conflict handling, and signed-session name refresh.
- Switched the existing Profile editor from the disconnected Workspace endpoint to the self-profile API, with loading/retry, optional-field empty, save-error, and success states.
- Added service, route, and component tests; updated schema/API/release handoff notes. Chat, Personal Space, Settings, public profiles, points, and streaks remain outside this phase.

## 2026-10-31 — Phase 2 backend conventions and foundation

- Added bounded JSON request parsing, shared pagination, and safe allowlisted API logging while retaining existing route guards and error envelopes.
- Added unit tests and documented local setup and backend conventions.
- Recorded test outcomes in TEST_LOG.md; this historical entry is retained as a report of that phase.

## 2026-11-01 — Merge reconciliation

- Kept Supabase as the PostgreSQL host and Prisma 7 as the sole ORM/migration path, following the backend branch decision.
- Excluded main's unused Supabase JS helper layer and parallel SQL schema/seed files from this merge. Those definitions duplicate Prisma-owned tables, include Chat/Personal Space without privacy sign-off, and assume Supabase Auth RLS while the app uses signed HMAC sessions.
- Kept `.env.example` with placeholders for pooled `DATABASE_URL` and migration `DIRECT_URL`; no credentials were added. Updated README setup/backend claims to match actual Prisma features and migration status.
- Main's Supabase scaffolding remains in Git history if later reviewed and intentionally reintroduced. Conflict resolution was committed locally as `9eb4d7b`; not pushed.

## Authorized GitHub delivery of current work (2026-10-31)

User explicitly requested pushing the current changes to GitHub; continue using the previously selected donel branch at origin https://github.com/vinlandsag/PRAx-website.git. Fetched origin/donel and verified it matches local base 409d475 (0 ahead, 0 behind) before this delivery commit. Scope includes the backend cleanup, notification UI, retained development-only member account, Node 24/upload configuration and current handoff docs. Local-only hosting clarification remains in effect; this Git push does not deploy a website.

Fresh pre-push checks passed: 226 tests/13 files in 8.91 s; tsc --noEmit and full ESLint exit 0; Git whitespace check clean. Limited scan of 157 text candidates found no high-confidence secret markers or configured private session key. .env.local, .next, node_modules and .vercel remain ignored; only blank .env.example is included. Last production build is the passed 47/47 hosting preflight; it was not repeated for this Git-only action.

No global Git author identity is configured; use existing repository convention PRAX Agent <prax-agent@local> for this commit command only. Publish normally to donel, without force pushing or changing main; verify HEAD against the remote receipt afterward. This note records scope/checks before commit/push so the final delivery hash is available from Git history. Keep the local test account and existing local server; do not restart cloud hosting.

## Latest clarification — run locally (2026-10-31)

User clarified “host it” means local hosting. This supersedes the pending Vercel deployment/sign-in next step. Do not continue cloud deployment or request Vercel authorization for this task. Prior device-login exec session 44678 is no longer available; no site was deployed. Existing hosting-preparation files remain harmless local changes; no application code changed in this run.

Started npm run dev -- --hostname 127.0.0.1 --port 3000 using installed Node/npm (exec session 41439), ready in 728 ms. Confirmed health HTTP 200/environment development and login page HTTP 200; queued the local login browser panel. Server remains running on loopback only. The original local member test account is preserved; backend-dependent data remains disconnected. No secret, commit, push or remote deployment. Tests/lint/build not repeated for this server-only action. Next step: open http://127.0.0.1:3000/login and use the retained test credentials.

## 2026-10-31 — prepare native Next.js hosting

Added .vercelignore upload allowlist and package/lock Node 24.x engines. No application, API, auth boundary, styling, package dependency or database change. Downloaded official Vercel CLI 65.9.0 into npm exec cache. Native hosting selected instead of a framework migration. Local environment files remain excluded.

Build and 17 upload-pattern checks passed. Vercel reported no credentials; temporary mode was unavailable for this attempt and opened device login. Hosting remains pending user account authorization, with dry-run process 44678 waiting. No actual deployment, URL, commit/push or exposed secret.

## 2026-10-31 — restore requested local member test login

Restored only the original member test account through new lib/auth/development-member.ts, updated POST /api/auth/login and GET /api/users/me. Added development-member.test.ts (14 cases), optional signed developmentOnly session metadata in auth/types.ts/session.ts and README local login guidance. Existing backend cleanup remains intact; no mutable mock account database, sample activity, fake save, admin fixture or registration endpoint added. No dependency change.

Development credentials are public local fixtures, not production secrets. Login is restricted to development/loopback hosts with same-origin checks, existing rate limits and private session signing. Production rejects both fixture login and previously issued development-only sessions. Generated missing private local signing key in ignored .env.local without logging its value. Updated eight memory documents. Latest full checks and live smoke evidence are in TEST_LOG.md. No new commit/push/deployment.

## 2026-10-29 — remove prototype backend and fix notification control

User explicitly requested cleanup for backend/database handoff and selected removal of mock APIs. Replaced 23 existing mock-backed route bodies with guarded unavailable boundaries; added explicit task/dashboard/submission/streak/leaderboard/report/notification contract routes used by frontend screens. Removed the runtime stores in lib/db, lib/workspace, lib/rubric, lib/audit and lib/points, plus the store-dependent lifecycle service. Retained useful auth/authorization helpers and moved submission, rubric and points shapes to type-only modules. Obsolete integration tests for removed implementations were removed and replaced by disconnected-boundary/security/client/UI coverage; the test count changes accordingly, not because those former backend behaviors still exist.

Added lib/api/{backend,client,contracts,use-resource}, lib/notifications/types, NotificationBell and ResourceState. Updated TopNav/AdminSidebar/MemberSidebar, login/onboarding, API-driven dashboard/submissions/streaks/tasks/leaderboard and admin management/editor/moderation pages, profile defaults/chart, search, theme/workspace error states, and settings deep link. Existing review/rubric editor UI retains real-request behavior with no seeded review score/feedback. Removed exposed magic token flow, prefilled account/invite/passwords, fake stats/counters/rankings, synthetic invites and UI removal on failed admin actions. Production UI no longer imports demo catalog/identities. Development-only design review specimens remain deliberately isolated.

Added PRAX metadata/icon.svg and .env.example, removed starter public SVGs/favicon and hid the Next development indicator. README now describes actual frontend-only integration status without claiming Prisma/database connectivity. Removed fallback signing keys and default database URL. No package/dependency or real environment file change. Updated eight memory documents; prior screenshot diagnosis notes preserved. Validation details are in the newest TEST_LOG section. No commit/push/deployment in this cleanup.

## 2026-10-29 — interaction profiles and chat attachments

Names and avatars in chat/leaderboard now link to /members/[id]?from=chat|leaderboard, with the correct return action. Public profile loading resolves approved account records instead of requiring an initialized private workspace. Sample entries are labelled previews and do not become auth accounts. No standalone Members navigation, directory route or directory API ships in this change; the temporary /members and /api/members implementations created during the work were removed at the user's request.

Added typed chat attachments, a separate composer/renderer, authenticated multipart upload and protected retrieval/removal endpoints. Supports PNG/JPEG/GIF/WEBP, MP4/MOV/WEBM/OGV, and the documented document/archive/audio formats. Includes local preview/removal, retry, attachment-only posts, controlled downloads, video range responses, bounded sizes/storage, server signature checks and author-bound pending uploads. Message removal/eviction clears attachment bytes. Existing chat moderation permissions/audits remain.

New source: src/lib/workspace/access.ts, error.ts, members.ts, attachment-policy.ts, attachment-store.ts; src/components/chat/ChatComposer.tsx and ChatAttachments.tsx; src/app/api/chat/attachments/route.ts and [id]/route.ts. New tests: src/lib/workspace/media.test.ts and src/components/chat/chat-media.test.tsx. Updated: workspace types/store/catalog/filter and interactions.test.tsx; /api/workspace; chat/leaderboard/member-profile pages; ProfileView; Icon; next.config.ts. Required eight memory files updated. Private profile defaults no longer derive handles from email; unedited non-fixture accounts do not claim a bio/skills. Existing process-store data survives method hot reload via prototype refresh; restart volatility remains.

Validation: 235 tests, lint/typecheck/scoped formatting/build pass. Browser and HTTP evidence is recorded in TEST_LOG.md. No new package, backend service, migration, auth bypass, commit or deployment.

## 2026-10-29 — reference cursor appearance

- Changed public/artwork/cursor-arrow.svg and cursor-hand.svg to rounded dark silhouettes, pale outlines and a soft static violet halo; added corresponding transparent 32x32 PNG exports for reliable native cursor decoding.
- Changed src/app/tokens.css to PNG cursor URLs with hotspots 8,8 (arrow) and 13,6 (hand); src/app/globals.css only receives a clarified comment and formatting. Existing eligibility guards and native text/disabled semantics retained.
- Updated DESIGN_SYSTEM.md and all eight memory files. No new dependency, tracking script, route, API payload, backend or application-screen change.
- Passed 207 tests, full lint/typecheck, changed CSS formatting, production build and local asset HTTP/disk checks. Raster preview visually inspected; live pointer check unavailable due to browser connection failure. Details: latest TEST_LOG.md entry.

## 2026-10-29 — reported member interaction bugs

Implemented the seven requested areas using existing shared controls and authenticated server storage. Search supports Ctrl/Cmd+K, arrow selection, Enter navigation and private-item deep links. Task filters combine search/category/status/sort and show matching/empty states; detail pages now use the selected catalog id. Personal Space supports editable detailed to-dos, notes, goals, completion, difficulty/status/search filters and both sidebar shortcuts. Leaderboard switches sample podium, order, scores, standing and next-rank gap. Chat supports shared messages, author edit/delete, admin pin/unpin/delete and moderation audit events. Profiles edit identity, skills and project/portfolio; missing portfolio shows setup actions and public reads respect privacy. Settings save account, theme, notification and privacy preferences; security shows actual account information and working sign-out.

New source: src/lib/workspace/{catalog,types,store,filter,use-workspace}.ts; src/app/api/workspace/route.ts; src/components/layout/{GlobalSearch,ThemeSync}.tsx; src/components/profile/EditableProfile.tsx.

Changed source: src/app/{chat,leaderboard,settings,space,tasks,profile}/page.tsx; src/app/tasks/[id]/page.tsx; src/app/members/[id]/page.tsx; src/app/layout.tsx; src/app/tokens.css; src/components/layout/{TopNav,MemberSidebar}.tsx; src/components/profile/ProfileView.tsx; src/components/ui/Icon.tsx. Tests: new workspace/workspace.test.ts and workspace/interactions.test.tsx; updated ProfileView.test.tsx. All eight memory files updated. Earlier uncommitted foundation/cursor/profile work was preserved.

Resolved during verification: local origin/Host mismatch, edit button becoming a submit action, native date input events, stale settings-form remounts, route/account theme changes, new test typing and accessible-name assumptions. Final 207 tests, lint, types, scoped formatting and build pass. See TEST_LOG.md for commands/evidence and current limits.

Chronological record of development changes.

## Format

Each entry must include:

- **Date/Time** (ISO 8601)
- **Phase**
- **Files Changed**
- **Behavior Added/Changed**
- **Commands Run**
- **Test Results**
- **Commit Hash** (if applicable)
- **Known Issues**

---

## 2026-10-27T22:59

### Phase 0 — Initialization

- **Files Changed:** `PROJECT_STATE.md`, `CHANGELOG_DEV.md`, `AGENT_HANDOFF.md`, `DECISIONS.md`, `API_CONTRACTS.md`, `TEST_LOG.md`, `SECURITY_NOTES.md`, `TODO_NEXT.md`, `AGENTS.md`
- **Behavior Added:** Created all required project memory files and global agent rules at repository root.
- **Commands Run:** None
- **Test Results:** N/A
- **Commit Hash:** NONE — git not initialized
- **Known Issues:** Git not initialized; no `.gitignore`.

---

## 2026-10-27T23:04

### Phase 0 — Repository Reconnaissance

- **Files Changed:** All memory files (updated)
- **Behavior Added:** Executed Phase 0 reconnaissance. Verified repo is empty. Probed runtime environment. Proposed MVP stack. Drafted phased plan (Phases 0–8), 8 cross-person integration contracts (IC-01 to IC-08), and 8 high-risk decisions (R-01 to R-08).
- **Commands Run:**
  - `git status` → `NOT_A_GIT_REPO`
  - `ls -la /Users/apple/milan/PRAx/` → 9 memory files only
  - `node --version` → v24.15.0 | `npm --version` → 11.12.1 | `python3 --version` → 3.9.6
  - `java -version` → OpenJDK 21.0.11 | `brew --version` → 6.0.12 | `sqlite3 --version` → 3.43.2
  - Docker, PostgreSQL, Redis, Go: NOT INSTALLED
- **Test Results:** N/A
- **Commit Hash:** NONE
- **Known Issues:** Git not initialized; PostgreSQL, Docker, Redis not installed.

---

## 2026-10-27T23:12

### Phase 1 — Product Requirements, Architecture & Interface Contracts

- **Files Changed (new):** `MVP_SPEC.md`
- **Files Changed (updated):** `API_CONTRACTS.md`, `DECISIONS.md`, `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `SECURITY_NOTES.md`, `TODO_NEXT.md`, `CHANGELOG_DEV.md`
- **Behavior Added:**
  - Full MVP specification: roles (Visitor/Member/Admin) with exact permissions
  - User lifecycle states (PENDING_APPROVAL, APPROVED, REJECTED, SUSPENDED, DISABLED) with state machine diagram
  - Submission review states (DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED/REVISION_REQUESTED)
  - Invite-code lifecycle (ACTIVE/USED/EXPIRED/REVOKED)
  - Audit event catalogue (20 events with actor, target, metadata)
  - Scoring constraints (non-negative integer points, server-side streak computation, append-only ledger)
  - Error code catalogue (11 codes with HTTP status)
  - DB table ownership (14 tables, each with single owner)
  - Endpoint and UI module ownership (all 15 modules covered)
  - Background process ownership (3 processes)
  - Full API contracts (IC-01 to IC-08) with request/response shapes
  - 6 documented assumptions (A-001 to A-006)
- **Commands Run:** None
- **Test Results:** N/A — no tests exist
- **Commit Hash:** NONE — git not initialized
- **Known Issues:** All IC contracts are PROPOSED; D-002 to D-006 still pending team approval.

---

## 2026-10-27T23:30

### Phase 2 — Minimal App Foundation & Developer Workflow

- **Files Changed (new):**
  - `.gitignore`, `.prettierrc`, `.prettierignore`, `.env.example`, `eslint.config.mjs`, `next.config.ts`, `package.json`, `README.md`, `tsconfig.json`, `vitest.config.ts`
  - `src/app/api/health/route.ts`
  - `src/lib/env.ts`
  - `src/lib/errors.ts`
  - `src/lib/errors.test.ts`
  - `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/favicon.ico`
- **Files Changed (updated):**
  - `PROJECT_STATE.md`, `TODO_NEXT.md`, `TEST_LOG.md`, `SECURITY_NOTES.md`, `DECISIONS.md`, `AGENT_HANDOFF.md`, `CHANGELOG_DEV.md`
- **Behavior Added:**
  - Initialized git repository on branch `main` and committed Phase 0/1 memory files (`d855889`).
  - Scaffolded Next.js 16 + TypeScript 5 (strict mode) + Tailwind CSS v4 + Turbopack.
  - Added Prettier 3 configuration and ignore file.
  - Added Vitest 3 test runner with `@vitejs/plugin-react` and v8 coverage.
  - Created `.env.example` with placeholders; ensured `.env*` files are strictly gitignored.
  - Implemented `src/lib/env.ts` with typed required/optional env getters.
  - Implemented `src/lib/errors.ts` standard JSON error utility conforming to `MVP_SPEC.md §8`.
  - Added `GET /api/health` unauthenticated status route for CI and health checks.
  - Added unit test suite `src/lib/errors.test.ts` covering error codes and response envelope.
  - Wrote comprehensive `README.md` developer setup guide.
- **Commands Run:**
  - `git init`, `git commit`
  - `npx -y create-next-app@latest prax-temp ...`
  - `npm install`
  - `npm run typecheck` → PASS
  - `npm run lint` → PASS
  - `npm run format:check` → PASS
  - `npm test` → PASS (8/8 tests passed)
  - `npm run build` → PASS (all routes compile)
  - `npm audit` → 4 devDependency vulnerabilities flagged (vitest)
- **Test Results:**
  - `tsc --noEmit`: PASS
  - `eslint .`: PASS
  - `prettier --check .`: PASS
  - `vitest run`: PASS (8 tests)
  - `next build`: PASS (Turbopack production build)
- **Commit Hash:** `d855889` (initial commit), `05e6cbc` (Phase 2 commit)
- **Known Issues:**
  - D-004 (auth strategy) and D-005 (DB hosting) pending team agreement before Phase 3.
  - 4 devDependency vulnerabilities in vitest dependencies recorded in `SECURITY_NOTES.md`.

---

## 2026-10-28T00:15

### Phase UI — PRAX High-Fidelity UI Design System & Screen Implementation

- **Files Changed (new):**
  - `src/lib/design-tokens.ts`: Centralized tokens matching `PRAX_Redesigned_High_Fidelity_Desktop_UI.pdf`.
  - `src/components/ui/Button.tsx`: Accessible primary, secondary, ghost, danger, outline buttons.
  - `src/components/ui/Badge.tsx`: Semantic status badges (approved, warning, danger, lavender, neutral).
  - `src/components/ui/Card.tsx`: Reusable surface card, header, title, description, content, footer.
  - `src/components/ui/Input.tsx`: Accessible input with label, icons, helper text, error states.
  - `src/components/ui/Avatar.tsx`: Circular initials avatars with online indicators and color themes.
  - `src/components/ui/StatCard.tsx`: Metric stat card with trend indicator and icon backgrounds.
  - `src/components/ui/Tabs.tsx`: Pill and segmented tabs with active state handling.
  - `src/components/ui/Modal.tsx`: Accessible modal dialog with backdrop blur.
  - `src/components/ui/components.test.tsx`: Vitest + jsdom tests for design tokens and UI components.
  - `src/components/layout/MemberSidebar.tsx`: Persistent dark navy sidebar for members.
  - `src/components/layout/AdminSidebar.tsx`: Persistent dark navy sidebar for administrators.
  - `src/components/layout/TopNav.tsx`: Breadcrumb bar, search with ⌘K, streak badge, points, avatar.
  - `src/components/layout/AppShell.tsx`: Responsive shell connecting sidebars and top navigation.
  - Page routes for all 20 reference screens:
    - `src/app/login/page.tsx`: Screen 1 (Split-screen auth).
    - `src/app/onboarding/page.tsx`: Screen 2 (Application received queue with stepper).
    - `src/app/dashboard/page.tsx`: Screen 3 (Member dashboard).
    - `src/app/tasks/page.tsx`: Screen 4 (Tasks list).
    - `src/app/tasks/[id]/page.tsx`: Screen 5 (Task detail & proof submission).
    - `src/app/submissions/page.tsx`: Screen 6 (My submissions history).
    - `src/app/leaderboard/page.tsx`: Screen 7 (Leaderboard with 3-step podium).
    - `src/app/streaks/page.tsx`: Screen 8 (Streaks & 6-week activity heatmap).
    - `src/app/space/page.tsx`: Screen 9 (Personal space, private to-dos, goals).
    - `src/app/profile/page.tsx`: Screen 10 (My builder profile).
    - `src/app/members/[id]/page.tsx`: Screen 11 (Public member profile).
    - `src/app/settings/page.tsx`: Screen 12 (Settings & preferences).
    - `src/app/chat/page.tsx`: Screens 13 & 14 (Community chat & Rules modal).
    - `src/app/admin/page.tsx` & `src/app/admin/review/page.tsx`: Screen 15 (Admin review queue).
    - `src/app/admin/tasks/page.tsx`: Screen 16 (Admin task manager).
    - `src/app/admin/tasks/new/page.tsx`: Screen 17 (Task editor with live member preview).
    - `src/app/admin/members/page.tsx`: Screen 18 (Admin members & access).
    - `src/app/admin/rubric/page.tsx`: Screen 19 (Points rules / rubric).
    - `src/app/admin/moderation/page.tsx`: Screen 20 (Chat moderation).
- **Files Changed (updated):**
  - `src/app/globals.css`: Configured Tailwind v4 `@theme` tokens.
  - `src/app/page.tsx`: Displays Member Dashboard at root path.
  - `DECISIONS.md`: Recorded D-007.
  - `PROJECT_STATE.md`, `TODO_NEXT.md`, `TEST_LOG.md`, `SECURITY_NOTES.md`, `AGENT_HANDOFF.md`.
- **Commands Run:**
  - `npm i -D @testing-library/react @testing-library/dom jsdom`
  - `npm run typecheck` → PASS
  - `npm test` → PASS (15/15 tests across 2 suites)
  - `npm run lint` → PASS (0 errors, 0 warnings)
  - `npm run format` → Prettier formatted
  - `npm run format:check` → PASS
  - `npm run build` → PASS (25 routes compiled in 648ms)
  - `curl` smoke tests on 18 routes → all HTTP 200 OK
- **Test Results:** 15 passed tests, zero lint warnings, clean build.
- **Commit Hash:** Ready for commit
- **Known Issues:** None with UI. D-004 (auth) and D-005 (DB hosting) pending before Phase 3 backend work.

---

## 2026-10-28T10:08

### Phase UI Refinement — Token Centralization, WAI-ARIA Accessibility & Architecture Clean-up

- **Files Changed (new):**
  - `src/components/profile/ProfileView.tsx`: Extracted shared profile component to comply with Next.js App Router route module boundaries.
- **Files Changed (updated):**
  - `src/lib/design-tokens.ts`: Centralized brand accent (`#FF5C35`), streak flame (`#F97316`), code block background (`#171B2A`), avatar color schemes, and sidebar text hierarchy tokens.
  - `src/app/globals.css`: Added matching `@theme` color tokens (`--color-sidebar-text`, `--color-sidebar-muted`, `--color-sidebar-subtext`, `--color-sidebar-quote`, `--color-brand-accent`, `--color-streak`, `--color-code-bg`, semantic dots).
  - `src/components/ui/Button.tsx`: Added `aria-busy={isLoading}` accessibility attribute.
  - `src/components/ui/Badge.tsx`: Replaced hardcoded Tailwind palette classes on dots with semantic token classes (`bg-success-dot`, etc.).
  - `src/components/ui/Avatar.tsx`: Added `role="img"` and `aria-label` for initials avatars, centralized color schemes.
  - `src/components/ui/Input.tsx`: Added `aria-invalid`, `aria-describedby` linking error/helper paragraphs, and `aria-hidden="true"` on decorative icons.
  - `src/components/ui/StatCard.tsx`: Marked decorative trend indicators with `aria-hidden="true"`, updated to semantic status tokens.
  - `src/components/ui/Tabs.tsx`: Added full WAI-ARIA tab semantics (`role="tablist"`, `role="tab"`, `aria-selected`, `tabIndex`, keyboard navigation via ArrowLeft, ArrowRight, Home, End).
  - `src/components/ui/Modal.tsx`: Added `aria-labelledby="modal-title"` and matching title id.
  - `src/components/layout/MemberSidebar.tsx` & `src/components/layout/AdminSidebar.tsx`: Eliminated all raw hex values in favor of centralized tokens, added `aria-current="page"` on active links, accessible close button labels, and `aria-hidden="true"` on decorative icons.
  - `src/components/layout/TopNav.tsx`: Added `aria-label="Breadcrumb"`, `aria-label="Search platform"`, and semantic chip styling.
  - `src/app/onboarding/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/streaks/page.tsx`, `src/app/tasks/page.tsx`, `src/app/admin/page.tsx`, `src/app/admin/tasks/new/page.tsx`: Cleaned up raw hex strings to use design tokens.
  - `src/app/profile/page.tsx` & `src/app/members/[id]/page.tsx`: Refactored to import `ProfileView` from `src/components/profile/ProfileView.tsx`, resolving Next.js route type collisions.
  - `src/components/ui/components.test.tsx`: Expanded test suite from 15 to 23 tests covering new design tokens, Button aria-busy, Input aria-invalid/describedby, Tabs ARIA and keyboard navigation, Modal ARIA labels, and StatCard.
  - `DECISIONS.md`: Recorded D-008.
  - `TEST_LOG.md`: Recorded full passing verification test suite.
  - `PROJECT_STATE.md`, `TODO_NEXT.md`, `AGENT_HANDOFF.md`.
- **Commands Run:**
  - `npm run typecheck` → PASS (tsc clean)
  - `npm test` → PASS (23/23 tests pass across 2 test suites)
  - `npm run lint` → PASS (0 errors, 0 warnings)
  - `npm run format` → Formatted cleanly
  - `npm run format:check` → PASS (Prettier clean)
  - `npm run build` → PASS (all 25 routes compiled in Turbopack)
- **Test Results:** 23 passing tests, 0 lint warnings, clean build.
- **Commit Hash:** Ready for commit
- **Known Issues:** None with UI. D-004 (auth) and D-005 (DB hosting) pending before Phase 3 backend work.

---

## 2026-10-28T10:27

### Phase UI Refinement — Profile Screen Fidelity Alignment (Pages 10 & 11)

- **Files Changed (updated):**
  - `src/components/profile/ProfileView.tsx`: Updated banner with "Small steps. Real things." tagline and 8-ray geometric star/asterisk SVG graphic; separated the 4 metric stats into 4 standalone cards in a responsive grid; integrated inline portfolio/GitHub/LinkedIn links in the profile header card; updated public profile to single "View portfolio" primary action; organized bottom split into left column (`Skills & interests` and `Currently building`) and right column (`Momentum` 8-week bar chart) matching reference PDF pages 10 & 11 exactly.
  - `DECISIONS.md`: Recorded D-009 for profile screen visual hierarchy alignment.
  - `TEST_LOG.md`: Recorded full passing CI verification run.
  - `PROJECT_STATE.md`, `TODO_NEXT.md`, `AGENT_HANDOFF.md`.
- **Commands Run:**
  - `npm run typecheck` → PASS (tsc clean)
  - `npm test` → PASS (23/23 tests pass across 2 test suites)
  - `npm run lint` → PASS (0 errors, 0 warnings)
  - `npm run format` → Prettier write
  - `npm run format:check` → PASS (Prettier clean across all files)
  - `npm run build` → PASS (all 25 routes compiled in Turbopack)
- **Test Results:** 23 passing tests, 0 lint warnings, clean build.
- **Commit Hash:** Ready for commit
- **Known Issues:** None with UI. D-004 (auth) and D-005 (DB hosting) pending before Phase 3 backend work.

---

## 2026-10-28T11:20

### Phase 3 — Authentication, Rate Limiting & Invite Codes

- **Files Changed (new):**
  - `src/lib/auth/types.ts`: Auth, user lifecycle, session, and invite code type definitions.
  - `src/lib/auth/password.ts`: Node `crypto.scrypt` password hashing and constant-time verification.
  - `src/lib/auth/session.ts`: HMAC-SHA256 signed stateless session tokens and cookie helpers.
  - `src/lib/auth/rate-limit.ts`: In-memory sliding-window rate limiter for brute-force and credential stuffing resistance.
  - `src/lib/auth/invite.ts`: Invite code generation (`PRAX-XXXX-XXXX`), normalization, and state machine validation.
  - `src/lib/db/auth-store.ts`: Thread-safe persistence store with pre-seeded test accounts and invite codes.
  - `src/lib/auth/auth.test.ts`: 35 unit and integration tests covering password, sessions, invites, rate limits, and endpoints.
  - `src/app/api/auth/register/route.ts`: Public registration endpoint with invite code requirement.
  - `src/app/api/auth/login/route.ts`: Credential login endpoint with session cookie generation.
  - `src/app/api/auth/logout/route.ts`: Secure cookie clearing logout endpoint.
  - `src/app/api/auth/magic-link/request/route.ts`: Magic link generation with SHA-256 hashed storage.
  - `src/app/api/auth/magic-link/verify/route.ts`: Magic link verification with single-use invalidation.
  - `src/app/api/users/me/route.ts`: Current session user endpoint (IC-01).
  - `src/app/api/invites/verify/route.ts`: Public rate-limited invite code validation endpoint.
  - `src/app/api/invites/route.ts`: Admin endpoints to list and create invite codes.
  - `src/app/api/invites/[id]/route.ts`: Admin endpoint to revoke invite codes.
- **Files Changed (updated):**
  - `src/lib/errors.ts`: Added `RATE_LIMITED` error code and `errors.rateLimited()` helper.
  - `src/lib/env.ts`: Added `sessionSecret` helper with build-safe fallbacks.
  - `.env.example`: Added `SESSION_SECRET` placeholder.
  - `src/app/login/page.tsx`: Integrated real API routes for login, registration, and magic links with status banners.
  - `DECISIONS.md`: Recorded D-004 as AGREED and added D-010.
  - `API_CONTRACTS.md`: Updated IC-01 to AGREED.
  - `SECURITY_NOTES.md`: Documented session handling, password hashing, invite protection, and rate limiting.
  - `TODO_NEXT.md`, `PROJECT_STATE.md`, `TEST_LOG.md`, `AGENT_HANDOFF.md`.
- **Commands Run:**
  - `npm run typecheck` → PASS (tsc clean)
  - `npm test` → PASS (58/58 tests pass across 3 test suites)
  - `npm run lint` → PASS (0 errors, 0 warnings)
  - `npm run format:check` → PASS (Prettier clean across all files)
  - `npm run build` → PASS (all 33 routes compiled in Turbopack)
- **Test Results:** 58 passing tests, 0 lint warnings, clean build.
- **Commit Hash:** Ready for commit
- **Known Issues:** None. D-005 (DB hosting) pending before Prisma migration setup.

---

## 2026-10-28T11:40

### Phase 4 — Onboarding, User Lifecycle State Machine & Audit Trail

- **Files Changed (new):**
  - `src/lib/audit/audit.ts`: Append-only audit logging engine (`createAuditEvent`, `listAuditEvents`) with automated recursive secret scrubbing (stripping password, token, secret, hash, salt, credential, cookie).
  - `src/lib/auth/state-machine.ts`: Server-side state machine engine (`transitionUserStatus`) enforcing MVP_SPEC §3 transition table, self-action prevention (`actor.id === targetUserId` -> 403 `FORBIDDEN`), mandatory rejection/suspension reason checks (min 3 chars), and automatic audit event emission.
  - `src/lib/auth/guard.ts`: Server-side authorization guard (`authorize`, `requireAuth`) with discriminated union return types, verifying authenticated sessions, role permissions, and user lifecycle states.
  - `src/lib/auth/state-machine.test.ts`: 23 comprehensive tests covering lifecycle transitions, self-approval guards, reason enforcement, audit logging, secret scrubbing, and endpoint access boundaries.
  - `src/app/api/admin/users/route.ts`: Admin user listing endpoint with status filtering and password scrubbing.
  - `src/app/api/admin/users/[id]/approve/route.ts`: Admin user approval endpoint.
  - `src/app/api/admin/users/[id]/reject/route.ts`: Admin user rejection endpoint with mandatory reason.
  - `src/app/api/admin/users/[id]/suspend/route.ts`: Admin user suspension endpoint with mandatory reason.
  - `src/app/api/admin/users/[id]/unsuspend/route.ts`: Admin user unsuspension endpoint.
  - `src/app/api/admin/users/[id]/disable/route.ts`: Admin user disablement endpoint with mandatory reason.
  - `src/app/api/admin/audit-log/route.ts`: Admin audit log listing endpoint with pagination and filtering.
- **Files Changed (updated):**
  - `src/lib/db/auth-store.ts`: Added `listUsers` helper supporting status and role filtering.
  - `src/app/admin/members/page.tsx`: Live integration for pending approval requests, invite codes, one-click approve/reject actions with reason prompt, and audit trail emission.
  - `src/app/onboarding/page.tsx`: Live status check against `GET /api/users/me` with automatic redirection upon admin approval.
  - `DECISIONS.md`: Recorded D-011 for lifecycle state machine and audit trail; updated A-001/A-002 to AGREED.
  - `API_CONTRACTS.md`: Updated IC-04 and user lifecycle endpoints to AGREED.
  - `SECURITY_NOTES.md`: Documented server-side state machine enforcement, self-action protection, and audit secret scrubbing.
  - `PROJECT_STATE.md`, `TODO_NEXT.md`, `TEST_LOG.md`, `AGENT_HANDOFF.md`.
- **Commands Run:**
  - `npm run typecheck` → PASS (0 errors)
  - `npm test` → PASS (81/81 tests pass across 4 test suites: `state-machine.test.ts` [23], `auth.test.ts` [35], `errors.test.ts` [8], `components.test.tsx` [15])
  - `npm run lint` → PASS (0 errors, 0 warnings)
  - `npm run format:check` → PASS (Prettier clean across all files)
  - `npm run build` → PASS (Turbopack successfully compiles all 40 routes)
- **Test Results:** 81 passing tests, 0 lint warnings, clean build.
- **Commit Hash:** Ready for commit
- **Known Issues:** None. D-005 (DB hosting) pending before Prisma migration setup.

---

## 2026-10-28T12:05

### Phase 5 — RBAC and Route/API Protection

- **Files Changed (new):**
  - `src/lib/auth/rbac.ts`: Centralized RBAC engine containing granular `AppPermission` definition, role-to-permission mappings (`ROLE_PERMISSIONS`), strict deny-by-default permission evaluation (`hasPermission`), and data resource ownership authorization (`canAccessResource`).
  - `src/proxy.ts`: Next.js 16 Proxy Middleware intercepting direct URL navigation and API requests; redirects unauthenticated visitors to `/login`, pending users to `/onboarding`, unauthorized members accessing `/admin/*` to `/dashboard?error=access_denied`, and returns standard HTTP 401/403 JSON envelopes on API calls.
  - `src/lib/auth/rbac.test.ts`: 34 comprehensive tests verifying permission matrix, deny-by-default on unknown roles/permissions, role tampering resistance, stale session invalidation, resource ownership checks, and proxy middleware routing.
- **Files Changed (updated):**
  - `src/lib/auth/guard.ts`: Enhanced server-side authorization guard with `requiredPermission`, `requiredRole`, `resourceOwnerId`, deny-by-default role validation, stale session checking, and `requireRole` / `requirePermission` convenience helpers.
  - `src/lib/auth/types.ts`: Re-exported `AppPermission` type.
  - `src/app/api/invites/route.ts` & `src/app/api/invites/[id]/route.ts`: Integrated centralized server-side authorization guards.
  - `SECURITY_NOTES.md`: Documented full Permission Matrix table across Visitor/Member/Admin, Deny-by-Default Policy, Role Tampering & Stale Session Mitigations, and Direct URL/API Protection Architecture.
  - `DECISIONS.md`: Recorded D-012 for Phase 5 RBAC & Proxy Middleware architecture.
  - `API_CONTRACTS.md`: Updated IC-04 to AGREED with proxy middleware and RBAC interfaces.
  - `PROJECT_STATE.md`, `TODO_NEXT.md`, `TEST_LOG.md`, `AGENT_HANDOFF.md`.
- **Commands Run:**
  - `npm run typecheck` → PASS (0 errors)
  - `npm test` → PASS (115/115 tests pass across 5 test suites: `rbac.test.ts` [34], `state-machine.test.ts` [23], `auth.test.ts` [35], `components.test.tsx` [15], `errors.test.ts` [8])
  - `npm run lint` → PASS (0 errors, 0 warnings)
  - `npm run format:check` → PASS (Prettier clean across all files)
  - `npm run build` → PASS (Turbopack successfully compiles all 40 routes + Proxy)
- **Test Results:** 115 passing tests, 0 lint warnings, clean build.
- **Commit Hash:** Ready for commit
- **Known Issues:** None. D-005 (DB hosting) pending before Prisma migration setup.

---

## 2026-10-28T12:27

### Phase 6 — Admin Review Queue & Review Efficiency

- **Files Changed (new):**
  - `src/lib/db/submissions-store.ts`: Thread-safe in-memory submissions store with realistic pre-seeded submissions of varying pending ages (3h, 16h, 36h, 3d) and support for status filtering, approval, rejection, and revision request operations.
  - `src/lib/utils/url.ts`: Safe URL validator (`isSafeUrl`) and sanitizer (`sanitizeUrl`) disallowing dangerous protocols (`javascript:`, `data:`, `vbscript:`).
  - `src/app/api/admin/submissions/route.ts`: `GET /api/admin/submissions` — lists submissions with optional `?status=SUBMITTED` filter, guarded by `authorize(req, { allowedRoles: ["ADMIN"] })`.
  - `src/app/api/admin/submissions/[id]/approve/route.ts`: `POST /api/admin/submissions/:id/approve` — approves submission, validates points (0 ≤ points ≤ maxPoints), emits `SUBMISSION_APPROVED` and `POINTS_ASSIGNED` audit events.
  - `src/app/api/admin/submissions/[id]/reject/route.ts`: `POST /api/admin/submissions/:id/reject` — rejects submission, enforces mandatory feedback reason (min 3 chars), emits `SUBMISSION_REJECTED` audit event.
  - `src/app/api/admin/submissions/[id]/request-revision/route.ts`: `POST /api/admin/submissions/:id/request-revision` — requests revision, enforces actionable feedback (min 3 chars), emits `SUBMISSION_REVISION_REQUESTED` audit event.
  - `src/app/admin/review-queue.test.ts`: 15 comprehensive tests covering authorization gates (visitor 401, member 403), queue listing, approval, points validation, rejection reason enforcement, revision requests, safe URL validation, and audit logging.
- **Files Changed (updated):**
  - `src/app/admin/page.tsx`: Rewritten with full 3-column side-by-side desktop review workspace featuring:
    - Column 1: Searchable review queue list with pending age badges (neutral <12h, warning 12–24h, danger >24h).
    - Column 2: Selected submission detail pane with task description, proof links (rendered safely with `rel="noopener noreferrer" target="_blank"`), and submission notes.
    - Column 3: Rubric scoring panel with sliders, feedback textarea, and approve/reject/request-revision action buttons.
    - Documented keyboard shortcuts modal (`A` approve, `R` reject, `V` revision, `J`/`K` navigate, `?` toggle help).
    - Loading skeleton, empty ("All Caught Up!"), and error states with retry.
  - All 8 project memory files updated.
- **Commands Run:**
  - `npm run typecheck` → PASS (0 errors)
  - `npm run lint` → PASS (0 errors, 0 warnings)
  - `npm run format:check` → PASS (Prettier clean across all files)
  - `npm test` → PASS (130/130 tests pass across 6 test suites: `review-queue.test.ts` [15], `rbac.test.ts` [34], `state-machine.test.ts` [23], `auth.test.ts` [35], `components.test.tsx` [15], `errors.test.ts` [8])
  - `npm run build` → PASS (Turbopack successfully compiles all routes + Proxy)
- **Test Results:** 130 passing tests across 6 suites, 0 lint errors, 0 warnings, Prettier clean, clean Turbopack build.
- **Commit Hash:** Ready for commit
- **Known Issues:** None. D-005 (DB hosting) pending before Prisma migration setup.

---

## 2026-10-28T13:40

### Phase 7 — Rubric Engine & Points Boundary (Person 1 Complete)

- **Files Changed (new):**
  - `src/lib/rubric/rubric-store.ts`: Thread-safe rubric store with editable criteria, versioning (`v1` → `v2`), history tracking, and strict criteria validation.
  - `src/lib/points/points-boundary.ts`: Shared transaction boundary contract between Person 1 and Person 3 (`dispatchApprovedPoints`), enforcing idempotency keys (`pts_${submissionId}_${rubricVersion}`) and simulated rollback.
  - `src/app/api/rubric/route.ts`: `GET /api/rubric` (approved members and admins) and `PUT /api/rubric` (admin-only rubric updates with `RUBRIC_UPDATED` audit log).
  - `src/lib/rubric/rubric.test.ts`: 16 comprehensive unit and integration tests covering criteria validation, version bump, API authorization gates, 0-to-max boundary scoring, non-numeric/negative/fractional point rejection, idempotency, and transaction rollback.
- **Files Changed (updated):**
  - `src/app/api/admin/submissions/[id]/approve/route.ts`: Server-side scoring validation (`0 <= points <= maxPoints`, integer only), rubric version binding, Person 3 transaction boundary dispatch, and idempotency guard.
  - `src/app/admin/rubric/page.tsx`: Live interactive admin UI with active rubric fetching, criteria editor modal, live total points calculation, and `PUT /api/rubric` integration.
  - `src/lib/db/submissions-store.ts`: Added `rubricVersion` and `transactionId` fields to `Submission`.
  - All 8 project memory files updated.
- **Commands Run:**
  - `npm run typecheck` → PASS (0 errors)
  - `npm run lint` → PASS (0 errors, 0 warnings)
  - `npm run format:check` → PASS (Prettier clean across all files)
  - `npm test` → PASS (146/146 tests pass across 7 test suites: `rubric.test.ts` [16], `review-queue.test.ts` [15], `rbac.test.ts` [34], `state-machine.test.ts` [23], `auth.test.ts` [35], `components.test.tsx` [15], `errors.test.ts` [8])
  - `npm run build` → PASS (Turbopack successfully compiles all routes + Proxy)
- **Test Results:** 146 passing tests across 7 suites, 0 lint errors, 0 warnings, Prettier clean, clean Turbopack build.
- **Commit Hash:** Ready for commit
- **Known Issues:** None. D-005 (DB hosting) pending before Prisma migration setup.

---

_Last updated: 2026-10-28T13:40 · Phase 7 Rubric Engine & Points Boundary Complete (Person 1 100% Complete)_

## 2026-10-28 - UI foundation (D-015), including native pointer follow-up

- Phase: reusable frontend foundation only, preserving Next.js/TypeScript/Tailwind and existing screens/backends.
- Behavior: PDF-audited tokens, explicit self-hosted Inter, backward-compatible UI refinements, missing typed primitives, local upload preview/validation, accessible keyboard dialog, development-only review page, responsive controls and native semantic cursors.
- Actual branch/base: main / e9f009c. No commit, push or deployment.
- Commands: installed dependencies via bundled pnpm; rendered all 20 PDF pages with Poppler; ran next typegen, tsc, full ESLint, Vitest and next build via node_modules CLI entry points. Final 168 tests/9 suites pass, typecheck and lint exit 0, production build exit 0, production review URL 404. Failed attempts and exact check results are retained in TEST_LOG.md.
- Formatting: `node node_modules/prettier/bin/prettier.cjs --check next.config.ts src/app/globals.css src/app/tokens.css src/app/layout.tsx src/app/design-system src/components/ui src/lib/design-tokens.ts src/proxy.ts src/design-system-route.test.ts DESIGN_SYSTEM.md` passed. Repository-wide check remains failed on pre-existing formatting issues.
- Browser: reference desktop and mobile sizing verified; font weights loaded; form validation, keyboard tabs/radios, dialog wrapping/restoration, upload preview/removal and pointer/text/disabled cursors verified.
- Known limits: local-only upload previews; global shared-theme/font changes propagate to older screens; full legacy-screen fidelity is deferred. No new backend service.
- Best next action: review /design-system before a later screen implementation stage.

Exact files changed in this session:

- `AGENT_HANDOFF.md`
- `API_CONTRACTS.md`
- `CHANGELOG_DEV.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `PROJECT_STATE.md`
- `SECURITY_NOTES.md`
- `TEST_LOG.md`
- `TODO_NEXT.md`
- `next.config.ts`
- `public/artwork/avatar-reference.png`
- `public/artwork/task-landing.png`
- `public/artwork/task-onboarding.png`
- `public/artwork/task-sql.png`
- `public/artwork/task-terminal.png`
- `public/artwork/task-writing.png`
- `public/fonts/Inter-LICENSE.txt`
- `public/fonts/InterVariable.woff2`
- `src/app/design-system/page.tsx`
- `src/app/design-system/review.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/tokens.css`
- `src/components/ui/Avatar.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Feedback.tsx`
- `src/components/ui/Field.tsx`
- `src/components/ui/FileUpload.tsx`
- `src/components/ui/FormControls.tsx`
- `src/components/ui/Icon.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/Navigation.tsx`
- `src/components/ui/Progress.tsx`
- `src/components/ui/StatCard.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/components/ui/Table.tsx`
- `src/components/ui/Tabs.tsx`
- `src/components/ui/TaskCard.tsx`
- `src/components/ui/components.test.tsx`
- `src/components/ui/foundation.test.tsx`
- `src/components/ui/index.ts`
- `src/design-system-route.test.ts`
- `src/lib/design-tokens.ts`
- `src/proxy.ts`

## 2026-10-28 - Textured mouse pointer (D-016)

- Files changed this follow-up: public/artwork/cursor-arrow.svg, public/artwork/cursor-hand.svg, src/app/tokens.css, src/app/globals.css, PROJECT_STATE.md, AGENT_HANDOFF.md, TODO_NEXT.md, DECISIONS.md, API_CONTRACTS.md, SECURITY_NOTES.md, TEST_LOG.md, CHANGELOG_DEV.md, DESIGN_SYSTEM.md.
- Added violet stipple texture to desktop arrow and hand cursors. Preserved native text/disabled cursors, coarse-input/high-contrast defaults and native fallback keywords. Static SVG/CSS only.
- Verified both assets rendered, computed cursor states, 20 foundation tests, typecheck, scoped lint, CSS formatting and production build. Commands, outputs and resolved Turbopack cache failure are in TEST_LOG.md. No commit, push, backend changes or deployment.
- Best next action: inspect the texture on /design-system.

## 2026-10-29 - Profile header overlap and avatar rim fix (D-017)

- Exact permanent files changed for this follow-up: src/components/profile/ProfileView.tsx, src/components/profile/ProfileView.test.tsx, PROJECT_STATE.md, AGENT_HANDOFF.md, DECISIONS.md, TODO_NEXT.md, SECURITY_NOTES.md, TEST_LOG.md, CHANGELOG_DEV.md.
- Isolated negative offset to avatar, rounded its ring-bearing wrapper, kept identity/actions in white panel normal flow, and supported long name/handle/social wrapping. Browser stress testing prompted explicit min/max width and overflow-wrap:anywhere for unbroken names.
- User-requested team roles: coordinator, fixer, visual tester, regression tester. Source/tests saved before an account-limit interruption were reused on resume. Parent conducted browser checks because child UI session lacked the bridge; visual tester/coordinator independently reviewed evidence.
- Actual final checks:172 tests/10 files pass, full ESLint/tsc exit0, scoped formatting pass, production build pass (912ms compile,38/38 generated). Exact commands/results and17-case geometry evidence recorded in TEST_LOG.md.
- A temporary server-gated illustrative development fixture was created for component verification and removed before final build. Shared UI/auth/API contracts unchanged. No commit, push or deployment.
- Remaining limit: actual authenticated-route visual screenshot not exercised. Best next step: refresh /profile in signed-in browser and review header.

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

### Phase 3 — task lifecycle API implementation (2026-10-31)

Added Prisma 7/Supabase PostgreSQL schema and offline-generated initial migration (not applied), lazy pooled database client, task list/detail/admin POST/PATCH persistence endpoints, request/query validation, persisted User revalidation, member-specific status derivation, pagination/sorting/search, safe error logging, and API/unit/database integration tests. Updated setup, API contracts, decisions, schema and handoff docs. Chat/Personal Space remain excluded. No live Supabase data was accessed. npm dependency installation reported 22 audit findings (20 moderate, 2 critical); no automatic audit fix was run. See TEST_LOG for final checks and skipped database tests.

### Phase 4 — submission lifecycle APIs (2026-10-31)

Implemented own submission list/detail/create/edit/withdraw routes and persisted services. The current frontend submission action creates `SUBMITTED` directly. Owner edits and soft withdrawal are conditional on a pre-review state; reviewed attempts are locked. Rejected/revision-requested resubmission creates a new attempt and retains prior feedback. Added safe HTTP(S) proof-link and bounded note validation, session-derived owner IDs, status filtering/pagination, route/unit tests, and opt-in PostgreSQL integration tests. Added `WITHDRAWN` and a partial unique active-attempt index in an additive migration; the user reported applying it to Supabase. Admin review actions and persistent submission uploads remain unimplemented. Verification: 300 tests passed, 12 database integration tests skipped; lint, typecheck, Prisma validation/generation, formatting and webpack production build passed. See `TEST_LOG.md`.

### Phase 5 — transactional points engine (2026-10-31)

Added a transaction-bound approval/points service and protected leaderboard read. Award service derives recipient/task maximum from persisted rows, verifies approved author and administrator, bounds integer scores, conditionally approves the submission, and inserts an immutable unique ledger record atomically. Exact retry is idempotent; conflicting retry is rejected. Leaderboard totals sum the ledger directly; weekly period starts Monday 00:00 IST. Existing schema constraints were sufficient, so no migration was added. Chat/Personal Space remain outside score calculations. Admin review/rubric routes are still stubs and must invoke the boundary when integrated. PostgreSQL tests are opt-in and require a separate `TEST_DATABASE_URL`; see test log.

### Phase 6 — weekly and all-time leaderboard APIs (2026-10-31)

Paginated leaderboard API now uses shared query validation, deterministic tie ordering, and returns the current user's rank and immediately higher row regardless of page. The UI consumes the API standing and has Previous/Next controls. Aggregate SQL only counts point transactions joined to currently approved submissions for approved members; weekly uses Monday 00:00 IST. Added submission user/status and points date/user indexes in an additive migration. Migration and PostgreSQL integration tests remain pending a separate test database. See D-027 and `API_CONTRACTS.md`.

### Phase 7 — automated streak engine (2026-10-31)

- Added `StreakDay` composite primary key `(userId,activityDate)` and an RLS-enabled additive migration with secured PostgreSQL functions for transactional per-approval refresh and Supabase Cron reconciliation.
- Wired `dispatchApprovedPoints` to record an approved submission's streak day in its existing transaction; zero-point approvals count, and database failure rolls back approval and points together.
- Replaced the `/api/streaks` 503 stub with a signed-session/persisted-account endpoint returning current, longest, and distinct active IST dates from the last 42 dates.
- Recorded D-028 and updated schema/API/Cron instructions. Admin review integration and Supabase migration/Cron rollout remain pending.
- Verification: 320 tests passed; 27 opt-in PostgreSQL tests skipped without `TEST_DATABASE_URL`; lint/typecheck/Prisma validation and generation/scoped formatting/build passed. No database was accessed.

### Phase 8 — isolation and security audit (2026-10-31)

- Closed malformed account-status claims in both route authorization and proxy page/API checks; added regression tests.
- Changed persisted-account checks to select only `id`, `name`, `role`, and `status`, avoiding password-hash reads.
- Scoped member submission detail lookup by ID and session owner in the database query; made empty owner IDs fail closed.
- Preserved award-time `maxPoints` snapshot semantics for retries after task edits; added a regression test.
- Audited all active routes, object queries, RLS migrations, and points/streak data dependencies. Chat/Workspace remain 503 and are not queried for scoring/streaks.
- Documented authorized admin submission detail/email exposure, pending Person 4 sign-off, disconnected admin review/auth flows, and unrun PostgreSQL integration coverage.
## 2026-11-01 — Phase 11 release readiness and handoff

- Rewrote README with clean install and secret-safe environment setup, Prisma migration procedure, no-seed policy, verification commands, auth/RBAC limits, scheduler setup, idempotency/logging, Phase 9 performance evidence, rollback notes, release blockers, and Person 5 deployment coordination.
- Reconciled current release facts in project state, API contracts, schema/security/handoff notes, decisions, test log, and TODO; historical test failures remain recorded with the later passing rerun.
- Ran Node/npm version checks, unit suite, lint, typecheck, Prisma validation, and webpack production build. Unit suite: 338 passed, 32 DB/opt-in skipped; build generated 47/47 static pages.
- User-reported database integration run: 31/31 passed. This environment retried it but the separate DB host was unreachable, so its runner stopped before Vitest. No migration, seed, Cron change, deployment, commit, or push was made.

## 2026-11-01 — Persisted auth and invite onboarding

- Connected registration, invite validation, password login, current-user lookup, admin invite management, pending-member list/approval, and guarded first-admin bootstrap to existing Prisma User/InviteCode tables. No migration/schema change.
- Registration transactionally consumes invitation capacity and creates only `MEMBER/PENDING_APPROVAL`; sessions and admin checks retain existing HMAC/RBAC conventions. The admin UI shows a generated invite code once.
- Added unit and isolated PostgreSQL integration coverage; test runner includes auth flow suite. Auth unit tests pass; DB flow was not run here because isolated test host was unreachable.
- Updated README/operator instructions, contracts, schema state, security notes, decision log, test log and handoff. Magic link and remaining admin member actions remain unfinished; process-local rate limiting and absent durable audit model are documented.
- Verification: 344 unit tests passed / 35 skipped, lint/typecheck passed, webpack production build passed (48 pages); default Turbopack build hit sandbox process/port restriction. No DB, migration or deployment was performed.

## 2026-11-01 — First-admin bootstrap troubleshooting

- Changed the advisory lock query to materialize the lock in a CTE while returning an integer scalar to Prisma, avoiding raw result decoding of PostgreSQL `void`.
- Added a focused regression assertion. The user reports migrations are current and a read-only `SELECT 1` via the runtime URL succeeds; their bootstrap request had returned HTTP 500.
- Verification: auth route tests 11/11, typecheck and targeted ESLint passed, `git diff --check` passed. Full `npm run lint` fails on 13 existing errors in Juel's `praxora-admin` subtree, unrelated to the changed files. No DB retry, migration, or deployment performed.

- Follow-up: user retried and still received HTTP 500. Added sanitized bootstrap log context (`stage` plus validated Prisma code only), with tests proving diagnostic text is filtered. Auth/logger focused tests now pass 15/15; typecheck, targeted lint and diff check pass. Restart server and retry once to identify the transaction failure.

- User-provided diagnostic identified Prisma `P2028` during `database_transaction`. Set explicit first-admin transaction `maxWait` to 10 seconds and `timeout` to 15 seconds; added a test for these bounds. No database mutation. Live retry pending.

- User reports bootstrap then returned HTTP 201 (5.1 seconds). The first admin was created. Remove the temporary bootstrap token and restart the app before normal sign-in; then create an invite from Admin → Members.
# 2026-11-01 — Phase 5 remaining tabs: Dashboard connected

- Replaced `GET /api/dashboard` 503 placeholder with a Prisma-backed, signed-session-only read.
- Dashboard now derives points from approved ledger entries, weekly rank from the existing IST leaderboard service, current streak from `Streak`, and task count/recent activity from the member's approved submissions.
- Added route tests for anonymous denial, returned metrics, empty state, persisted-account denial, and caller-scoped query predicates.
- Audited remaining visible tabs and documented the verified 503 causes/dependencies. No Personal Space/Chat storage, notification delivery, rubric, moderation, audit, or admin status behavior was invented.
- No schema or migration/database changes.
# 2026-11-01 — Phase 6 API/database integration audit

- Audited the Dashboard API against established Prisma/PostgreSQL, session, persisted-account, error-envelope, no-store, and safe-logging patterns.
- Confirmed all data access uses the shared Prisma client; no direct Supabase client/query path or schema change is needed.
- Confirmed only the leaderboard read needs its existing repeatable-read transaction; dashboard reads do not form a multi-write operation.
- No product code or endpoint response changed in this audit.
# 2026-11-01 — Phase 7 affected-page verification

- Added Dashboard page tests for loading, no-activity state, API error/retry, and populated metrics/activity.
- Added Settings page tests for loading, preference save, reloading the saved response after remount, and API error/retry.
- Existing Profile page/API/service tests were included in focused and full runs; no profile code changes were needed.
- Recorded full-suite, lint, typecheck, integration-preflight, and production-build outcomes in `TEST_LOG.md`.
# 2026-11-01 — Phase 8 documentation and handoff

Documentation-only consolidation; no product code or schema changed in Phase 8.

Connected page/API implementation files already present in this worktree:

- Dashboard: `src/app/api/dashboard/route.ts`, `src/app/api/dashboard/dashboard-route.test.ts`, `src/app/dashboard/page.test.tsx`.
- Profile: `src/app/api/users/me/profile/route.ts`, `src/app/api/users/me/profile/profile-route.test.ts`, `src/lib/profile/service.ts`, `src/lib/profile/service.test.ts`, `src/components/profile/EditableProfile.tsx`, `src/components/profile/EditableProfile.test.tsx`; additive migration `prisma/migrations/20261101170000_user_profile_fields/migration.sql` and existing `User` model edits in `prisma/schema.prisma`.
- Settings: `src/app/api/users/me/settings/route.ts`, `src/app/api/users/me/settings/settings-route.test.ts`, `src/lib/settings/service.ts`, `src/lib/settings/service.test.ts`, `src/app/settings/page.tsx`, `src/app/settings/page.test.tsx`, `src/components/layout/ThemeSync.tsx`; additive migration `prisma/migrations/20261101173000_user_preferences/migration.sql` and existing `UserPreferences` model edits in `prisma/schema.prisma`.

Dashboard reads server-derived score, weekly rank, streak, approved-task count, and up to five latest approved submissions. Profile reads/updates the caller's own persisted User profile. Settings reads/updates the caller's profile preferences. Automated coverage, actual commands/results, migration limits, and outstanding services are recorded in `TEST_LOG.md`, `DB_SCHEMA.md`, and `TODO_NEXT.md`.

Documentation updated for this handoff: `PROJECT_STATE.md`, `CHANGELOG_DEV.md`, `API_CONTRACTS.md`, `DB_SCHEMA.md`, `TEST_LOG.md`, `AGENT_HANDOFF.md`, and `TODO_NEXT.md`.
# 2026-11-01 — Admin sign-in rate-limit diagnosis

- Diagnosed the user's screenshot as the existing `429 RATE_LIMITED` response: login allows five attempts per client IP per 15-minute window, with an in-process counter.
- No application behavior, account, database, or API contract changed. Recovery steps and the account-email mismatch caution are in `AGENT_HANDOFF.md` and `TODO_NEXT.md`.
## 2026-11-01 — Global sign-out access

- Added a persistent Sign out control to `src/components/layout/TopNav.tsx`, using the existing `POST /api/auth/logout` endpoint and redirecting to `/login` on success.
- Root cause: header avatar only linked to Profile; Settings' sign-out control was only rendered after its approved-account settings request succeeded. Inactive accounts therefore had no visible sign-out action.
- Added `src/components/layout/TopNav.test.tsx` for successful logout and failed logout feedback. No new endpoint or schema change.
## 2026-11-01 — Safe registration failure diagnostics

- Registration 500s now log the allowlisted failure stage and Prisma code, matching bootstrap admin diagnostics. Request fields and exception text remain excluded.
- Added a route regression test that injects a simulated P2028 transaction error and checks only safe fields are logged. The actual cause of the user's earlier 500 is still unknown pending another attempt with this diagnostic change.
- After the user reported `database_transaction` / `P2028`, aligned registration's Prisma transaction `maxWait` (10 s) and `timeout` (15 s) with bootstrap and asserted them in auth route tests. Live confirmation remains pending.
## 2026-11-01 — Registration to approval waiting flow

- Successful registration now sets the existing signed HttpOnly session for its server-created `MEMBER/PENDING_APPROVAL` account. The existing login page routes it to `/onboarding`.
- Onboarding checks `/api/users/me` every five seconds and routes to `/dashboard` only after the database reports APPROVED; existing proxy rules block pending sessions from workspace pages and APIs.
- Added coverage for pending-session cookie scope, workspace denial, waiting-state polling, and approval redirect. No database schema or migration change.

## 2026-11-01 — Stage 3: chat and Personal Space UI gaps (Person 4)

- Split chat and Personal Space out of the `useWorkspace` payload. New `useChat` (cursor polling, mutations) and `useSpace` hooks; `WorkspaceData` is now `{user, profile, settings}`. `/api/workspace` is unchanged.
- Chat page: author avatar images, first-visit community-rules dialog with a saved accepted flag (no localStorage), fixed six-emoji reactions, pinned strip, "Load older messages" paging, reconnecting notice, soft-delete wording ("removes the message … for everyone"). The failed-poll bug (chat blanked and polling stopped after one failed refresh) is fixed.
- Personal Space: optional linked platform task on to-dos (picker loads published tasks, up to 100). The Upcoming filter now includes open to-dos with no due date. Global search loads private plans only while the search dialog is open.
- 44px targets set on the controls touched. Attach button and `ChatComposer` untouched.
- New tests: `filter.test.ts`, `use-chat.test.tsx`, `use-space.test.tsx`, `chat-reactions.test.tsx`, `app/chat/page.test.tsx`; `interactions.test.tsx` updated for the split.
- The routes these screens call (`/api/space`, `/api/chat/messages…`, `/api/chat/rules/accept`) and the database models do not exist yet (Stages 4–5). No schema, migration, package or `package-lock.json` change.

## 2026-11-01 — Stage 4: schema and migration SQL for Personal Space and chat (Person 4)

- Added `Todo`, `Note`, `Goal`, `ChatMessage`, `MessageReaction`, the `TodoDifficulty` and `TodoPriority` enums, and `UserPreferences.chatRulesAcceptedAt` to `prisma/schema.prisma` (100 lines added, none changed or removed; relation fields added to `User` and `Task`).
- Added migration `20261101190000_personal_space_and_chat` (generated with `prisma migrate diff`, then arranged to match the existing migration style, with a goal progress CHECK and RLS on every new table). It was not applied to any database. No API route, package or `package-lock.json` change.
