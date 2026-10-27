# PROJECT_STATE.md

## Product Goal
PRAX — an invite-only team platform. Members complete tasks, earn points and streaks, submit work for rubric-based admin review, and coordinate via chat and personal space. Admins manage membership, review submissions, assign points, maintain the rubric, and moderate content.

## Chosen Stack
**PROPOSED (not yet approved — pending D-002):**
- Runtime: Node.js 24 LTS
- Framework: Next.js 15 (App Router, TypeScript)
- Database: PostgreSQL 16 (hosting: pending D-005)
- ORM: Prisma
- Auth: NextAuth.js v5 (Auth.js) — strategy pending D-004
- Real-time: PENDING D-003 (Pusher vs Socket.io)
- Styling: Tailwind CSS v4
- Testing: Vitest (unit) + Playwright (E2E)
- CI: GitHub Actions (P5 owns)
- Deploy: Vercel + Supabase (PROPOSED)

## Repository Structure
```
/PRAx
├── AGENTS.md
├── AGENT_HANDOFF.md
├── API_CONTRACTS.md
├── CHANGELOG_DEV.md
├── DECISIONS.md
├── MVP_SPEC.md          ← NEW: Phase 1 output
├── PROJECT_STATE.md
├── SECURITY_NOTES.md
├── TEST_LOG.md
└── TODO_NEXT.md
```
No source code yet. No `package.json`. Git not initialized.

## Completed Phases
- Phase 0: Repository reconnaissance and safe setup ✅
- Phase 1: Product requirements, architecture and interface contracts ✅

## Current Branch / Commit
- Git: NOT INITIALIZED
- Branch: N/A
- Commit: N/A

## What Works
- 10 memory/spec files at repo root.
- Full MVP spec written (roles, lifecycle states, error codes, ownership).
- All API contracts drafted with request/response shapes and owners.

## What Is Broken
- Git not initialized (no `.git`, no `.gitignore`, no `.env.example`).
- D-002 through D-006 still PENDING — stack not yet approved.
- All IC-01 through IC-08 contracts still PROPOSED — not yet owner-signed.

## Exact Next Action
1. Team reviews and signs off `MVP_SPEC.md` assumptions (A-001 to A-006).
2. Team agrees on D-002 (stack), D-004 (auth), D-005 (DB hosting) — record in `DECISIONS.md`.
3. `git init` → commit all memory files → add `.gitignore` + `.env.example`.
4. Begin Phase 2: Next.js 15 scaffold + Prisma schema v1 + CI skeleton.

---
_Last updated: 2026-10-27_
