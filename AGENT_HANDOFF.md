# AGENT_HANDOFF.md

Handover document for the next engineer or agent picking up the PRAX Platform repository.

---

## 1. Current Goal and Phase

- **Product Goal:** Build the PRAX platform — an invite-only team workspace where members complete tasks, submit proof for rubric-based admin review, earn non-negative points and maintain daily streaks, and communicate via community chat and personal spaces.
- **Current Phase:** **Phase 6 (Admin Review Queue & Review Efficiency) Complete**.
  - 3-column desktop review workspace on `/admin` with searchable queue list (pending age badges), submission detail pane (safe proof links), and rubric scoring panel (sliders, feedback, action buttons).
  - Server-validated review API routes: `GET /api/admin/submissions` (listing), `POST .../approve` (points validation), `POST .../reject` (mandatory feedback), `POST .../request-revision` (mandatory feedback). All guarded by `authorize(req, { allowedRoles: ["ADMIN"] })`.
  - Documented keyboard shortcuts (`A` approve, `R` reject, `V` revision, `J`/`K` navigate, `?` help modal).
  - Safe URL validation (`src/lib/utils/url.ts`) blocking `javascript:`, `data:`, `vbscript:` protocols on proof links.
  - Loading, empty ("All Caught Up!"), and error states with retry.
  - All review actions emit typed audit events (`SUBMISSION_APPROVED`, `SUBMISSION_REJECTED`, `SUBMISSION_REVISION_REQUESTED`, `POINTS_ASSIGNED`).
  - 15 new tests in `src/app/admin/review-queue.test.ts`. Full suite: **130/130 tests** across 6 test suites.
  - All checks pass: typecheck, lint, format, tests, build.
