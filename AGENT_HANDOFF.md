# AGENT_HANDOFF.md

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
