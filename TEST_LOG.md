# TEST_LOG.md

Record of every test command run. A test is only marked PASS if it was actually run and passed.

> **Rule:** Never claim a test passed unless it was actually run.

## Format

Each entry must include:

- **Date/Time** (ISO 8601)
- **Environment** (OS, runtime version, etc.)
- **Command**
- **Pass/Fail**
- **Key Output** (relevant excerpt)
- **Unresolved Failures**

---

## Test History

### 2026-10-27T23:28:41+05:30

- **Environment:** macOS (Darwin 24.3.0), Node.js v24.15.0, npm 11.12.1
- **Command:** `npm run typecheck` (`tsc --noEmit`)
- **Pass/Fail:** PASS
- **Key Output:**
  ```
  > prax@0.1.0 typecheck
  > tsc --noEmit
  ```
- **Unresolved Failures:** None

### 2026-10-27T23:29:01+05:30

- **Environment:** macOS, Node.js v24.15.0, npm 11.12.1, ESLint 9
- **Command:** `npm run lint` (`eslint .`)
- **Pass/Fail:** PASS
- **Key Output:**
  ```
  > prax@0.1.0 lint
  > eslint .
  ```
- **Unresolved Failures:** None

### 2026-10-27T23:29:24+05:30

- **Environment:** macOS, Node.js v24.15.0, npm 11.12.1, Prettier 3
- **Command:** `npm run format:check` (`prettier --check .`)
- **Pass/Fail:** PASS
- **Key Output:**
  ```
  Checking formatting...
  All matched files use Prettier code style!
  ```
- **Unresolved Failures:** None

### 2026-10-27T23:29:38+05:30

- **Environment:** macOS, Node.js v24.15.0, npm 11.12.1, Vitest 3.2.7
- **Command:** `npm test` (`vitest run`)
- **Pass/Fail:** PASS (1 file, 8 tests passed)
- **Key Output:**
  ```
  ✓ src/lib/errors.test.ts (8 tests) 11ms
    ✓ apiError() > returns a response with the correct status code
    ✓ apiError() > returns the standard error envelope
    ✓ errors convenience helpers > errors.unauthenticated() → 401
    ✓ errors convenience helpers > errors.forbidden() → 403
    ✓ errors convenience helpers > errors.notFound() → 404 with default resource name
    ✓ errors convenience helpers > errors.notFound() → 404 with custom resource name
    ✓ errors convenience helpers > errors.accountPending() → 403 ACCOUNT_PENDING
    ✓ errors convenience helpers > errors.internal() → 500

  Test Files  1 passed (1)
       Tests  8 passed (8)
  ```
- **Unresolved Failures:** None

### 2026-10-27T23:29:53+05:30

- **Environment:** macOS, Node.js v24.15.0, npm 11.12.1, Next.js 16.4.3 Turbopack
- **Command:** `npm run build` (`next build`)
- **Pass/Fail:** PASS
- **Key Output:**
  ```
  ✓ Compiled successfully in 3.6s
  Finished TypeScript in 1923ms
  Route (app)
  ┌ ○ /
  ├ ○ /_not-found
  └ ƒ /api/health
  ```

### 2026-10-28T00:00:56+05:30

- **Environment:** macOS, Node.js v24.15.0, npm 11.12.1, TypeScript 5
- **Command:** `npm run typecheck` (`tsc --noEmit`)
- **Pass/Fail:** PASS
- **Key Output:**
  ```
  > prax@0.1.0 typecheck
  > tsc --noEmit
  ```
- **Unresolved Failures:** None

### 2026-10-28T00:01:10+05:30

- **Environment:** macOS, Node.js v24.15.0, npm 11.12.1, Vitest 3.2.7 + jsdom
- **Command:** `npm test` (`vitest run`)
- **Pass/Fail:** PASS (2 test files, 15 tests passed)
- **Key Output:**
  ```
  ✓ src/lib/errors.test.ts (8 tests)
  ✓ src/components/ui/components.test.tsx (7 tests)
  Test Files  2 passed (2)
       Tests  15 passed (15)
  ```
- **Unresolved Failures:** None

### 2026-10-28T00:05:56+05:30

- **Environment:** macOS, Node.js v24.15.0, npm 11.12.1, ESLint 9
- **Command:** `npm run lint` (`eslint .`)
- **Pass/Fail:** PASS (0 errors, 0 warnings)
- **Key Output:**
  ```
  > prax@0.1.0 lint
  > eslint .
  ```
