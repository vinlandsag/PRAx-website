# PROJECT_STATE.md

## Authorized GitHub delivery of current work (2026-10-31)

User explicitly requested pushing the current changes to GitHub; continue using the previously selected donel branch at origin https://github.com/vinlandsag/PRAx-website.git. Fetched origin/donel and verified it matches local base 409d475 (0 ahead, 0 behind) before this delivery commit. Scope includes the backend cleanup, notification UI, retained development-only member account, Node 24/upload configuration and current handoff docs. Local-only hosting clarification remains in effect; this Git push does not deploy a website.

Fresh pre-push checks passed: 226 tests/13 files in 8.91 s; tsc --noEmit and full ESLint exit 0; Git whitespace check clean. Limited scan of 157 text candidates found no high-confidence secret markers or configured private session key. .env.local, .next, node_modules and .vercel remain ignored; only blank .env.example is included. Last production build is the passed 47/47 hosting preflight; it was not repeated for this Git-only action.

No global Git author identity is configured; use existing repository convention PRAX Agent <prax-agent@local> for this commit command only. Publish normally to donel, without force pushing or changing main; verify HEAD against the remote receipt afterward. This note records scope/checks before commit/push so the final delivery hash is available from Git history. Keep the local test account and existing local server; do not restart cloud hosting.

## Latest clarification — run locally (2026-10-31)

User clarified “host it” means local hosting. This supersedes the pending Vercel deployment/sign-in next step. Do not continue cloud deployment or request Vercel authorization for this task. Prior device-login exec session 44678 is no longer available; no site was deployed. Existing hosting-preparation files remain harmless local changes; no application code changed in this run.

Started npm run dev -- --hostname 127.0.0.1 --port 3000 using installed Node/npm (exec session 41439), ready in 728 ms. Confirmed health HTTP 200/environment development and login page HTTP 200; queued the local login browser panel. Server remains running on loopback only. The original local member test account is preserved; backend-dependent data remains disconnected. No secret, commit, push or remote deployment. Tests/lint/build not repeated for this server-only action. Next step: open http://127.0.0.1:3000/login and use the retained test credentials.

## Hosting preparation — awaiting Vercel sign-in (2026-10-31, D-023)

User requested hosting. Native Next.js deployment selected to preserve the existing framework. No existing Vercel/Netlify CLI, project link or hosting manifest was found. Inspected connected Sites workflow (Workers/Vinext/static) but did not create a Site or migrate this Next project. Installed official Vercel CLI 65.9.0 through npm exec/cache without adding it to project dependencies. whoami reported logged out. Temporary unauthenticated attempt was unavailable and CLI started its device login instead. No site/project/deployment URL exists yet.

Prepared .vercelignore as an application/config-only upload allowlist, excluding .env files, credentials, Git, build/dependency folders, memory/reference docs and source PDF. Pinned Node 24.x in package.json and the lock root to match the tested runtime. Verified 17 inclusion/exclusion examples and matching engines, package formatting/diff check, and a fresh successful production build (47/47). App/test-account code unchanged in this hosting follow-up; prior 226 tests remain last full-suite evidence.

Pending Vercel device authorization in exec session 44678 (original command deploy --temporary --dry --json). The device link was provided to the user, not written here. The command is dry-run and must not be mistaken for a completed deployment. After the user signs in, inspect that session and CLI account/project scope, then deploy current local source normally and verify the resulting URL. Do not upload .env.local or enable the local-only test account online. No Git commit/push or remote source publication occurred.

## Current follow-up — keep the local test account (2026-10-31, D-022)

User correction: do not remove the test account. Restored the original local member sign-in (member@prax.build / MemberPass123!) and authenticated current-user lookup. The exception is isolated in src/lib/auth/development-member.ts and the login/me handlers, enabled only in NODE_ENV=development with loopback request hosts. No removed workspace/catalog/chat/upload/database/points stores were restored. Production and other accounts still require backend implementation. Login fields remain blank.

Fixture sessions carry a signed developmentOnly marker and are rejected outside development, including when a production run uses the same private signing key. Wrong credentials, foreign Origin writes and nonlocal hosts are rejected; login attempts are rate-limited. A random private SESSION_SECRET was generated in ignored .env.local because none was configured; its value was not printed or committed. No shared default signing key restored.

Passed: 226 tests/13 files, full lint/typecheck/scoped formatting, production build 47/47. Live temporary localhost:3100 login/me/dashboard returned 200; authenticated workspace remains 503 as intended. Temporary server was stopped after verification, so it will not block npm run dev. Changes remain local on donel; no new commit/push. Preserve this test account in future cleanup unless the user explicitly changes that preference.

