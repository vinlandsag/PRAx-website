# PROJECT_STATE.md

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