- **Unresolved Failures:** None

### 2026-10-28T00:06:37+05:30

- **Environment:** macOS, Node.js v24.15.0, npm 11.12.1, Prettier 3
- **Command:** `npm run format:check` (`prettier --check .`)
- **Pass/Fail:** PASS
- **Key Output:**
  ```
  All matched files use Prettier code style!
  ```
- **Unresolved Failures:** None

### 2026-10-28T00:09:34+05:30

- **Environment:** macOS, Node.js v24.15.0, npm 11.12.1, Next.js 16.4.3 Turbopack
- **Command:** `npm run build` (`next build`)
- **Pass/Fail:** PASS (25 static and dynamic routes compiled in 648ms)
- **Key Output:**
  ```
  ✓ Compiled successfully in 648ms
  Route (app)
  ┌ ○ /
  ├ ○ /_not-found
  ├ ○ /admin
  ├ ○ /admin/members
  ├ ○ /admin/moderation
  ├ ○ /admin/review
  ├ ○ /admin/rubric
  ├ ○ /admin/tasks
  ├ ○ /admin/tasks/new
  ├ ƒ /api/health
  ├ ○ /chat
  ├ ○ /dashboard
  ├ ○ /leaderboard
  ├ ○ /login
  ├   /members/[id]
  ├ ○ /onboarding
  ├ ○ /profile
  ├ ○ /settings
  ├ ○ /space
  ├ ○ /streaks
  ├ ○ /submissions
  ├ ○ /tasks
  └   /tasks/[id]
  ```
- **Unresolved Failures:** None

### 2026-10-28T00:11:52+05:30

- **Environment:** macOS, local Next.js dev server at localhost:3000
- **Command:** `/usr/bin/curl` HTTP status check across all 18 routes
- **Pass/Fail:** PASS (all 18 routes returned HTTP 200 OK)
- **Key Output:**
  ```
  /dashboard -> HTTP 200
  /login -> HTTP 200
  /onboarding -> HTTP 200
  /tasks -> HTTP 200
  /tasks/1 -> HTTP 200
  /submissions -> HTTP 200
  /leaderboard -> HTTP 200
  /streaks -> HTTP 200
  /space -> HTTP 200
  /profile -> HTTP 200
  /settings -> HTTP 200
  /chat -> HTTP 200
  /admin -> HTTP 200
  /admin/tasks -> HTTP 200
  /admin/tasks/new -> HTTP 200
  /admin/members -> HTTP 200
  /admin/rubric -> HTTP 200
  /admin/moderation -> HTTP 200
  ```
- **Unresolved Failures:** None

### 2026-10-28T10:08:12+05:30

- **Environment:** macOS (Darwin 24.3.0), Node.js v24.15.0, npm 11.12.1
- **Command:** `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`
- **Pass/Fail:** PASS (Full suite passes: 23 unit tests pass across 2 test files, ESLint 0 errors, Prettier clean, Next.js Turbopack 25 routes built)
- **Key Output:**
  ```
  > tsc --noEmit (PASS)
  > eslint . (PASS - 0 errors, 0 warnings)
  > prettier --check . (PASS - All matched files use Prettier code style)
  ✓ src/lib/errors.test.ts (8 tests)
  ✓ src/components/ui/components.test.tsx (15 tests)
  Test Files  2 passed (2)
       Tests  23 passed (23)
  ✓ Compiled successfully in 373ms
  Route (app)
  ┌ ○ /
  ├ ○ /_not-found
  ├ ○ /admin
  ├ ○ /admin/members
  ├ ○ /admin/moderation
  ├ ○ /admin/review
  ├ ○ /admin/rubric
  ├ ○ /admin/tasks
  ├ ○ /admin/tasks/new
  ├ ƒ /api/health
  ├ ○ /chat
  ├ ○ /dashboard
  ├ ○ /leaderboard
  ├ ○ /login
  ├   /members/[id]
  ├ ○ /onboarding
  ├ ○ /profile
  ├ ○ /settings
  ├ ○ /space
  ├ ○ /streaks
  ├ ○ /submissions
  ├ ○ /tasks
  └   /tasks/[id]
  ```
- **Unresolved Failures:** None

### 2026-10-28T10:26:14+05:30

