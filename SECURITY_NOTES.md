# SECURITY_NOTES.md

Security threats and mitigations. Never store passwords, API keys, access tokens, private user data, or production secrets here.

---

## Session Handling

- **Status:** Implemented (Phase 3).
- **Mechanism:** Stateless, tamper-proof signed session cookies (`prax_session`) via `src/lib/auth/session.ts`.
- **Properties:**
  - HMAC-SHA256 signature using `env.sessionSecret`.
  - Constant-time verification with `crypto.timingSafeEqual` to prevent timing attacks.
  - Cookie attributes: `httpOnly: true`, `secure: true` (in production), `sameSite: "lax"`, `path: "/"`.
  - Strict TTL expiration enforced on both cookie and decrypted payload (default: 7 days).

## Invite Code Abuse & Brute-Force Protection

- **Status:** Implemented (Phase 3).
- **Entropy:** Generated via `crypto.randomBytes` using Base32 unambiguous character set (`PRAX-XXXX-XXXX`, 40+ bits entropy).
- **Lifecycle & Replay Prevention:**
  - Strict lifecycle states: `ACTIVE`, `USED`, `EXPIRED`, `REVOKED`.
  - Atomic check-and-increment of `usedCount` prevents race conditions and replay attacks.
  - Multi-use codes expire on `expiresAt` or admin revocation.
  - Rate limiting on `/api/invites/verify` (max 10 attempts per 10 minutes per IP) to resist automated code enumeration.

## Password & Credential Security

- **Status:** Implemented (Phase 3).
- **Algorithm:** Node.js native `crypto.scrypt` with 16-byte random salt, key length 64 (`salt:derivedKeyHex`).
- **Timing Attacks:** Verified using `crypto.timingSafeEqual`.
- **Policy:** Minimum 8 characters enforced. Raw passwords and derived keys are never logged or exposed in responses.

## Magic Link Authentication

- **Status:** Implemented (Phase 3).
- **Entropy & Storage:** 32-byte cryptographically secure random token (`crypto.randomBytes(32)`).
- **Storage Safety:** Raw token is never stored in the database. Only the SHA-256 hash (`crypto.createHash('sha256')`) is stored.
- **Expiry & Replay:** 15-minute TTL. Single-use consumption marks `usedAt` timestamp, immediately invalidating the token against replay attacks.
- **Account Status Guard:** Prevents login for `REJECTED`, `SUSPENDED`, and `DISABLED` accounts.

## Rate Limiting

- **Status:** Implemented (Phase 3).
- **Mechanism:** In-memory sliding-window rate limiter in `src/lib/auth/rate-limit.ts`.
- **Endpoints Protected:**
  - `POST /api/auth/login`: 5 attempts per 15 min per account/IP.
  - `POST /api/auth/magic-link/request`: 3 requests per 15 min per email/IP.
  - `POST /api/auth/magic-link/verify`: 5 verification attempts per 15 min per IP.
  - `POST /api/invites/verify`: 10 code checks per 10 min per IP.
  - `POST /api/auth/register`: 5 registrations per hour per IP.
- **Response:** Standard HTTP 429 `RATE_LIMITED` envelope.

## Privilege Escalation & Authorization (Phase 5 RBAC)

- **Rule:** All authorization checks must be enforced server-side. A hidden button or client-side navigation guard is strictly UX, not security.
- **Implementation:**
  - **Proxy Middleware (`src/proxy.ts`)**: Server-authoritative route interceptor protecting pages and API endpoints before components or route handlers execute.
  - **Server-Side Authorization Guard (`src/lib/auth/guard.ts`)**: Authoritative defense-in-depth on API routes checking session validity, role, status, permission, and data resource ownership.
  - **RBAC Engine (`src/lib/auth/rbac.ts`)**: Pure permission evaluation with strict deny-by-default.

### Permission Matrix

