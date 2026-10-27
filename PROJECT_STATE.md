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
│   │   ├── api/
│   │   │   └── health/route.ts   ← Health check (no auth)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       ├── env.ts                ← Centralised env var access
│       ├── errors.ts             ← Standard API error utility (MVP_SPEC §8)
│       └── errors.test.ts        ← Vitest suite (8/8 tests pass)
├── public/
├── .env.example                  ← Placeholder env template
├── .gitignore                    ← Secret, build, and node_modules exclusions
├── .prettierrc / .prettierignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── README.md                     ← Developer setup guide
├── tsconfig.json
├── vitest.config.ts
│
├── AGENTS.md                     ← Global agent rules
├── AGENT_HANDOFF.md              ← Handover document
├── API_CONTRACTS.md              ← Endpoint contracts and error shapes
├── CHANGELOG_DEV.md              ← Chronological dev changes
├── DECISIONS.md                  ← Architecture decision log & assumptions
├── MVP_SPEC.md                   ← Product specification & ownership matrix
├── PROJECT_STATE.md              ← Current repository state
├── SECURITY_NOTES.md             ← Security risks and mitigations
├── TEST_LOG.md                   ← Verifiable test execution records
└── TODO_NEXT.md                  ← Prioritised task list
```

## Completed Phases

- Phase 0: Repository reconnaissance and safe setup ✅
- Phase 1: Product requirements, architecture and interface contracts ✅
- Phase 2: Minimal app foundation and developer workflow ✅

## Current Branch / Commit

- Git: Initialized
- Branch: `main`
- Commit: Phase 2 changes ready for commit

## What Works

- Next.js 16 App Router application builds and runs clean (`npm run build`).
- `GET /api/health` status route (HTTP 200, status/timestamp/env).
- Centralized environment variable validator (`src/lib/env.ts`).
- Standard API error envelope with typed error codes (`src/lib/errors.ts`).
- Vitest unit test suite passes: 8 tests in `src/lib/errors.test.ts`.
- Full developer workflow verified: `typecheck`, `lint`, `format:check`, `test`, `build`.
- Complete local setup guide in `README.md`.
- No feature UI built; no production secrets or unnecessary packages added.

## What Is Broken / Open

- D-004 (auth strategy) and D-005 (DB hosting) still PENDING team approval.
- Prisma schema not yet scaffolded (scheduled for Phase 3).
- 4 devDependency vulnerabilities reported by npm audit in vitest test runner (recorded in `SECURITY_NOTES.md`).

## Exact Next Action

1. Team reviews and decides D-004 (auth strategy) and D-005 (DB hosting).
2. Begin Phase 3: Prisma schema v1 (`User`, `InviteCode`, `Task`, `Submission`, `PointTransaction`, `Streak`, `AuditLog`) + database migrations + IC-02 fulfillment.

---

_Last updated: 2026-10-27_