## Current state — frontend cleanup and backend handoff (2026-10-29, D-021)

This section supersedes the older prototype functionality below. The user explicitly chose **Remove mock APIs too**. Removed seeded authentication/accounts/invites, in-memory workspace/chat/upload/rubric/submission/audit/points implementations, sample catalog/rankings/public identities, canned application metrics/activity and fake-success fallbacks. Preserved the design system, local Inter, cursor assets, typed UI controls and request contracts. Application reads now use service contracts and explicit loading/unavailable/retry/empty states; no mock database or browser-storage replacement was added.

All unimplemented service routes now return 503 BACKEND_NOT_CONFIGURED after existing session/role/status guards where applicable. Health remains 200 and reports backend not_configured; logout only clears its cookie. Sign-in, account changes, chat/media and persistence intentionally require a real backend. Default signing secrets are removed; SESSION_SECRET (or NEXTAUTH_SECRET) must contain at least 32 characters for signed sessions. There are no runtime demo credentials. .env.example contains blank configuration values, and real env files remain ignored.

NotificationBell opens the shared accessible dialog, shows loading/error/retry/empty or server-provided notifications, derives unread count from returned data, and marks all read only after server acceptance. Escape/close/backdrop dismissal, focus trapping/restoration and settings-tab links are covered. No fake unread dot or notification delivery implementation. Default Next branding/assets and dev indicator removed; PRAX title/icon used.

Validation: 212 tests/12 files, full lint, typecheck, scoped source formatting and production build passed (47/47 pages). Browser checked the real bell in the development review page: unauthenticated service state, Escape, restored focus and no horizontal overflow at the natural narrow panel size. Live login 503/no session, private workspace/notifications 401, health 200/backend not_configured and PRAX icon 200 verified. All data-rich frontend tests use test-only fixtures. No real backend/database connection or authenticated end-to-end save is claimed.

Local changes remain on donel after published commit 409d475; this cleanup has not been committed or pushed. The user's existing port-3000 server was reachable and reused. Next step: backend team implements authentication/current-user lookup, followed by workspace/task/notification contracts in API_CONTRACTS.md.

## Latest update — profiles through interactions and chat media (2026-10-29)

The latest user instruction removes the standalone Members section. Other profiles now open directly from names/avatars in chat and the leaderboard, with a context-specific return link. Approved real accounts load before their first workspace visit; inactive/unknown accounts return 404. Sample leaderboard/chat identities resolve to explicitly labelled read-only sample profiles, never new login accounts. Public reads retain portfolio privacy and exclude private account/workspace data.

Chat now supports image/video/document selection, drag-and-drop, local previews, removal before sending, upload errors/retry, attachment-only messages, received media previews, native video controls and authenticated file responses. Limits: 3 attachments/30 MB per message; images 5 MB, videos 25 MB, other supported files 10 MB. Byte storage remains process-local, with pending upload expiry and storage quotas. All uploads reset on server restart. Next.js proxy buffering is 26 MB so valid videos above its default 10 MB buffer are not truncated.

Passed: 235 tests/14 files, full lint, typecheck, scoped formatting and production build (40/40 pages). Browser checked real/sample profiles from chat, leaderboard profile/return links, selecting and sending PNG+MP4+TXT, image rendering and a 5.055-second 960x540 video playing to completion. Live HTTP checks verified document contents, range bytes and auth; 12 MB upload returned 201 and pending cleanup 204. The in-app browser cancelled save-to-disk testing; delivery bytes passed independent HTTP checks. A later viewport check timed out, so no new mobile visual pass is claimed.

Local dev server is running on port 3000 (session 9844). Browser chat tab is marked as a deliverable. Screenshot: prax-chat-media-verified.jpg in this chat's visualization directory. No commit, push, deployment, new dependency or external storage service. Best next step: durable authorized media/workspace storage after D-005. Earlier cursor and app-flow work remains intact.

## Latest update — screenshot-matched cursor (2026-10-29)

Replaced the earlier stippled violet cursor with the user's reference style: a compact rounded dark arrow, pale white-violet edge and soft violet halo, plus a matching hand for clickable controls. Authoring SVGs and transparent 32x32 PNG exports are in public/artwork; CSS cursor tokens now use PNGs, with arrow hotspot 8,8 and hand hotspot 13,6. Existing fine-pointer/hover/forced-colors guards, native text/disabled cursors and fallback keywords remain. No screen, backend or app-flow work in this follow-up.