| Operation / Feature                                                        |       Visitor        |     Member (Pending)     |    Member (Approved)     |     Admin (Approved)     | Enforcement Point                  |
| :------------------------------------------------------------------------- | :------------------: | :----------------------: | :----------------------: | :----------------------: | :--------------------------------- |
| **Landing & Public Info** (`/`)                                            |          ✅          |            ✅            |            ✅            |            ✅            | Public                             |
| **Register with Invite** (`/login`, `/api/auth/register`)                  |          ✅          | ❌ (Already registered)  |            ❌            |            ❌            | Rate limited, Invite check         |
| **Login / Magic Link Request** (`/api/auth/login`)                         |          ✅          |            ✅            |            ✅            |            ✅            | Rate limited (429)                 |
| **Verify Invite Code** (`/api/invites/verify`)                             |          ✅          |            ✅            |            ✅            |            ✅            | Rate limited (429)                 |
| **View Onboarding Status** (`/onboarding`, `GET /api/users/me`)            | ❌ (Redirect /login) |            ✅            | ✅ (Redirect /dashboard) | ✅ (Redirect /dashboard) | Proxy + Guard                      |
| **Member Dashboard** (`/dashboard`)                                        |   ❌ (401 / Login)   |  ❌ (403 / Onboarding)   |            ✅            |            ✅            | Proxy + Guard                      |
| **Task Catalog & Detail** (`/tasks`, `/api/tasks`)                         |   ❌ (401 / Login)   |  ❌ (403 / Onboarding)   |            ✅            |            ✅            | Proxy + Guard                      |
| **Create Submission** (`POST /api/submissions`)                            |       ❌ (401)       | ❌ (403 ACCOUNT_PENDING) |            ✅            |            ✅            | Guard (`create:submission`)        |
| **View / Edit Own Submissions** (`/submissions`)                           |   ❌ (401 / Login)   |  ❌ (403 / Onboarding)   |      ✅ (Own only)       |         ✅ (All)         | Guard (`canAccessResource`)        |
| **View Own Streaks & Points** (`/streaks`)                                 |   ❌ (401 / Login)   |  ❌ (403 / Onboarding)   |            ✅            |            ✅            | Proxy + Guard                      |
| **Personal Space** (`/space`)                                              |   ❌ (401 / Login)   |  ❌ (403 / Onboarding)   |      ✅ (Own only)       |            ✅            | Proxy + Guard                      |
| **View Rubric (Read-Only)** (`/admin/rubric`, `/api/rubric`)               |   ❌ (401 / Login)   |  ❌ (403 / Onboarding)   |      ✅ (Read-only)      |        ✅ (Full)         | Guard (`view:rubric`)              |
| **Community Chat** (`/chat`, `/api/chat`)                                  |   ❌ (401 / Login)   |  ❌ (403 / Onboarding)   |            ✅            |            ✅            | Proxy + Guard                      |
| **View Member Profiles** (`/members/:id`)                                  |   ❌ (401 / Login)   |  ❌ (403 / Onboarding)   |            ✅            |            ✅            | Proxy + Guard                      |
| **Admin Review Queue** (`/admin`, `/admin/review`)                         |   ❌ (401 / Login)   |  ❌ (403 / Onboarding)   | ❌ (Redirect /dashboard) |            ✅            | Proxy + `requireRole("ADMIN")`     |
| **Approve / Reject Submissions** (`/api/admin/submissions/*`)              |       ❌ (401)       |         ❌ (403)         |    ❌ (403 FORBIDDEN)    |            ✅            | Guard (`admin:approve_submission`) |
| **Manage Users & Approval Queue** (`/admin/members`, `/api/admin/users/*`) |       ❌ (401)       |         ❌ (403)         |    ❌ (403 FORBIDDEN)    |   ✅ (No self-action)    | Guard + Self-Action Check          |
| **Create / Revoke Invites** (`/api/invites/*`)                             |       ❌ (401)       |         ❌ (403)         |    ❌ (403 FORBIDDEN)    |            ✅            | Guard (`admin:create_invite`)      |
| **Points Management** (`POST /api/admin/users/:id/points`)                 |       ❌ (401)       |         ❌ (403)         |    ❌ (403 FORBIDDEN)    |            ✅            | Guard (`admin:assign_points`)      |
| **Chat Moderation** (`DELETE /api/admin/messages/:id`)                     |       ❌ (401)       |         ❌ (403)         |    ❌ (403 FORBIDDEN)    |            ✅            | Guard (`admin:moderate_chat`)      |
| **View Audit Trail** (`/api/admin/audit-log`)                              |       ❌ (401)       |         ❌ (403)         |    ❌ (403 FORBIDDEN)    |            ✅            | Guard (`admin:view_audit_log`)     |

### Deny-by-Default Policy

1. **Unknown Roles:** If a user token has a role other than `"MEMBER"` or `"ADMIN"` (e.g. `"SUPER_ADMIN"`, `"HACKER"`, empty string, `null`), access is denied immediately with HTTP 403 `FORBIDDEN` (or redirected to `/login?error=unauthorized_role`).
2. **Unknown Permissions:** If a requested permission is not in the explicit permission set for that role, it evaluates to `false`.
3. **No Wildcard Grants:** The system does not use `*` wildcards. All permissions are statically enumerated.
4. **Data Ownership Check (`canAccessResource`)**: Members can only access their own resources (`user.id === resourceOwnerId`). Accessing another member's private data is blocked with HTTP 403 `FORBIDDEN`. Admins have override access where permitted.