- **Environment:** macOS (Darwin 24.3.0), Node.js v24.15.0, npm 11.12.1, Next.js 16.4.3 Turbopack
- **Command:** `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`
- **Pass/Fail:** PASS (Full suite passes: 23 unit tests pass across 2 test files, ESLint 0 errors, Prettier clean, Next.js Turbopack 25 routes built)
- **Key Output:**
  ```
  > tsc --noEmit (PASS)
  > eslint . (PASS - 0 errors, 0 warnings)
  > prettier --check . (PASS - All matched files use Prettier code style)
  ✓ src/lib/errors.test.ts (8 tests)
  ✓ src/components/ui/components.test.tsx (15 tests)
  Test Files  2 passed (2)
       Tests  23 passed (23)
  ✓ Compiled successfully in 321ms
  Route (app)
  ┌ ○ /
  ├ ○ /_not-found
  ├ ○ /admin
  ├ ○ /admin/members
  ├ ○ /admin/moderation
  ├ ○ /admin/review
  ├ ○ /admin/rubric
  ├ ○ /admin/tasks
  ├ ○ /admin/tasks/new
  ├ ƒ /api/health
  ├ ○ /chat
  ├ ○ /dashboard
  ├ ○ /leaderboard
  ├ ○ /login
  ├   /members/[id]
  ├ ○ /onboarding
  ├ ○ /profile
  ├ ○ /settings
  ├ ○ /space
  ├ ○ /streaks
  ├ ○ /submissions
  ├ ○ /tasks
  └   /tasks/[id]
  ```
- **Unresolved Failures:** None

---

### 2026-10-28T11:02:23+05:30

- **Environment:** macOS (Darwin 24.3.0), Node.js v24.15.0, npm 11.12.1, Next.js 16.4.3 Turbopack
- **Command:** `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`
- **Pass/Fail:** PASS (Independent verification run: tsc 0 errors, eslint 0 errors 0 warnings, prettier clean across all files, vitest 23/23 tests pass, next build succeeds for 25 routes)
- **Key Output:**
  ```
  > tsc --noEmit (PASS)
  > eslint . (PASS - 0 errors, 0 warnings)
  > prettier --check . (PASS - All matched files use Prettier code style!)
  ✓ src/lib/errors.test.ts (8 tests)
  ✓ src/components/ui/components.test.tsx (15 tests)
  Test Files  2 passed (2)
       Tests  23 passed (23)
  ✓ Compiled successfully in 409ms
  Route (app)
  ┌ ○ /
  ├ ○ /_not-found
  ├ ○ /admin
  ├ ○ /admin/members
  ├ ○ /admin/moderation
  ├ ○ /admin/review
  ├ ○ /admin/rubric
  ├ ○ /admin/tasks
  ├ ○ /admin/tasks/new
  ├ ƒ /api/health
  ├ ○ /chat
  ├ ○ /dashboard
  ├ ○ /leaderboard
  ├ ○ /login
  ├   /members/[id]
  ├ ○ /onboarding
  ├ ○ /profile
  ├ ○ /settings
  ├ ○ /space
  ├ ○ /streaks
  ├ ○ /submissions
  ├ ○ /tasks
  └   /tasks/[id]
  ```
- **Unresolved Failures:** None

---

### 2026-10-28T11:18:23+05:30

- **Environment:** macOS (Darwin 24.3.0), Node.js v24.15.0, npm 11.12.1, Next.js 16.4.3 Turbopack
- **Command:** `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`
- **Pass/Fail:** PASS (Phase 3 Authentication, Rate Limiting & Invite Codes verification)
- **Key Output:**
  ```
  > tsc --noEmit (PASS - 0 errors)
  > eslint . (PASS - 0 errors, 0 warnings)
  > prettier --check . (PASS - All matched files use Prettier code style!)
  ✓ src/lib/errors.test.ts (8 tests)
  ✓ src/components/ui/components.test.tsx (15 tests)
  ✓ src/lib/auth/auth.test.ts (35 tests)
  Test Files  3 passed (3)
       Tests  58 passed (58)
  ✓ Compiled successfully in 407ms
  Route (app)
  ┌ ○ /
  ├ ○ /_not-found
  ├ ○ /admin
  ├ ○ /admin/members
  ├ ○ /admin/moderation
  ├ ○ /admin/review
  ├ ○ /admin/rubric
  ├ ○ /admin/tasks
  ├ ○ /admin/tasks/new
  ├ ƒ /api/auth/login
  ├ ƒ /api/auth/logout
  ├ ƒ /api/auth/magic-link/request
  ├ ƒ /api/auth/magic-link/verify
  ├ ƒ /api/auth/register
  ├ ƒ /api/health
  ├ ƒ /api/invites
  ├ ƒ /api/invites/[id]
  ├ ƒ /api/invites/verify
  ├ ƒ /api/users/me
  ├ ○ /chat
  ├ ○ /dashboard
  ├ ○ /leaderboard
  ├ ○ /login
  ├   /members/[id]
  ├ ○ /onboarding
  ├ ○ /profile
  ├ ○ /settings
  ├ ○ /space
  ├ ○ /streaks
  ├ ○ /submissions
  ├ ○ /tasks
  └   /tasks/[id]
  ```