Validation: actual asset preview inspected on light/dark surfaces; both PNGs served HTTP 200 and byte-match disk; 207 tests, typecheck, full lint, scoped formatting and production build pass. Live cursor inspection is not verified because the browser automation connection reports browser.user unavailable. Next step: refresh /profile and review the actual pointer. See D-019 and latest TEST_LOG entry. Previous app functionality and persistence limits below remain current.

## Current update — member interaction bug fixes (2026-10-29)

This section supersedes older next-action instructions for this follow-up. The user explicitly requested fixes across the existing application, beyond the earlier foundation-only stage. Next.js/React/TypeScript/Tailwind conventions and the existing in-memory server approach are preserved.

Implemented global search (pages, catalog tasks, own private plans); combined task search/category/status/sort; detailed personal to-dos with difficulty, priority, due date, completion, view/edit/remove; note and goal CRUD; working goals/notes shortcuts and personal filters; weekly/all-time sample ranking changes; shared chat with author edit/delete and admin pin/delete; editable profiles/skills/project/portfolio; public portfolio privacy; account/preferences/theme/security settings. Header/sidebar identity follows saved profile. Dark theme uses semantic tokens and remains readable on filled actions. Earlier cursor/profile-layout fixes are retained.

Validation: 207 tests across 12 files, full ESLint, TypeScript, scoped formatting and production build passed. Authenticated browser checks cover saving/reloading, private search deep links, chat edits, profile changes, privacy, settings, sign-out, mobile overflow, keyboard dialogs and loaded Inter.

Limits: workspace data is per account in the running Node process, resets on restart and is not shared between server instances. Tasks/rankings/activity are illustrative fixtures; no points ledger integration was added. Notification preferences persist but email/push delivery is not configured. Chat refreshes every 15 seconds; no socket backend was introduced. Photo changes use an HTTP(S) image URL. No deployment, commit or push.

Best next step: implement durable workspace persistence after the pending database decision (D-005), retaining ownership tests and the points boundary. See D-018, API_CONTRACTS.md and the newest TEST_LOG.md entry.

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


## Product Goal

PRAX — an invite-only team platform. Members complete tasks, earn points and streaks, submit work for rubric-based admin review, and coordinate via chat and personal space. Admins manage membership, review submissions, assign points, maintain the rubric, and moderate content.

## Chosen Stack

- Runtime: Node.js 24 LTS
- Framework: Next.js 16 (App Router, Turbopack, TypeScript 5)
- Styling: Tailwind CSS v4
- Testing: Vitest 3 (unit) + Playwright (E2E planned)
- Lint/Format: ESLint 9 + Prettier 3
- Database: PostgreSQL 16 (hosting pending D-005)
- ORM: Prisma (to be added in Phase 3)
- Auth: NextAuth.js v5 (strategy pending D-004)
- Real-time: PENDING D-003 (Pusher vs Socket.io)

## Repository Structure

```
/PRAx
├── src/
│   ├── app/
│   │   ├── (20 desktop screens across 25 Next.js App Router routes)
│   │   ├── admin/             ← Review queue, task manager, editor, members, rubric, moderation
│   │   ├── api/health/        ← Health check (no auth)
│   │   ├── chat/              ← Community chat & rules modal
│   │   ├── dashboard/         ← Member dashboard
│   │   ├── leaderboard/       ← Weekly & all-time podium
│   │   ├── login/             ← Split auth screen
│   │   ├── members/[id]/      ← Public member profile
│   │   ├── onboarding/        ← Application queue
│   │   ├── profile/           ← Builder profile
│   │   ├── settings/          ← Account preferences
│   │   ├── space/             ← Personal private space
│   │   ├── streaks/           ← Streaks & heatmap
│   │   ├── submissions/       ← Submissions table
│   │   ├── tasks/             ← Tasks list & detail
│   │   ├── globals.css        ← Tailwind v4 theme & color tokens
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── layout/            ← MemberSidebar, AdminSidebar, TopNav, AppShell
│   │   ├── profile/           ← ProfileView (shared builder profile view)
│   │   └── ui/                ← Button, Badge, Card, Input, Avatar, StatCard, Tabs, Modal
│   └── lib/
│       ├── design-tokens.ts   ← Centralized color & design tokens
│       ├── env.ts             ← Centralised env var access
│       ├── errors.ts          ← Standard API error utility (MVP_SPEC §8)
│       └── errors.test.ts     ← Vitest suite (8/8 tests pass)
├── public/
├── .env.example               ← Placeholder env template
├── .gitignore                 ← Secret, build, and node_modules exclusions
├── .prettierrc / .prettierignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── README.md                  ← Developer setup guide
├── tsconfig.json
├── vitest.config.ts
│
├── AGENTS.md                  ← Global agent rules
├── AGENT_HANDOFF.md           ← Handover document
├── API_CONTRACTS.md           ← Endpoint contracts and error shapes
├── CHANGELOG_DEV.md           ← Chronological dev changes
├── DECISIONS.md               ← Architecture decision log & assumptions
├── MVP_SPEC.md                ← Product specification & ownership matrix
├── PROJECT_STATE.md           ← Current repository state
├── SECURITY_NOTES.md          ← Security risks and mitigations
├── TEST_LOG.md                ← Verifiable test execution records
└── TODO_NEXT.md               ← Prioritised task list
```