### Role Tampering & Stale Session Mitigations

- **Cryptographic Signature Verification:** Session cookies (`prax_session`) are signed with HMAC-SHA256. Any modification to the role, user ID, status, or expiration timestamp without the server's private `SESSION_SECRET` invalidates the signature and causes `verifySession()` to return `null` (HTTP 401 `UNAUTHENTICATED`).
- **Stale / Expired Session Validation:** `verifySession()` and `authorize()` strictly check `Date.now() > session.expiresAt`. Stale tokens are rejected immediately with HTTP 401 `UNAUTHENTICATED`.

### Direct URL / API Access Protection Architecture

- **Defense-in-Depth Layer 1 (Proxy Middleware `src/proxy.ts`)**:
  - Intercepts all requests matching application routes.
  - Unauthenticated visitors attempting direct URL navigation to `/admin/*` or `/dashboard/*` are redirected to `/login?callbackUrl=...`.
  - Authenticated members attempting direct URL navigation to `/admin/*` are redirected to `/dashboard?error=access_denied`.
  - Direct API requests without valid credentials return HTTP 401 JSON; members calling admin APIs return HTTP 403 JSON.
- **Defense-in-Depth Layer 2 (API Route Guards `src/lib/auth/guard.ts`)**:
  - Every protected route handler executes `authorize()` or `requireRole("ADMIN")` before processing input or querying data stores.
  - Guaranteed server authorization even if proxy middleware were bypassed.

## User Lifecycle State Machine Security

- **Status:** Implemented (Phase 4).
- **Mechanism:** `src/lib/auth/state-machine.ts` (`transitionUserStatus`).
- **Enforcement:**
  - Transition table enforcement: Only valid state transitions from `MVP_SPEC.md §3` are allowed. Invalid attempts return HTTP 422 `INVALID_STATE_TRANSITION`.
  - Self-action prevention: Admins are strictly prohibited from approving, rejecting, suspending, unsuspending, or disabling their own account (`actor.id === targetUserId`). Attempted self-modification returns HTTP 403 `FORBIDDEN`.
  - Self-role modification prevention: Users cannot alter their own role.
  - Mandatory reasons: Admin rejection, suspension, and disablement require a valid reason of at least 3 non-whitespace characters (`VALIDATION_ERROR` on failure).
  - Terminal state: `DISABLED` is terminal and cannot transition to any other state.

## Audit Trail Security & Secret Scrubbing

- **Status:** Implemented (Phase 4).
- **Mechanism:** Append-only in-memory/database audit store via `src/lib/audit/audit.ts`.
- **Properties:**
  - Immutable event log recording actor ID, target user/resource, prior state, new state, reason, timestamp, and metadata.
  - Automated recursive secret scrubbing: Metadata objects are recursively scanned against a sensitive key regex (`password`, `token`, `secret`, `hash`, `salt`, `credential`, `cookie`). All matched values are replaced with `[REDACTED]` before persistence.
  - Raw tokens, passwords, session secrets, or private credentials never enter audit logs or system outputs.

## Admin Review Queue Security (Phase 6)

- **Status:** Implemented (Phase 6).
- **Authorization:** All four review queue API endpoints (`GET /api/admin/submissions`, `POST .../approve`, `POST .../reject`, `POST .../request-revision`) are guarded by `authorize(req, { allowedRoles: ["ADMIN"] })`. Visitors receive 401 `UNAUTHENTICATED`; non-admin members receive 403 `FORBIDDEN`.
- **Safe Proof Links:** `src/lib/utils/url.ts` validates and sanitizes user-submitted proof URLs. Dangerous protocols (`javascript:`, `data:`, `vbscript:`) are rejected. All proof links are rendered with `rel="noopener noreferrer" target="_blank"` to prevent tab-nabbing.
- **Points Validation:** Approval endpoint enforces `0 <= pointsAwarded <= submission.maxPoints` server-side to prevent negative or inflated point awards.
- **Mandatory Feedback:** Rejection and revision requests require a reason of at least 3 characters, enforced server-side.
- **Audit Trail:** All review actions emit typed audit events (`SUBMISSION_APPROVED`, `SUBMISSION_REJECTED`, `SUBMISSION_REVISION_REQUESTED`, `POINTS_ASSIGNED`) with actor ID, target submission ID, points, and feedback recorded for accountability.

## Points Boundary & Rubric Security (Phase 7)

