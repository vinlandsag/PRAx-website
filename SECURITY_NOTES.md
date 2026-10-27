# SECURITY_NOTES.md

Security threats and mitigations. Never store passwords, API keys, access tokens, private user data, or production secrets here.

---

## Session Handling
PENDING — depends on D-004 (auth strategy). Candidate: NextAuth.js v5 with server-side session cookies (httpOnly, Secure, SameSite=Lax).

## Invite Abuse
Risk: invite links can be guessed or reused.
Mitigation: single-use tokens with expiry. PENDING implementation.

## Privilege Escalation
Risk: client-side role checks can be bypassed.
Mitigation: **All role checks must be server-side** (middleware or API route). Client UI guards are UX only, not security. (See Rule 5 in `AGENTS.md`.)

## CSRF / CORS
PENDING — Next.js App Router has CSRF protections built in for Server Actions. REST API routes need explicit CORS config. Document when Phase 1 is scaffolded.

## Rate Limits
UNKNOWN — no infrastructure yet. Candidate: `@upstash/ratelimit` with Redis, or Vercel Edge middleware. Decide in Phase 5.

## Secrets Management
- **Rule:** No secrets in source code, logs, screenshots, or these memory files.
- All secrets in `.env` (local) or environment variables (production).
- `.env` must be in `.gitignore`.
- `.env.example` with placeholders must be committed.
- `.env` files: NOT YET CREATED — to be created in Phase 0 close-out.

## Data Isolation
UNKNOWN — multi-tenant isolation strategy not yet defined. Depends on schema design (P3).

## Audit Events
UNKNOWN — logging strategy not defined. P5 to define in Phase 5.

---

## Known Threats & Mitigations

| Threat | Mitigation | Status | Owner |
|--------|-----------|--------|-------|
| Unauthenticated API access | Server-side auth middleware on all protected routes | Pending | P1 |
| Role escalation | Server-side RBAC checks; no client-side trust | Pending | P1 |
| Invite link abuse | Single-use tokens with expiry | Pending | P1 |
| Secret leakage via commits | `.env` in `.gitignore`; `.env.example` only | Pending | P5/All |
| XSS | React's default escaping; CSP headers | Pending | P5 |
| CSRF | Next.js built-in + explicit CORS policy | Pending | P5 |
| Insecure real-time messages | Auth token validation on socket connect | Pending | P4 |
| Moderation bypass | Server-side content checks, audit log | Pending | P5 |

---
_Last updated: 2026-10-27_