## Completed Phases

- Phase 0: Repository reconnaissance and safe setup ✅
- Phase 1: Product requirements, architecture and interface contracts ✅
- Phase 2: Minimal app foundation and developer workflow ✅
- UI Design System: Complete high-fidelity PRAX UI implementation across all 20 PDF screens ✅
- Phase 3 (Auth & Invites): Email authentication flow (password + magic links), invite code lifecycle, rate limiting, and session management ✅
- Phase 4 (Onboarding & Approval State Machine): User lifecycle state machine, server-side authorization guards, self-action prevention, immutable secret-scrubbed audit trail, admin lifecycle routes, and live onboarding/members UI ✅
- Phase 5 (RBAC & Route/API Protection): Centralized RBAC engine, deny-by-default authorization, permission matrix, Next.js Proxy Middleware, direct URL/API route protection, data ownership checks, and role tampering/stale session defense ✅
- Phase 6 (Admin Review Queue & Review Efficiency): 3-column desktop review workspace, submissions store, review API routes (approve/reject/request-revision), pending age badges, keyboard shortcuts, safe proof link rendering, loading/empty/error states, and 15 new tests ✅
- Phase 7 (Rubric Engine & Points Boundary): Editable versioned scoring rubric, criteria validation, GET/PUT /api/rubric, interactive admin UI, Person 3 transactional boundary with idempotency keys, strict 0-to-max point bounds, and 16 new tests ✅

## Current Branch / Commit

- Git: Initialized & connected to remote `https://github.com/vinlandsag/PRAx-website.git`
- Branch: `milan` (tracking `origin/milan`)
- HEAD: `3decaef` (merged baseline with `main`)
- Working tree: Phase 7 Rubric Engine & Points Boundary implemented and verified. All 6 deliverables for Person 1 (Head Lead & System Architect) are 100% complete!

## What Works

- **Rubric Engine & Points Boundary (Phase 7 — Person 1 100% Complete)**:
  - Editable scoring rubric engine (`src/lib/rubric/rubric-store.ts`) with versioning (`v1` → `v2`), history tracking, and strict criteria validation (minimum title/description lengths, positive integer maxPoints, unique IDs).
  - API endpoints: `GET /api/rubric` (accessible to approved members and admins), `PUT /api/rubric` (admin-only, validates criteria, bumps version, records `RUBRIC_UPDATED` audit event).
  - Live interactive admin UI (`src/app/admin/rubric/page.tsx`): fetches active rubric, modal editor allowing criteria modifications, addition, deletion, live total score calculation, and saving.
  - Person 1 ↔ Person 3 points transaction boundary (`src/lib/points/points-boundary.ts`): dispatches approved scores with idempotency keys (`pts_${submissionId}_${rubricVersion}`). Person 1 DOES NOT maintain a duplicate points ledger or mutate user leaderboard scores directly.
  - Strict server-side point validation: `0 <= pointsAwarded <= maxPoints`. Rejects negative, fractional, over-maximum, non-numeric, and NaN values with HTTP 400 `VALIDATION_ERROR`.
  - Idempotency & duplicate prevention: duplicate approval attempts return 422 `INVALID_STATE_TRANSITION`, preventing duplicate point disbursements.
  - Transaction rollback: simulated points boundary failure aborts approval without updating submission status.