- **Status:** Implemented (Phase 7).
- **Point Constraints Enforcement:** Server-side validation rejects any points that are non-numeric (`"abc"`, `NaN`, `Infinity`), fractional (`12.5`), negative (`< 0`), or exceed task maximum (`> maxPoints`).
- **No Double Points / Idempotency:** Duplicate approval requests on an already approved submission are rejected with `422 INVALID_STATE_TRANSITION`, ensuring points cannot be disbursed multiple times. Idempotency keys (`pts_${submissionId}_${rubricVersion}`) are registered at the transaction boundary.
- **Rubric Authorization:** Editing rubric (`PUT /api/rubric`) is restricted to Admins. Non-admins receive `403 FORBIDDEN`. All criteria updates bump version numbers and emit `RUBRIC_UPDATED` audit events.
- **Transactional Rollback:** If the points persistence boundary fails, submission status remains uncommitted (`SUBMITTED`), preventing orphaned approved submissions with missing points.

## Secrets Management

- **Rule:** No secrets in source code, logs, screenshots, or memory files.
- All secrets loaded via `.env` (local) or environment variables (production).
- `.env*` files are strictly in `.gitignore` (verified).
- `.env.example` provides placeholders only (`NEXTAUTH_SECRET`, `SESSION_SECRET`, `DATABASE_URL`).
- Centralized type-safe access in `src/lib/env.ts`.

## Dependency Security & Vulnerability Audit

- **Audit Date:** 2026-10-28
- **npm audit status:** 4 vulnerabilities in devDependencies (`@vitest/mocker` moderate, `tinypool` critical) via `vitest`.
- **Impact:** DevDependencies only (test runner and coverage). Not packaged or executed in Next.js production build bundle.

---

## Known Threats & Mitigations

| Threat                          | Mitigation                                                                                                 | Status      | Owner  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------- | ------ |
| Unauthenticated API access      | Signed session cookies on all protected endpoints                                                          | Implemented | P1     |
| Role escalation / Self-approval | Server-side role check (`role === "ADMIN"`) + self-action guard (`actor.id !== target.id`)                 | Implemented | P1     |
| Illegal lifecycle state jump    | Strict server-side transition table (`transitionUserStatus`); rejects invalid state transitions with 422   | Implemented | P1     |
| Secret leakage via audit logs   | Recursive regex scrubbing of sensitive keys (`password`, `token`, `secret`, `hash`, etc.)                  | Implemented | P5/P1  |
| Inactive user access            | Server-side authorization guard blocks `REJECTED`, `SUSPENDED`, and `DISABLED` users (403)                 | Implemented | P1     |
| Invite link guessing/abuse      | High-entropy random codes + rate limiting + atomic consumption                                             | Implemented | P1     |
| Magic link replay / theft       | SHA-256 token hashing + 15m TTL + single-use invalidation                                                  | Implemented | P1     |
| Credential stuffing             | Scrypt password hashing + sliding-window rate limiting (429)                                               | Implemented | P1     |
| Secret leakage via commits      | `.env*` in `.gitignore`; `.env.example` placeholders only                                                  | Implemented | P5/All |
| Error detail leakage / XSS      | `src/lib/errors.ts` standard envelope; no stack traces leaked                                              | Implemented | P5/P3  |
| CSRF                            | `SameSite=Lax` cookie policy + Next.js App Router protection                                               | Implemented | P5/P1  |
| Direct URL/API frontend bypass  | Proxy middleware (`src/proxy.ts`) + server guards (`guard.ts`); redirects pages & returns 401/403 for APIs | Implemented | P1/P5  |
| Role tampering / token forgery  | HMAC-SHA256 signature verification with constant-time equality; reject invalid signatures (401)            | Implemented | P1     |
| Unknown role injection          | Strict deny-by-default in `rbac.ts` and `guard.ts`; rejects unlisted roles (403 FORBIDDEN)                 | Implemented | P1     |
| Stale / expired session reuse   | Expiration TTL validated on cookie and decrypted token; rejects expired sessions (401)                     | Implemented | P1     |
| Data access across members      | Resource ownership check (`canAccessResource`); members cannot access other members' private resources     | Implemented | P1/P3  |
| Insecure real-time messages     | Auth token validation on socket connect                                                                    | Pending     | P4     |
| Moderation bypass               | Server-side content checks, audit log                                                                      | Pending     | P5     |

| Unsafe proof link injection | Safe URL validation (`isSafeUrl`) blocking `javascript:`, `data:`, `vbscript:` + `rel="noopener noreferrer"` | Implemented | P1/P5 |

---

_Last updated: 2026-10-28 · Phase 7 Rubric Engine & Points Boundary Complete_
