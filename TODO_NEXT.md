# TODO_NEXT.md

Prioritized task list. Each task has a status, owner, dependency, and acceptance criteria.

> Use ISO dates (YYYY-MM-DD). Record facts, not guesses.

---

## Active Tasks

### Phase 2 Close-out / Decisions (blocking Phase 3)

| Priority | Task                                              | Status | Owner | Depends On     | Acceptance Criteria                                        |
| -------- | ------------------------------------------------- | ------ | ----- | -------------- | ---------------------------------------------------------- |
| P0       | Decide auth strategy (D-004)                      | TODO   | P1    | —              | D-004 row updated in `DECISIONS.md`                        |
| P0       | Decide DB hosting (D-005)                         | TODO   | P3    | —              | D-005 row updated in `DECISIONS.md`                        |
| P1       | Sign off `MVP_SPEC.md` assumptions A-001 to A-006 | TODO   | All   | Phase 1 output | Each assumption marked AGREED or amended in `DECISIONS.md` |
| P1       | Sign off integration contracts IC-01 to IC-08     | TODO   | All   | —              | All IC rows marked AGREED in `API_CONTRACTS.md`            |
| P1       | Decide real-time approach (D-003)                 | TODO   | P4    | —              | D-003 row updated in `DECISIONS.md`                        |

### Phase 3 — Database & Shared Schema (blocked on D-004/D-005)

| Priority | Task                                                                                                          | Status | Owner    | Depends On             | Acceptance Criteria                                        |
| -------- | ------------------------------------------------------------------------------------------------------------- | ------ | -------- | ---------------------- | ---------------------------------------------------------- |
| P1       | Install Prisma ORM and initialize schema                                                                      | TODO   | P3       | D-005 AGREED           | `schema.prisma` configured; generator & client ready       |
| P1       | Draft Prisma schema v1 (`User`, `InviteCode`, `Task`, `Submission`, `PointTransaction`, `Streak`, `AuditLog`) | TODO   | P3       | D-005 AGREED           | `prisma migrate dev` runs; IC-02 fulfilled                 |
| P1       | Set up GitHub Actions CI skeleton (lint + typecheck + test gates)                                             | TODO   | P5       | Next.js scaffold       | CI runs on PR; lint + typecheck + test pass                |
| P1       | Implement `requireRole()` RBAC middleware                                                                     | TODO   | P1       | Prisma schema, NextAuth| IC-04 fulfilled; unit test passes                          |
| P1       | Implement `createAuditEvent()` shared function                                                                | TODO   | P5       | Prisma schema          | Used by P1/P3/P4; IC-08 approach consistent                |

---

## Completed Tasks

| Task                                                 | Completed  | Notes                                                                           |
| ---------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| Create project memory files                          | 2026-10-27 | 9 files created                                                                 |
| Phase 0 reconnaissance                               | 2026-10-27 | Report written; all acceptance criteria met                                     |
| Phase 1 MVP spec                                     | 2026-10-27 | `MVP_SPEC.md` written; `API_CONTRACTS.md` updated; all acceptance criteria met  |
| Initialize git repository & first commit             | 2026-10-27 | Commit `d855889` on `main`                                                      |
| Create `.gitignore` and `.env.example`               | 2026-10-27 | Verified no secrets committed                                                   |
| Scaffold Next.js 16 + TypeScript project             | 2026-10-27 | App Router, TS strict, Turbopack                                                |
| Configure Tailwind CSS v4                            | 2026-10-27 | `@tailwindcss/turbopack` and `tailwindcss` v4 configured                        |
| Configure Vitest test runner & coverage              | 2026-10-27 | Vitest 3 configured with `@vitejs/plugin-react`                                  |
| Implement `src/lib/errors.ts` standard API envelope  | 2026-10-27 | MVP_SPEC §8 error codes typed; 8 unit tests in `src/lib/errors.test.ts` passing |
| Implement `src/lib/env.ts` centralized validator     | 2026-10-27 | Typed env access with production required guards                                |
| Implement `GET /api/health` route                    | 2026-10-27 | Public health endpoint returning 200 OK                                         |
| Write comprehensive `README.md`                      | 2026-10-27 | Prerequisites, setup, commands, project structure                               |
| Run full CI verification suite locally               | 2026-10-27 | `typecheck`, `lint`, `format:check`, `test`, `build` all pass                   |

---

_Last updated: 2026-10-27_

