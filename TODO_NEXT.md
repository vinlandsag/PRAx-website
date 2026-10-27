# TODO_NEXT.md

Prioritized task list. Each task has a status, owner, dependency, and acceptance criteria.

> Use ISO dates (YYYY-MM-DD). Record facts, not guesses.

---

## Active Tasks

### Phase 0/1 Close-out (blocking Phase 2)

| Priority | Task | Status | Owner | Depends On | Acceptance Criteria |
|----------|------|--------|-------|-----------|---------------------|
| P0 | Sign off `MVP_SPEC.md` assumptions A-001 to A-006 | TODO | All | Phase 1 output | Each assumption marked AGREED or amended in `DECISIONS.md` |
| P0 | Approve stack proposal (D-002) | TODO | All | — | D-002 row updated with date + AGREED in `DECISIONS.md` |
| P0 | Decide DB hosting (D-005) | TODO | P3 | — | D-005 row updated in `DECISIONS.md` |
| P0 | Decide auth strategy (D-004) | TODO | P1 | — | D-004 row updated in `DECISIONS.md` |
| P0 | `git init` and commit memory files | TODO | P5/Agent | Stack approval | `git log` shows first commit with all memory files |
| P0 | Create `.gitignore` | TODO | P5/Agent | `git init` | `.env`, `node_modules`, `.DS_Store`, `.next` excluded |
| P0 | Create `.env.example` | TODO | P5/Agent | Stack approval | All required env var keys listed with placeholder values |
| P1 | Sign off integration contracts IC-01 to IC-08 | TODO | All | — | All IC rows marked AGREED in `API_CONTRACTS.md` |
| P1 | Decide real-time approach (D-003) | TODO | P4 | — | D-003 row updated in `DECISIONS.md` |

### Phase 2 — Foundation (blocked on Phase 0/1 close-out)

| Priority | Task | Status | Owner | Depends On | Acceptance Criteria |
|----------|------|--------|-------|-----------|---------------------|
| P1 | Scaffold Next.js 15 + TypeScript project | TODO | P5/Agent | D-002 AGREED, git init | `npm run dev` starts; TypeScript compiles |
| P1 | Configure Tailwind CSS v4 | TODO | P2 | Next.js scaffold | Tailwind classes apply correctly |
| P1 | Draft Prisma schema v1 (`User`, `InviteCode`, `Task`, `Submission`, `PointTransaction`, `Streak`, `AuditLog`) | TODO | P3 | D-005 AGREED | `prisma migrate dev` runs; IC-02 fulfilled |
| P1 | Set up GitHub Actions CI skeleton (lint + typecheck + test gates) | TODO | P5 | git initialized, Next.js scaffold | CI runs on PR; lint + typecheck pass |
| P1 | Install Vitest + Playwright | TODO | P5 | Next.js scaffold | `npm test` runs ≥1 passing test; recorded in `TEST_LOG.md` |
| P1 | Implement `requireRole()` RBAC middleware | TODO | P1 | Prisma schema, NextAuth | IC-04 fulfilled; unit test passes |
| P1 | Implement `createAuditEvent()` shared function | TODO | P5 | Prisma schema | Used by P1/P3/P4; IC-08 approach consistent |

---

## Completed Tasks

| Task | Completed | Notes |
|------|-----------|-------|
| Create project memory files | 2026-10-27 | 9 files created |
| Phase 0 reconnaissance | 2026-10-27 | Report written; all acceptance criteria met |
| Phase 1 MVP spec | 2026-10-27 | `MVP_SPEC.md` written; `API_CONTRACTS.md` updated; all acceptance criteria met |

---
_Last updated: 2026-10-27_