- **Admin Review Queue & Review Efficiency (Phase 6)**:
  - Thread-safe in-memory submissions store (`src/lib/db/submissions-store.ts`) with pre-seeded submissions of varying ages.
  - Review queue API routes: `GET /api/admin/submissions` (listing with status filter), `POST .../approve` (points validation 0 ≤ pts ≤ maxPoints), `POST .../reject` (mandatory feedback ≥ 3 chars), `POST .../request-revision` (mandatory feedback ≥ 3 chars). All guarded by `authorize(req, { allowedRoles: ["ADMIN"] })`.
  - Safe URL validation (`src/lib/utils/url.ts`): `isSafeUrl()` and `sanitizeUrl()` block `javascript:`, `data:`, `vbscript:` protocols. Proof links rendered with `rel="noopener noreferrer" target="_blank"`.
  - 3-column desktop review workspace (`src/app/admin/page.tsx`): Column 1 searchable queue with pending age badges (neutral <12h, warning 12–24h, danger >24h); Column 2 submission detail with task rules and proof links; Column 3 rubric scoring sliders and feedback.
  - Documented keyboard shortcuts: `A` approve, `R` reject, `V` request revision, `J`/`K` navigate queue, `?` toggle shortcut modal.
  - Loading skeleton, empty ("All Caught Up!"), and error states with retry.
  - All review actions emit audit events (`SUBMISSION_APPROVED`, `SUBMISSION_REJECTED`, `SUBMISSION_REVISION_REQUESTED`, `POINTS_ASSIGNED`).
- **Centralized RBAC Engine & Route Protection (Phase 5)**:
  - Granular permission matrix (`src/lib/auth/rbac.ts`) for Visitor, Member, and Admin roles adhering to `MVP_SPEC.md §2`.
  - Strict deny-by-default: unknown roles (e.g. `"SUPER_ADMIN"`, `"HACKER"`, empty string) and unlisted permissions evaluate to `false` and return HTTP 403 `FORBIDDEN`.
  - Data resource ownership guard: `canAccessResource(user, resourceOwnerId)` enforces that members can only access their own private records, with admin override where permitted.
  - Next.js 16 Proxy Middleware (`src/proxy.ts`): Intercepts direct URL navigation and API requests. Unauthenticated visitors are redirected to `/login`; pending members are redirected to `/onboarding`; approved members attempting direct navigation to `/admin/*` are redirected to `/dashboard?error=access_denied`; unauthorized API calls return HTTP 401/403.
  - Enhanced server-side authorization guards (`src/lib/auth/guard.ts`): `authorize()`, `requireRole()`, `requirePermission()`, and `requireAuth()` enforce role and permission checks, reject stale/expired sessions, and reject tampered tokens.
- **User Lifecycle State Machine & Server Authorization (Phase 4)**:
  - Strict server-side transition table (`PENDING_APPROVAL` → `APPROVED`, `REJECTED`, `DISABLED`; `APPROVED` → `SUSPENDED`, `DISABLED`; `SUSPENDED` → `APPROVED`, `DISABLED`; `DISABLED` is terminal).
  - Validation blocks invalid transitions with standard HTTP 422 `INVALID_STATE_TRANSITION`.
  - Self-action guard: admins cannot approve, reject, suspend, unsuspend, or disable themselves (`actor.id === targetUserId` returns HTTP 403 `FORBIDDEN`).
  - Mandatory reason validation (minimum 3 non-whitespace characters) for `REJECTED`, `SUSPENDED`, and `DISABLED` states.
  - Server-side authorization guard (`src/lib/auth/guard.ts`) validating session tokens, roles, and user lifecycle statuses.
  - Access control boundaries: visitors get 401 `UNAUTHENTICATED`; pending users get 403 `ACCOUNT_PENDING` on member endpoints but have access to `/onboarding` and `GET /api/users/me`; inactive accounts (`REJECTED`, `SUSPENDED`, `DISABLED`) get 403 `ACCOUNT_NOT_ACTIVE`.
- **Audit Logging Engine (Phase 4)**:
  - Append-only, immutable audit trail (`src/lib/audit/audit.ts`) recording actor ID, target user/resource, prior state, new state, reason, timestamp, and metadata.
  - Automated recursive secret scrubbing: any metadata keys matching `password`, `token`, `secret`, `hash`, `salt`, `credential`, `cookie` are redacted to `[REDACTED]`.
  - Queryable admin audit log route: `GET /api/admin/audit-log` with pagination, event filtering, and date range support.
