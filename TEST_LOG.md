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
- **Unresolved Failures:** None

---

_Last updated: 2026-10-27_

