# AGENT_HANDOFF.md

Concise handover document for the next agent or developer picking up this project.

## Architecture
**PROPOSED (pending D-002 to D-006 approval):**
- Next.js 15 (App Router, TypeScript) — single-app monorepo
- PostgreSQL 16 + Prisma ORM
- NextAuth.js v5 for auth/RBAC (strategy TBD: D-004)
- Real-time: PENDING (D-003 — Pusher vs Socket.io)
- Tailwind CSS v4
- Vitest + Playwright for testing
- GitHub Actions CI
- Deploy: Vercel + Supabase (PROPOSED)

## Current Status
- Phase 0 ✅ and Phase 1 ✅ complete. No product code written.
- Repository has 10 memory/spec files only. **Git not initialized.**
- Full MVP spec in `MVP_SPEC.md`. Full API contracts in `API_CONTRACTS.md`.

## Unfinished Work
- Team must sign off assumptions A-001 to A-006 (see `DECISIONS.md`).
- D-002 (stack), D-004 (auth), D-005 (DB hosting) are blocking Phase 2.
- `git init`, `.gitignore`, `.env.example` not yet done.
- All 8 integration contracts (IC-01 to IC-08) are PROPOSED — not yet agreed.

## Team Allocation
| Person | Domain |
|--------|--------|
| P1 | Auth / Onboarding / Admin review / Rubric / RBAC / Invite management |
| P2 | Task & Member-facing UI |
| P3 | Database / APIs / Streaks / Points / Submissions |
| P4 | Chat / Personal Space |
| P5 | Admin tools / Moderation / Audit log / QA / CI |

## Key Spec Files
| File | Purpose |
|------|---------|
| `MVP_SPEC.md` | Roles, lifecycle states, scoring, error codes, ownership |
| `API_CONTRACTS.md` | Full endpoint contracts with request/response shapes |
| `DECISIONS.md` | All decisions and PROPOSED assumptions |
| `TODO_NEXT.md` | Prioritized tasks with acceptance criteria |
| `AGENTS.md` | Global rules every agent must follow |

## Exact Next Steps
1. Team signs off `MVP_SPEC.md` assumptions (A-001 to A-006).
2. Team decides D-002 (stack), D-004 (auth), D-005 (DB hosting).
3. `git init` → add `.gitignore` → commit memory files.
4. Create `.env.example`.
5. Sign off IC-01 to IC-08 integration contracts.
6. Begin Phase 2: Next.js scaffold + Prisma schema v1 + CI skeleton.

## Commands to Verify Current State
```bash
ls -la /Users/apple/milan/PRAx   # should show 10 files, no src/
git status                        # expected: not a git repository
node --version                    # v24.15.0
npm --version                     # 11.12.1
```

## Active Risks
| Risk | Severity | Mitigation |
|------|----------|-----------|
| Stack not approved | HIGH | Block Phase 2 until D-002 AGREED |
| Git not initialized | HIGH | Run `git init` before any code is written |
| All IC contracts PROPOSED | MEDIUM | Sign off before Phase 2 begins |
| D-004 (auth) undefined | HIGH | Cascades into every API route |

---
_Last updated: 2026-10-27_
