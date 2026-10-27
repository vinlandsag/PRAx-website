# AGENT_HANDOFF.md

Concise handover document for the next agent or developer picking up this project.

## Architecture

- Next.js 16 (App Router, Turbopack, TypeScript 5)
- PostgreSQL 16 + Prisma ORM (to be added in Phase 3)
- NextAuth.js v5 for auth/RBAC (strategy pending D-004)
- Real-time: PENDING (D-003 — Pusher vs Socket.io)
- Tailwind CSS v4
- Vitest (unit tests) + Playwright (E2E planned)
- ESLint 9 + Prettier 3
- Deploy: Vercel + Supabase (PROPOSED)

## Current Status

- Phase 0 ✅, Phase 1 ✅, and Phase 2 ✅ complete.
- Repository has working Next.js 16 foundation, typed API error handlers, environment validation, and test harness.
- Git repository initialized on `main`; initial commit `d855889`.
- Full MVP spec in `MVP_SPEC.md`. Full API contracts in `API_CONTRACTS.md`. Developer setup guide in `README.md`.

## Unfinished Work / Decisions Needed Before Phase 3

- **D-004 (Auth Strategy):** Decide between NextAuth sessions vs JWT vs Supabase Auth (P1 owns).
- **D-005 (DB Hosting):** Decide Supabase vs local Postgres vs RDS (P3 owns).
- **Assumptions A-001 to A-006:** Team sign-off in `DECISIONS.md`.
- **Integration Contracts IC-01 to IC-08:** Sign off in `API_CONTRACTS.md`.

## Team Allocation

| Person | Domain                                                               |
| ------ | -------------------------------------------------------------------- |
| P1     | Auth / Onboarding / Admin review / Rubric / RBAC / Invite management |
| P2     | Task & Member-facing UI                                              |
| P3     | Database / APIs / Streaks / Points / Submissions                     |
| P4     | Chat / Personal Space                                                |
| P5     | Admin tools / Moderation / Audit log / QA / CI                       |

## Key Spec Files

| File               | Purpose                                                  |
| ------------------ | -------------------------------------------------------- |
| `MVP_SPEC.md`      | Roles, lifecycle states, scoring, error codes, ownership |
| `API_CONTRACTS.md` | Full endpoint contracts with request/response shapes     |
| `DECISIONS.md`     | All decisions and PROPOSED assumptions                   |
| `TODO_NEXT.md`     | Prioritized tasks with acceptance criteria               |
| `AGENTS.md`        | Global rules every agent must follow                     |
| `README.md`        | Developer onboarding and setup guide                     |

## Exact Next Steps (Phase 3)

1. Team decides D-004 (auth strategy) and D-005 (DB hosting).
2. Install Prisma ORM (`npm install prisma @prisma/client`).
3. Scaffold `prisma/schema.prisma` with v1 models:
   - `User`, `InviteCode`, `Task`, `Submission`, `PointTransaction`, `Streak`, `AuditLog`.
4. Run initial database migration (`npx prisma migrate dev`).
5. Implement `requireRole()` RBAC middleware (IC-04).
6. Implement `createAuditEvent()` shared function (IC-08).

## Commands to Verify Current State

```bash
npm run typecheck      # tsc --noEmit (passes)
npm run lint           # eslint . (passes)
npm run format:check   # prettier --check . (passes)
npm test               # vitest run (8/8 tests pass)
npm run build          # next build (production build succeeds)
curl http://localhost:3000/api/health # status 200 OK
```

## Active Risks

| Risk                      | Severity | Mitigation                                |
| ------------------------- | -------- | ----------------------------------------- |
| D-004 (auth) undefined    | HIGH     | Must resolve before NextAuth/Prisma integration |
| D-005 (DB hosting) pending| HIGH     | Must resolve before Prisma migrate        |
| All IC contracts PROPOSED | MEDIUM   | Sign off before building feature routes   |
| Vitest devDep audit flags | LOW      | Dev-only; monitored in `SECURITY_NOTES.md`|

---

_Last updated: 2026-10-27_