- **Handoff Target:** Ready for Phase 7 (Tasks, Submissions & Scoring Engine).

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
- **Phase 3 (Authentication & Invite Codes):**
  - Salted password hashing (`crypto.scrypt` with random salt and constant-time verification).
  - Passwordless magic link request and verification (`crypto.randomBytes(32)` high-entropy token, SHA-256 hash storage, 15-minute TTL, single-use invalidation).
  - Stateless tamper-proof signed session cookies (`prax_session`) using HMAC-SHA256, `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, 7-day expiration.
  - Public registration (`POST /api/auth/register`) with invite code validation and automatic placement into `PENDING_APPROVAL`.
  - Cryptographically secure invite code lifecycle (`ACTIVE`, `USED`, `EXPIRED`, `REVOKED`) with atomic check-and-increment.
  - Sliding-window rate limiter on login, verification, and registration endpoints.
- **Phase 4 (Onboarding & Approval State Machine):**
  - Server-side state machine engine (`transitionUserStatus`) enforcing transitions according to `MVP_SPEC.md §3`.
  - Self-action guard preventing admins from approving, rejecting, suspending, unsuspending, or disabling themselves.
  - Mandatory reason validation for rejection, suspension, and disablement (minimum 3 non-whitespace characters).
  - Append-only, immutable audit trail engine (`src/lib/audit/audit.ts`) with automated recursive secret scrubbing.
  - Admin management endpoints: `GET /api/admin/users`, `POST /api/admin/users/:id/approve|reject|suspend|unsuspend|disable`, and `GET /api/admin/audit-log`.
  - UI integration: live member approval/rejection queue on `/admin/members` and real status polling with auto-redirect on `/onboarding`.
- **Phase 5 (RBAC and Route/API Protection):**
  - Pure RBAC engine (`src/lib/auth/rbac.ts`) with granular permission definitions, role-to-permission mappings, deny-by-default validation, and resource ownership checks.
  - Next.js 16 Proxy Middleware (`src/proxy.ts`) providing server-authoritative route and API protection against direct navigation bypass.
  - Defense-in-depth API route guard enhancements (`src/lib/auth/guard.ts`) with permission, role, stale session, and resource ownership validation.
  - Detailed Permission Matrix and security threat mitigations documented in `SECURITY_NOTES.md`.
- **Phase 6 (Admin Review Queue & Review Efficiency):**
  - Thread-safe in-memory submissions store (`src/lib/db/submissions-store.ts`) with pre-seeded test data.
  - Safe URL validator/sanitizer (`src/lib/utils/url.ts`).
  - 4 API routes: `GET /api/admin/submissions`, `POST .../[id]/approve`, `POST .../[id]/reject`, `POST .../[id]/request-revision`.
  - Full 3-column review workspace UI (`src/app/admin/page.tsx`) with pending age badges, keyboard shortcuts, rubric scoring, and loading/empty/error states.
  - 15 new tests in `src/app/admin/review-queue.test.ts`.

---

## 3. Exact Files Changed

### Modified Tracked Files (16 files)

1. `AGENTS.md`
2. `AGENT_HANDOFF.md`
3. `API_CONTRACTS.md`
4. `CHANGELOG_DEV.md`
5. `DECISIONS.md`
6. `PROJECT_STATE.md`
7. `SECURITY_NOTES.md`
8. `TEST_LOG.md`
9. `TODO_NEXT.md`
10. `next.config.ts`
11. `package.json`
12. `package-lock.json`
13. `src/app/globals.css`
14. `src/app/page.tsx`
15. `src/lib/env.ts`
16. `src/lib/errors.ts`

### Untracked Files Added in Working Tree (65+ files)

- `PRAX_Redesigned_High_Fidelity_Desktop_UI.pdf`
- Design Tokens: `src/lib/design-tokens.ts`
- Utility Modules: `src/lib/utils/url.ts`
- Audit System: `src/lib/audit/audit.ts`
- Next.js 16 Proxy Middleware: `src/proxy.ts`
- Auth & RBAC Security Engine:
  - `src/lib/auth/types.ts`, `password.ts`, `session.ts`, `rate-limit.ts`, `invite.ts`, `state-machine.ts`, `guard.ts`, `rbac.ts`
  - `src/lib/auth/auth.test.ts`, `state-machine.test.ts`, `rbac.test.ts`
- Data Stores:
  - `src/lib/db/auth-store.ts`
  - `src/lib/db/submissions-store.ts`
- API Route Handlers:
  - Auth: `register`, `login`, `logout`, `magic-link/request`, `magic-link/verify`
  - Invites: `route.ts`, `verify/route.ts`, `[id]/route.ts`
  - Users: `me/route.ts`
  - Admin Users: `route.ts`, `[id]/approve`, `[id]/reject`, `[id]/suspend`, `[id]/unsuspend`, `[id]/disable`
  - Admin Submissions: `route.ts`, `[id]/approve`, `[id]/reject`, `[id]/request-revision`
  - Admin Audit: `audit-log/route.ts`
- Review Queue Tests: `src/app/admin/review-queue.test.ts`
- Profile Component: `src/components/profile/ProfileView.tsx`
- Layout Shells: `MemberSidebar.tsx`, `AdminSidebar.tsx`, `TopNav.tsx`, `AppShell.tsx` (`src/components/layout/`)
- UI Library: `Avatar.tsx`, `Badge.tsx`, `Button.tsx`, `Card.tsx`, `Input.tsx`, `Modal.tsx`, `StatCard.tsx`, `Tabs.tsx`, `components.test.tsx`, `index.ts` (`src/components/ui/`)
- App Route Pages: 22 pages across `admin/`, `chat/`, `dashboard/`, `leaderboard/`, `login/`, `members/`, `onboarding/`, `profile/`, `settings/`, `space/`, `streaks/`, `submissions/`, `tasks/`.

---

## 4. Commands Actually Run and Results

All checks executed locally on macOS (Darwin 24.3.0, Node.js v24.15.0):

| Command                                       | Actual Result                                                                                                                                                                                     | Exit Code  |
| :-------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------- |
| `npm run typecheck` (`tsc --noEmit`)          | Finished with 0 type errors                                                                                                                                                                       | `0` (PASS) |
| `npm run lint` (`eslint .`)                   | 0 errors, 0 warnings                                                                                                                                                                              | `0` (PASS) |
| `npm run format:check` (`prettier --check .`) | `All matched files use Prettier code style!`                                                                                                                                                      | `0` (PASS) |
| `npm test` (`vitest run`)                     | 6 test files, 130/130 tests pass (`review-queue.test.ts` [15], `rbac.test.ts` [34], `state-machine.test.ts` [23], `auth.test.ts` [35], `components.test.tsx` [15], `errors.test.ts` [8]) in 6.93s | `0` (PASS) |
| `npm run build` (`next build`)                | Next.js 16 Turbopack successfully compiled all routes + Proxy                                                                                                                                     | `0` (PASS) |

---

## 5. Tests Not Run and Why

1. **Playwright End-to-End Browser Tests:** Not run because Playwright is not yet installed in `devDependencies` (scheduled for CI pipeline setup).
2. **PostgreSQL Database Server Tests:** Not run because PostgreSQL service is not yet provisioned (pending hosting decision D-005). The current implementation uses an in-memory thread-safe store conforming to all IC contracts and state machines.
3. **Real-time WebSocket / SSE Tests:** Not run because real-time architecture is pending decision D-003.

---

## 6. Known Bugs and Security Concerns

### Known Bugs

- **None in application code.**
- **Build Warning:** Turbopack emits a non-fatal warning during CSS PostCSS transform: `Unknown at rule: @theme`. This is a known fallback diagnostic in Tailwind v4 with Turbopack CSS parser; all styles compile and render correctly.
- **Git Lock in Sandbox:** Git index creation is restricted inside the default execution sandbox (`.git/index.lock: Operation not permitted`). The working tree is fully clean, formatted, tested, and ready for commit outside the sandbox or by the user.

### Security Concerns & Mitigations

- **Deny-by-Default:** Any role or permission not explicitly recognized evaluates to `false` and is rejected with HTTP 403 `FORBIDDEN`.
- **Direct Access Interception:** Next.js 16 Proxy Middleware (`src/proxy.ts`) ensures that attempting direct URL or API access without appropriate permissions is blocked before page rendering or API handler invocation.
- **Review Queue Authorization:** All 4 review queue API endpoints require ADMIN role. Visitors get 401; non-admin members get 403.
- **Safe Proof Links:** User-submitted proof URLs are validated against dangerous protocols (`javascript:`, `data:`, `vbscript:`) before rendering. All external links use `rel="noopener noreferrer" target="_blank"`.
- **Points Validation:** Server-side enforcement of `0 <= pointsAwarded <= submission.maxPoints`.
- **Mandatory Review Feedback:** Rejection and revision requests require at least 3 characters of feedback, enforced server-side.
- **Audit Trail:** All review actions emit immutable audit events with actor, target, action, points, and feedback. Secret scrubbing prevents credential leakage.
- **Role Tampering:** Session cookies are signed with HMAC-SHA256. Forging or tampering invalidates the cryptographic signature (HTTP 401).
- **Self-Action Protection:** Admins cannot self-approve, self-reject, self-suspend, or alter their own role.
- **Secrets Management:** Real `.env*` files are strictly gitignored. `.env.example` contains only placeholders.
- **Dependency Audit:** 4 devDependency vulnerabilities in Vitest (not in production bundle).

---

## 7. Open Decisions

| ID                | Title                   | Options                                           | Status                       | Blocking                 |
| :---------------- | :---------------------- | :------------------------------------------------ | :--------------------------- | :----------------------- |
| **D-005**         | DB Hosting              | Supabase vs. local PostgreSQL vs. RDS             | PENDING (P3 owns)            | Blocks Prisma migrations |
| **D-003**         | Real-time Approach      | Pusher vs. Socket.io                              | PENDING (P4 owns)            | Blocks chat backend      |
| **D-006**         | Repository Architecture | Single Next.js app vs. Monorepo                   | PROPOSED: single Next.js app | Non-blocking             |
| **A-003 & A-006** | MVP Assumptions         | Submission uniqueness, streak rolling window (7d) | PROPOSED in `DECISIONS.md`   | Non-blocking             |

---

## 8. Current Branch, Commit, and Uncommitted Changes

- **Current Branch:** `main`
- **Current HEAD Commit:** `05e6cbc` (`feat: complete Phase 2 minimal app foundation and developer workflow`)
- **Uncommitted Changes Status:**
  - 16 tracked files modified (see Section 3).
  - 65+ untracked files added (see Section 3).
  - All changes are clean, formatted with Prettier, pass all 130 tests, lint with 0 errors/warnings, typecheck with 0 errors, and compile without errors. Ready for git commit.

---

## 9. Exact Next 3 Actions in Order

1. **Commit the full working tree to git:**
   ```bash
   git add -A && git commit -m "feat: implement Phase 3–6 (auth, onboarding, RBAC, admin review queue)"
   ```
2. **Sign off D-005 (Database Hosting)** in `DECISIONS.md` — blocks Prisma ORM setup.
3. **Begin Phase 7 — Tasks, Submissions & Scoring Engine:**
   Implement Task CRUD APIs (`GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks`), Submission lifecycle (`DRAFT` -> `SUBMITTED` -> `UNDER_REVIEW`), Rubric criteria management (`GET /api/rubric`, `PUT /api/rubric`), and Points & Streaks engine with audit logging.

---

## 10. Copy-Paste Command to Run Project and Checks

```bash
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build && npm run dev
```

---

_Last updated: 2026-10-28T12:37:00+05:30 · Phase 6 Admin Review Queue & Review Efficiency Complete_
