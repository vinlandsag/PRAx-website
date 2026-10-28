# TODO_NEXT.md

Prioritized task list. Each task has a status, owner, dependency, and acceptance criteria.

> Use ISO dates (YYYY-MM-DD). Record facts, not guesses.

---

## Active Tasks

### Phase 6 Close-out / Phase 7 Prerequisites

| Priority | Task                                            | Status | Owner | Depends On     | Acceptance Criteria                                                                            |
| -------- | ----------------------------------------------- | ------ | ----- | -------------- | ---------------------------------------------------------------------------------------------- |
| P0       | Implement Phase 6 Admin Review Queue            | DONE   | P1    | Phase 5        | 3-col review workspace, keyboard shortcuts, safe links, server-validated actions, 130/130 pass |
| P0       | Decide DB hosting (D-005)                       | TODO   | P3    | —              | D-005 row updated in `DECISIONS.md`                                                            |
| P1       | Sign off `MVP_SPEC.md` assumptions A-003, A-006 | TODO   | All   | Phase 1 output | A-001, A-002, A-004, A-005 AGREED; remaining marked AGREED                                     |
| P1       | Sign off integration contracts IC-01 to IC-08   | IN_PRG | All   | —              | IC-01, IC-04, IC-Admin-Review AGREED; remaining IC rows marked AGREED                          |
| P1       | Decide real-time approach (D-003)               | TODO   | P4    | —              | D-003 row updated in `DECISIONS.md`                                                            |

### Phase 7 — Tasks, Submissions & Scoring Engine

| Priority | Task                                                                                                          | Status | Owner | Depends On   | Acceptance Criteria                                         |
| -------- | ------------------------------------------------------------------------------------------------------------- | ------ | ----- | ------------ | ----------------------------------------------------------- |
| P1       | Implement Task creation, listing, and detail APIs (`GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks`) | TODO   | P3    | Phase 6      | Member/Admin access controls, active task list              |
| P1       | Implement Submission workflow (`DRAFT` -> `SUBMITTED` -> `UNDER_REVIEW` -> `APPROVED`/`REJECTED`)             | TODO   | P3/P5 | Tasks API    | Server-side state validation, single active submission rule |
| P1       | Implement Rubric Management (`GET /api/rubric`, `PUT /api/rubric`)                                            | TODO   | P1/P5 | Phase 6      | Criteria validation, versioning, audit logging              |
| P1       | Implement Points & Streaks Engine                                                                             | TODO   | P3    | Submissions  | Non-negative points ledger, streak computation, IC-07       |
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

---

_Last updated: 2026-10-28 · Phase 6 Admin Review Queue Complete_