- **Admin Management API Routes (Phase 4)**:
  - `GET /api/admin/users`: lists users with status filtering and password scrubbing.
  - `POST /api/admin/users/[id]/approve`: approves user and logs `USER_APPROVED`.
  - `POST /api/admin/users/[id]/reject`: rejects user with mandatory reason and logs `USER_REJECTED`.
  - `POST /api/admin/users/[id]/suspend`: suspends user with mandatory reason and logs `USER_SUSPENDED`.
  - `POST /api/admin/users/[id]/unsuspend`: reactivates user to approved state and logs `USER_UNSUSPENDED`.
  - `POST /api/admin/users/[id]/disable`: disables user with mandatory reason and logs `USER_DISABLED`.
- **UI Integration (Phase 4)**:
  - Member management (`/admin/members`): live fetching of pending applications and active invite codes, real one-click approval and rejection with reason prompt, and audit logging.
  - Onboarding queue (`/onboarding`): polling/verifying user status against `GET /api/users/me` with automatic redirection to `/dashboard` when approved.
- **Authentication System (Phase 3)**:
  - Salted and hashed password authentication (`crypto.scrypt` with random salt and constant-time verification).
  - Passwordless magic link request and verification (`crypto.randomBytes(32)` high-entropy token, SHA-256 hash storage, 15-minute TTL, single-use invalidation).
  - Stateless tamper-proof signed session cookies (`prax_session`) using HMAC-SHA256, `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, 7-day expiration.
  - Public registration (`POST /api/auth/register`) with invite code validation and automatic placement into `PENDING_APPROVAL`.
  - Current user session route (`GET /api/users/me`) with 401 unauthenticated guard.
  - Logout endpoint (`POST /api/auth/logout`) that securely clears session cookies.
- **Invite Code Lifecycle & Security (Phase 3)**:
  - Secure random invite codes (`PRAX-XXXX-XXXX`, 12-char entropy).
  - Strict lifecycle states: `ACTIVE`, `USED`, `EXPIRED`, `REVOKED`.
  - Atomic check-and-increment of `usedCount` with terminal state transition when exhausted.
  - Public rate-limited verification endpoint (`POST /api/invites/verify`).
  - Admin-only invite management (`POST /api/invites`, `GET /api/invites`, `DELETE /api/invites/:id`).
- **Rate Limiting Engine (Phase 3)**:
  - In-memory sliding-window rate limiter protecting login, magic link, registration, and invite verification against brute-forcing and credential stuffing.
  - Returns standard HTTP 429 `RATE_LIMITED` error envelope.
- **Visual Design System**: Aligned with `PRAX_Redesigned_High_Fidelity_Desktop_UI.pdf`. Dark navy sidebar (`#171B2A`), light warm-gray background (`#F7F6F4`), surface white (`#FFFFFF`), primary purple (`#6254E8`), soft lavender (`#EEE9FF`), and accessible semantic state badges.
- **Reusable Component Library**: `Button`, `Badge`, `Card`, `Input`, `Avatar`, `StatCard`, `Tabs`, `Modal` in `src/components/ui/`.
- **App Shells**: Persistent `MemberSidebar`, `AdminSidebar`, and `TopNav` with breadcrumbs, streak badge, points diamond, search, and user avatar.
- **All Reference Screens Implemented (40+ App Router Routes total)**.
- **Verification & Testing**:
  - `npm run typecheck`: PASS (0 errors)
  - `npm test`: PASS (146/146 tests across 7 suites: `rubric.test.ts` [16], `review-queue.test.ts` [15], `rbac.test.ts` [34], `state-machine.test.ts` [23], `auth.test.ts` [35], `errors.test.ts` [8], `components.test.tsx` [15])
  - `npm run lint`: PASS (0 errors, 0 warnings)
  - `npm run format:check`: PASS (Prettier clean across all files)
  - `npm run build`: PASS (Turbopack successfully compiles all routes + Proxy)

## What Is Broken / Open

- D-005 (DB hosting) pending team agreement before Prisma database migrations.
- D-003 (real-time chat approach) pending before chat backend work.
- Vitest devDependency audit flags documented in `SECURITY_NOTES.md`.

## Exact Next Action

1. Commit and push Phase 7 to branch `milan`: `git add -A && git commit -m "feat: complete Phase 7 rubric engine and points boundary" && git push origin milan`.
2. Open Pull Request from `milan` to `main`.
3. Hand off to Person 2 (Frontend Lead — Member Tasks & Leaderboard) and Person 3 (Backend Lead — Task CRUD & Streak Cron) per Team Breakdown specification.

---

_Last updated: 2026-10-28 · Phase 7 Rubric Engine & Points Boundary Complete (Person 1 Scope 100% Done)_


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