- **Unresolved Failures:** None

---

### 2026-10-28T11:45:00+05:30

- **Environment:** macOS (Darwin 24.3.0), Node.js v24.15.0, npm 11.12.1, Next.js 16.4.3 Turbopack, Vitest 3.2.7
- **Command:** `npm test && npm run typecheck && npm run lint && npm run format:check && npm run build`
- **Pass/Fail:** PASS (Phase 4 Onboarding, State Machine & Audit Trail verification)
- **Key Output:**
  ```
  > tsc --noEmit (PASS - 0 errors)
  > eslint . (PASS - 0 errors, 0 warnings)
  > prettier --check . (PASS - All matched files use Prettier code style!)
  ✓ src/lib/errors.test.ts (8 tests)
  ✓ src/components/ui/components.test.tsx (15 tests)
  ✓ src/lib/auth/auth.test.ts (35 tests)
  ✓ src/lib/auth/state-machine.test.ts (23 tests)
  Test Files  4 passed (4)
       Tests  81 passed (81)
  ✓ Compiled successfully in 2.1s
  Route (app)
  ┌ ○ /
  ├ ○ /_not-found
  ├ ○ /admin
  ├ ○ /admin/members
  ├ ○ /admin/moderation
  ├ ○ /admin/review
  ├ ○ /admin/rubric
  ├ ○ /admin/tasks
  ├ ○ /admin/tasks/new
  ├ ƒ /api/admin/audit-log
  ├ ƒ /api/admin/users
  ├ ƒ /api/admin/users/[id]/approve
  ├ ƒ /api/admin/users/[id]/disable
  ├ ƒ /api/admin/users/[id]/reject
  ├ ƒ /api/admin/users/[id]/suspend
  ├ ƒ /api/admin/users/[id]/unsuspend
  ├ ƒ /api/auth/login
  ├ ƒ /api/auth/logout
  ├ ƒ /api/auth/magic-link/request
  ├ ƒ /api/auth/magic-link/verify
  ├ ƒ /api/auth/register
  ├ ƒ /api/health
  ├ ƒ /api/invites
  ├ ƒ /api/invites/[id]
  ├ ƒ /api/invites/verify
  ├ ƒ /api/users/me
  ├ ○ /chat
  ├ ○ /dashboard
  ├ ○ /leaderboard
  ├ ○ /login
  ├   /members/[id]
  ├ ○ /onboarding
  ├ ○ /profile
  ├ ○ /settings
  ├ ○ /space
  ├ ○ /streaks
  ├ ○ /submissions
  ├ ○ /tasks
  └   /tasks/[id]
  ```
- **Unresolved Failures:** None

---

### 2026-10-28T12:06:15+05:30

