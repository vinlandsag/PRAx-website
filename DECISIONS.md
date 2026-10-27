# DECISIONS.md

Architecture and product decisions log. Each entry is permanent and reversibility is noted.

> **Rule:** Do not change an existing decision without creating a new superseding entry.

---

## Decision Log

| ID | Date | Context | Options Considered | Decision | Reason | Consequences | Reversible? |
|----|------|---------|-------------------|----------|--------|--------------|------------|
| D-001 | 2026-10-27 | Project initialization | N/A | Create project memory files at repo root | Establish shared context for agent continuity and human review | All agents and contributors have a consistent source of truth | Yes |
| D-002 | PENDING | Stack selection | Next.js+TS+Prisma+PG vs Django vs Separate React+Express vs Go | **PROPOSED:** Next.js 15 / TS / Prisma / PostgreSQL / NextAuth.js v5 / Tailwind v4 | Best fit for installed Node 24, small team, full-stack in one repo | All subsequent phases depend on this | Yes (costly before Phase 3) |
| D-003 | PENDING | Real-time approach | Pusher (hosted, $) vs Socket.io (self-hosted, ops) | PENDING — team must decide before Phase 6 | Pusher simpler to start; Socket.io cheaper at scale | Affects P4 chat architecture | Yes (before Phase 6) |
| D-004 | PENDING | Auth strategy | NextAuth sessions vs JWT vs Supabase Auth | PENDING — team must decide before Phase 2 | Affects RBAC, P4 chat auth, P5 audit logs | Cascades everywhere | Yes (before Phase 2 only) |
| D-005 | PENDING | DB hosting | Supabase vs local Postgres vs RDS | PENDING — team must decide before Phase 1 | Affects P3 migration workflow and P5 CI | Infrastructure dependency | Yes (before Phase 2 only) |
| D-006 | PENDING | Monorepo vs polyrepo | Single Next.js app vs Nx/Turborepo vs separate repos | PROPOSED: single Next.js app for now | Simplest for 5 people; revisit if micro-services needed | Affects P5 CI config | Yes (before Phase 3) |

---

## Documented Assumptions (Phase 1)

These are PROPOSED until team signs off. Record sign-off date in a superseding row.

| ID | Assumption | Owner to confirm | Status |
|----|-----------|-----------------|--------|
| A-001 | PENDING_APPROVAL users can log in but see only onboarding screen | P1 | 🟡 PROPOSED |
| A-002 | Single Admin role for MVP; no super-admin hierarchy | All | 🟡 PROPOSED |
| A-003 | One non-terminal, non-draft submission per task per member at a time | P3 | 🟡 PROPOSED |
| A-004 | InviteCode has `maxUses` (default 1); multi-use codes expire by TTL or revocation | P1 | 🟡 PROPOSED |
| A-005 | Invite codes are 8-16 char alphanumeric, server-generated only | P1 | 🟡 PROPOSED |
| A-006 | Streak window = 7 rolling days; configurable via env var `STREAK_WINDOW_DAYS` | P3 | 🟡 PROPOSED |

---
_Last updated: 2026-10-27_
