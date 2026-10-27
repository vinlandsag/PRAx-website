# CHANGELOG_DEV.md

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
- **Commit Hash:** `d855889` (initial commit) + working tree ready for Phase 2 commit
- **Known Issues:**
  - D-004 (auth strategy) and D-005 (DB hosting) pending team agreement before Phase 3.
  - 4 devDependency vulnerabilities in vitest dependencies recorded in `SECURITY_NOTES.md`.

---