- **Environment:** macOS (Darwin 24.3.0), Node.js v24.15.0, npm 11.12.1, Next.js 16.4.3 Turbopack, Vitest 3.2.7
- **Command:** `npm test && npm run typecheck && npm run lint && npm run format:check && npm run build`
- **Pass/Fail:** PASS (Phase 5 RBAC, Route & API Protection, and Proxy Middleware verification)
- **Key Output:**
  ```
  > tsc --noEmit (PASS - 0 errors)
  > eslint . (PASS - 0 errors, 0 warnings)
  > prettier --check . (PASS - All matched files use Prettier code style!)
  ✓ src/lib/errors.test.ts (8 tests)
  ✓ src/components/ui/components.test.tsx (15 tests)
  ✓ src/lib/auth/rbac.test.ts (34 tests)
  ✓ src/lib/auth/auth.test.ts (35 tests)
  ✓ src/lib/auth/state-machine.test.ts (23 tests)
  Test Files  5 passed (5)
       Tests  115 passed (115)
  ✓ Compiled successfully in 710ms
  Route (app)
  ┌ ○ /
  ├ ○ /_not-found
  ├ ○ /admin
  ├ ○ /admin/members
  ├ ○ /admin/moderation
  ├ ○ /admin/review
  ├ ○ /admin/rubric
  ├ ○ /admin/tasks
  ├ ○ /admin/tasks/new
  ├ ƒ /api/admin/audit-log
  ├ ƒ /api/admin/users
  ├ ƒ /api/admin/users/[id]/approve
  ├ ƒ /api/admin/users/[id]/disable
  ├ ƒ /api/admin/users/[id]/reject
  ├ ƒ /api/admin/users/[id]/suspend
  ├ ƒ /api/admin/users/[id]/unsuspend
  ├ ƒ /api/auth/login
  ├ ƒ /api/auth/logout
  ├ ƒ /api/auth/magic-link/request
  ├ ƒ /api/auth/magic-link/verify
  ├ ƒ /api/auth/register
  ├ ƒ /api/health
  ├ ƒ /api/invites
  ├ ƒ /api/invites/[id]
  ├ ƒ /api/invites/verify
  ├ ƒ /api/users/me
  ├ ○ /chat
  ├ ○ /dashboard
  ├ ○ /leaderboard
  ├ ○ /login
  ├   /members/[id]
  ├ ○ /onboarding
  ├ ○ /profile
  ├ ○ /settings
  ├ ○ /space
  ├ ○ /streaks
  ├ ○ /submissions
  ├ ○ /tasks
  └   /tasks/[id]

  ƒ Proxy (Middleware)
  ```
- **Unresolved Failures:** None

---

### 2026-10-28T12:27:41+05:30

- **Environment:** macOS (Darwin 24.3.0), Node.js v24.15.0, npm 11.12.1, Next.js 16.4.3 Turbopack, Vitest 3.2.7
- **Command:** `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`
- **Pass/Fail:** PASS (Phase 6 Admin Review Queue & Review Efficiency verification)
- **Key Output:**
  ```
  > tsc --noEmit (PASS - 0 errors)
  > eslint . (PASS - 0 errors, 0 warnings)
  > prettier --check . (PASS - All matched files use Prettier code style!)
  ✓ src/lib/errors.test.ts (8 tests)
  ✓ src/components/ui/components.test.tsx (15 tests)
  ✓ src/lib/auth/rbac.test.ts (34 tests)
  ✓ src/app/admin/review-queue.test.ts (15 tests)
  ✓ src/lib/auth/auth.test.ts (35 tests)
  ✓ src/lib/auth/state-machine.test.ts (23 tests)
  Test Files  6 passed (6)
       Tests  130 passed (130)
  Duration  6.93s
  ✓ Compiled successfully
  Route (app)
  ┌ ○ /
  ├ ○ /_not-found
  ├ ○ /admin
  ├ ○ /admin/members
  ├ ○ /admin/moderation
  ├ ○ /admin/review
  ├ ○ /admin/rubric
  ├ ○ /admin/tasks
  ├ ○ /admin/tasks/new
  ├ ƒ /api/admin/audit-log
  ├ ƒ /api/admin/submissions
  ├ ƒ /api/admin/submissions/[id]/approve
  ├ ƒ /api/admin/submissions/[id]/reject
  ├ ƒ /api/admin/submissions/[id]/request-revision
  ├ ƒ /api/admin/users
  ├ ƒ /api/admin/users/[id]/approve
  ├ ƒ /api/admin/users/[id]/disable
  ├ ƒ /api/admin/users/[id]/reject
  ├ ƒ /api/admin/users/[id]/suspend
  ├ ƒ /api/admin/users/[id]/unsuspend
  ├ ƒ /api/auth/login
  ├ ƒ /api/auth/logout
  ├ ƒ /api/auth/magic-link/request
  ├ ƒ /api/auth/magic-link/verify
  ├ ƒ /api/auth/register
  ├ ƒ /api/health
  ├ ƒ /api/invites
  ├ ƒ /api/invites/[id]
  ├ ƒ /api/invites/verify
  ├ ƒ /api/users/me
  ├ ○ /chat
  ├ ○ /dashboard
  ├ ○ /leaderboard
  ├ ○ /login
  ├   /members/[id]
  ├ ○ /onboarding
  ├ ○ /profile
  ├ ○ /settings
  ├ ○ /space
  ├ ○ /streaks
  ├ ○ /submissions
  ├ ○ /tasks
  └   /tasks/[id]

  ƒ Proxy (Middleware)
  ```
- **Unresolved Failures:** None

---

_Last updated: 2026-10-28 · Phase 6 Admin Review Queue Complete_
