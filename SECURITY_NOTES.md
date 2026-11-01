## 2026-11-01 — Authenticated own-profile boundary

`/api/users/me/profile` accepts no user identifier and always queries/updates by the persisted account ID matched to the signed session. It revalidates approved account status and role/name using `requirePersistedAccount`; a missing or mismatched account is denied. The profile query selects only profile columns and ID needed for fallback handle generation, never email or passwordHash. PATCH uses same-origin validation, bounded JSON, an allowlist of editable fields, length/shape limits, credential-free HTTP(S)-only URLs, and a unique database handle constraint. The response is private/no-store. The updated name claim is re-signed so subsequent persisted-account checks continue to pass. Display metrics are read-only projections from the existing points ledger, leaderboard, streak, and approved-submission records; profile input cannot modify them. This API does not access Chat or Personal Space data or affect their privacy boundaries.

## Performance benchmark data boundary (2026-11-01)

Phase 9 used only the separate migrated test Supabase project and synthetic records. The opt-in harness checks that its project differs from `DATABASE_URL` and `DIRECT_URL`, scopes rows with a random `perf-` prefix, and deletes only those rows during cleanup. It does not print connection strings or write user content; no primary-project fixture or load test was run. Keep `TEST_DATABASE_URL` local and never commit or share it.

## Review-to-award boundary (2026-11-01)

Review actions require the existing signed ADMIN session and a matching persisted APPROVED ADMIN account. Approval rejects extra client fields and derives reviewer ID, rubric marker, recipient, task maximum and idempotency key on the server. The points service commits status, immutable ledger row and streak refresh in one transaction. Rejection/revision condition writes are limited to reviewable statuses and award no points. The integration harness creates synthetic approved users, signed test sessions and tagged task/submission records only; Chat and Personal Space are not queried. Persisted auth lifecycle remains outside this phase.

# SECURITY_NOTES.md

## Phase 11 release boundary (2026-11-01)

Production sign-in is not ready: durable registration/login/current-user and admin bootstrap are not connected. The retained test member is loopback/development-only and must not be seeded or enabled online. Never place secret values in README, logs, CI output, or chat. Logger emits only fixed event names and validated opaque request IDs. Migration execution, test fixtures, and scheduler setup must target their explicitly designated non-production or approved project; the integration harness refuses the same project identity as app/migration URLs. The production project identity, backup/restore, and Cron state are not verified here. No production operation was performed.

## Database and session security boundary (2026-11-01)

The application uses Prisma against Supabase PostgreSQL and authorizes API requests with its existing signed HMAC session and server-side account/role checks. No Supabase service-role client is used in application routes. The Supabase SQL scaffold from `main` is not part of this integration: its `auth.uid()` RLS policies rely on Supabase Auth identity, which is not the application's current session mechanism. Do not apply those policies/schema as a substitute for route authorization. Chat and Personal Space remain outside scoring/streak queries and need Person 4's review before database ownership is changed.

## Authorized GitHub delivery of current work (2026-10-31)

User explicitly requested pushing the current changes to GitHub; continue using the previously selected donel branch at origin https://github.com/vinlandsag/PRAx-website.git. Fetched origin/donel and verified it matches local base 409d475 (0 ahead, 0 behind) before this delivery commit. Scope includes the backend cleanup, notification UI, retained development-only member account, Node 24/upload configuration and current handoff docs. Local-only hosting clarification remains in effect; this Git push does not deploy a website.

Fresh pre-push checks passed: 226 tests/13 files in 8.91 s; tsc --noEmit and full ESLint exit 0; Git whitespace check clean. Limited scan of 157 text candidates found no high-confidence secret markers or configured private session key. .env.local, .next, node_modules and .vercel remain ignored; only blank .env.example is included. Last production build is the passed 47/47 hosting preflight; it was not repeated for this Git-only action.

No global Git author identity is configured; use existing repository convention PRAX Agent <prax-agent@local> for this commit command only. Publish normally to donel, without force pushing or changing main; verify HEAD against the remote receipt afterward. This note records scope/checks before commit/push so the final delivery hash is available from Git history. Keep the local test account and existing local server; do not restart cloud hosting.

## Latest clarification — run locally (2026-10-31)

User clarified “host it” means local hosting. This supersedes the pending Vercel deployment/sign-in next step. Do not continue cloud deployment or request Vercel authorization for this task. Prior device-login exec session 44678 is no longer available; no site was deployed. Existing hosting-preparation files remain harmless local changes; no application code changed in this run.

Started npm run dev -- --hostname 127.0.0.1 --port 3000 using installed Node/npm (exec session 41439), ready in 728 ms. Confirmed health HTTP 200/environment development and login page HTTP 200; queued the local login browser panel. Server remains running on loopback only. The original local member test account is preserved; backend-dependent data remains disconnected. No secret, commit, push or remote deployment. Tests/lint/build not repeated for this server-only action. Next step: open http://127.0.0.1:3000/login and use the retained test credentials.

## Deployment source boundary (2026-10-31, D-023)

.vercelignore now allows only src/public and explicit build configs. Local .env files (including nested copies), keys, cloud credentials, Git metadata, build caches and dependencies are excluded from uploads. Verified representative patterns before attempting hosting. No .env.local signing key was transmitted or configured as a production key. Existing private signing requirement and developmentOnly cookie restriction remain unchanged.

Used the official npm Vercel CLI with no project dependency addition. Vercel account is unauthenticated; device authorization link was shown only for the user to complete provider sign-in, not stored in source/docs. No auto-approved provider access, created remote project, public deployment, billing change, source push or disabled protection. Follow up with an actual deployment receipt before claiming hosting is complete.

## Retained local test member boundary (2026-10-31, D-022)

The user explicitly requested retaining the test member. Restored only a development/loopback-host fixture, not a production seed or mutable mock auth store. Fixture role is MEMBER, never ADMIN. Credential is the existing public local testing fixture; it is not a real personal password. No real credential, cookie, private key or screenshot token was logged. Private session key generated locally only because none was configured, stored in ignored .env.local, not committed. Built-in signing defaults remain removed.

Login checks supplied Origin against actual Host, restricts request host to loopback, validates fields/password and uses existing rate limits/scrypt helpers. Successful response is no-store and uses existing HttpOnly cookie options. Signed developmentOnly marker prevents a locally issued fixture cookie from authenticating outside development, even with the same key. Production/test handlers never issue fixture sessions. Current-user reads require an authenticated matching fixture identity and remain protected by existing role/status guard. No auth bypass added to proxy or frontend pages. No other backend/store, fixture feed, notification persistence or fake-success behavior restored.

## Backend cleanup boundary — D-021 (2026-10-29)

Removed seeded users/passwords/invites, dev token issuance and all prototype runtime data/upload/audit/points stores. Removed public UI credential prefills, magic token display, fake invite generation and success-on-error admin behavior. Actual session signing now requires a private configured secret of at least 32 characters; old built-in fallback keys are rejected. .env.example contains blank placeholders, while real env files remain ignored. No real secrets, screenshot token, cookie or environment contents were logged or copied.

Unimplemented APIs return 503 BACKEND_NOT_CONFIGURED and no-store; approved-role guards remain on private/admin routes, with 401/403 before service access. No auth bypass, browser-stored private data or replacement mock persistence. These guards are not a completed database-backed auth system: backend team must implement current account verification/revocation, same-origin write policy, validation, ownership, durable storage, audit and transaction boundaries. No data is returned or written by these seams. Logout still expires its cookie.

Notification links are restricted to internal paths, messages render as text, and failed mark-read requests do not clear unread state. Loading/error/empty states do not imply delivered updates. No email/push provider, new dependency, external storage, production connection or deployment was added. Test secrets/fixture identities exist only in tests. A limited high-confidence pattern scan found no matching secrets; this does not certify a full security audit. Existing historical prototype notes below are superseded for current runtime behavior.

## Interaction profiles and chat attachment boundary (2026-10-29)

Public profile reads now resolve target auth records directly, require current APPROVED viewer/target status and return only public fields. Inactive/unknown targets are uniformly 404. Portfolio privacy remains enforced; other private collections, settings, email/password/role are excluded. Uninitialized account defaults use ids for handles, with no inferred bio/skills. Demo profile data is labelled, read-only and never grants an auth identity. Return links use a two-value whitelist.

Uploads use the same current-account guard and same-origin write check. Pending bytes are author-private, and attachment ids are atomically claimed only by their uploader; other users cannot steal/reuse them. Approved channel members can fetch only shared files. Message deletion/eviction removes corresponding bytes; pending deletion requires ownership. Body streaming, per-file/message/account/process caps and lazy pending expiry bound memory. Extension whitelist uses own properties (constructor/**proto** rejected), content signatures/UTF-8 are verified and client MIME is not trusted. Unsupported active/executable types including HTML/SVG/JS/EXE are rejected. Documents are forced downloads; media MIME, encoded filename, nosniff, no-store and default-src none CSP are set. Byte ranges have integer/bounds checks. No disk path is derived from filenames, no uploaded code executes, no remote file fetching occurs.

No credential/cookie was printed or persisted during tests; existing local fixture authentication was used and session headers stayed in process memory. Test media is non-sensitive: authored PNG/TXT plus public MDN sample video. No new secret/environment variable/dependency, auth bypass or production deployment. Existing .env exclusions retained.

Limits: process memory is not durable or distributed; format signature checks are not malware scanning or full container validation. Production needs durable authorized storage, operational quotas/rate controls and a scanning policy. In-app browser save tests were cancelled, while live authenticated HTTP download contents and range bytes matched fixtures. No actual mobile-device/browser-download filesystem pass is claimed.

## Reference cursor boundary (2026-10-29)

Cursor appearance only: static local RGBA PNGs, plus SVG authoring sources containing local fragment references and bounded blur. No script, external image/font request, pointer tracking, animation, event listener, hidden native cursor or moving overlay. Existing high-contrast/touch/native text/disabled behavior and fallback keywords remain in CSS. Existing /artwork/ serving rule is reused; no auth, session, API or dependency change. Live browser verification was unavailable; no user account/browser state was modified successfully in this follow-up.

## Functional workspace boundary (2026-10-29)

New /api/workspace authenticates with the existing guard, then checks the actual account and current role/status in authStore. Private collections/settings/profile updates are keyed by that account; arbitrary member ids cannot address another user's private records, even for admins. Public profile reads expose profile fields only and hide portfolio links when requested. Chat edits require authorship; pinning requires admin; deletion requires author/admin. Successful moderation is audited without raw content. These boundaries are exercised by API tests rather than relying on disabled buttons.

The API validates all enum, boolean, integer/date, length and URL inputs, rejects unknown private/profile/settings fields and caps request size. Browser-origin writes compare Origin with protocol and actual Host, not forwarded-host; foreign origins are rejected. React renders message/note content as text. Profile links accept HTTP(S), use noopener/noreferrer, and never invent links. Photo loading is client-side by the saved validated URL; no server fetch/upload was added.

Only the non-sensitive theme preference is cached in localStorage; private data and cookies are not copied into local storage or logs. Browser verification used the already documented local seed member fixture; no real credentials/environment contents were inspected. Existing .env* ignore rule remains. No new dependency, credential, environment variable, production deployment or auth bypass.

Risks remaining: process-memory state is volatile and not shared between instances; production must use durable authorized persistence. Notification delivery, socket authentication/moderation infrastructure and external image policy remain future work. Historical dependency-audit notes are unchanged; audit was not rerun. Test data is confined to the local seeded account/process.

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

## UI foundation boundary (2026-10-28)

Review fixtures are illustrative. Both proxy and server page gate /design-system; production 404 verified. Public /fonts/ and /artwork/ exemptions do not change protected-route authorization; existing auth tests and dashboard redirect passed. No auth/backend/session implementation changed.

Uploads remain local object-URL previews. MIME/size/count/empty/decode validation is presentation behavior; any future upload endpoint must validate server-side. SVG is rejected; object URLs are revoked on replacement, removal, decode failure and unmount. React renders user content as text. Dialog background is inert and prior state restored on close.

Inter is self-hosted, with license retained; no runtime Google font request. Only explicit loopback 127.0.0.1 is added as a dev origin. No wildcard dev origin, new secret/environment variable, or deployment. Existing .env* exclusions were inspected and retained. Dependency audit was not rerun; historical audit results are not new verification.

Cursor texture follow-up (2026-10-28): local static SVG patterns only; no scripts, external asset references, network services or pointer tracking. No security boundary or authorization change.

## Profile layout verification boundary (2026-10-29)

No auth/session/API changes. Because the parent browser had no session for /profile, visual checks used the exact ProfileView component with illustrative props in a temporary /design-system/profile-regression fixture. The existing proxy and a server-side development check guarded it. It was removed before final build and is absent from the build route list. No credentials or cookies were inspected or copied; actual authenticated-route rendering remains outside the visual evidence. Production authorization was preserved.

### Local run request (2026-10-29)

Started the existing Next.js development server on port 3000 (session 26883); reported Ready in 749 ms. No application code, interface, security policy or design decision changed. Existing process-memory reset limits apply. No tests/build rerun for this server-only action.

### npm terminal diagnosis (2026-10-29)

Read-only environment checks found Node v24.22.1 from the Codex bundled runtime, but no npm/npm.cmd on this terminal's PATH or in the standard Node install locations checked. package.json already defines dev as next dev. No attached user terminal was available, so its exact error is unverified. No application/configuration change, installation or test/build run. Direct node node_modules/next/dist/bin/next dev --port 3000 is the available equivalent here.

### Windows terminal runtime follow-up (2026-10-29)

User supplied CMD error: node is not recognized. Verified the absolute Codex runtime node.exe path executes and reports v24.22.1; standard Node installation paths checked were absent. Provided a quoted absolute-path launch command and official Node Windows installer guidance for node/npm on PATH. No installation, PATH modification, application code change or tests/build performed.

### Windows Node/npm setup completed (2026-10-29)

Resolved the user's CMD node/npm not recognized errors by installing the official Node.js v24.22.2 win-x64 archive (includes npm 11.19.1) at C:\Users\donel\AppData\Local\Programs\nodejs. Downloaded over HTTPS from nodejs.org/dist/latest-v24.x/ and verified SHA256 ca1bff5d8ead13c9f2ea404a176db46bd430704d5b5113734049fa365e7799e2 against the official checksum before extraction. Added only this directory to persistent User PATH, preserving existing entries; broadcast WM_SETTINGCHANGE. No machine PATH, execution policy, app code, dependencies, API or backend changes. Temporary archive/extraction directory retained under Windows Temp.
Passed (exit 0): CMD using Machine+User saved PATH resolved node/npm to the new install; node --version returned v24.22.2; npm --version returned 11.19.1; npm run dev -- --help invoked next dev --help successfully. This command verifies script resolution without starting another server. Tests/lint/build not run for environment-only setup. Existing CMD/terminal host may need full restart to inherit PATH. Next step: reopen terminal, cd to repository, npm run dev. Existing process-memory persistence limits remain.

### Development server handed to user terminal (2026-10-29)

User successfully invoked npm run dev, but Next detected the agent-started PRAX instance (PID 20028) on port 3000 and refused a duplicate project server. Verified PID was the Codex bundled node.exe and stopped that process, leaving the server stopped for the user's CMD launch. A Node net.createServer probe successfully bound and released 127.0.0.1:3000 (exit 0), confirming availability. No new persistent server was started. Earlier running-session notes are superseded. Stopping the process resets its temporary workspace/chat/upload state. No application code, dependency, API or security-policy change; no tests/build needed for this operational action. Next step: npm run dev from the user's CMD, then open localhost:3000.

### Git push readiness review (2026-10-29)

User asked whether they can push the current work. Read-only Git checks: branch main, HEAD e9f009c, origin https://github.com/vinlandsag/PRAx-website.git; many accumulated modified/untracked platform files, nothing staged. No branch, commit or push performed. Suggested committing current work on a new codex/ branch for review. Only required memory documents changed during this review.
Fresh passed commands: node node_modules/vitest/vitest.mjs run (235/235 tests, 14 files, 11.38 s); node node_modules/typescript/bin/tsc --noEmit (exit 0); node node_modules/eslint/bin/eslint.js . (exit 0). Git diff --check clean with core.safecrlf=false. git check-ignore confirmed .env, .env.local, node_modules, .next ignored; git ls-files found no tracked env/private-key/credential-named files in the checked patterns. Limited high-confidence secret marker scan over 162 tracked/nonignored candidate files found zero matches; no candidate file over 10 MiB. This is not a comprehensive secret or security audit. Production build not rerun; prior app-change build remains the last build evidence. No network fetch/push or remote write. Temporary process storage limits remain; saving source to Git does not persist runtime uploads/workspace data.

### Authorized donel branch delivery (2026-10-29)

The user explicitly requested committing and pushing all current PRAX work to https://github.com/vinlandsag/PRAx-website/tree/donel, superseding the earlier suggested codex/ branch. Fetched origin/donel at 405452c5417f797615d58a7f677699eb247931fa; it is an ancestor of the current e9f009c checkout (7 local commits ahead, 0 remote-only). Created local donel from the current checkout with origin/donel upstream, preserving all accumulated source/assets/tests/documentation. Main remains at its existing commit. Delivery is a normal fast-forward push; no reset, force push, deployment or new application behavior in this operation.
The commit includes the PDF-based design foundation, explicit Inter/assets, cursor/profile corrections, functional workspace controls, interaction-based public profiles, chat attachments and session documentation. Fresh preflight remains 235/235 tests (14 files), TypeScript and full ESLint passed; Git whitespace check clean. Limited secret-marker/large-file checks passed in the preceding readiness review, and env/dependencies/build folders are ignored. No new code change since those checks; build not repeated (previous production build passed). Runtime workspace/uploads remain process-memory data. Commit and remote receipt should be checked with git log/status and git ls-remote after delivery; this entry records scope and authorization before publishing.

Commit preflight note: first commit attempt failed because user.name/user.email are unset. Existing repository history uses PRAX Agent <prax-agent@local>; use that same neutral agent identity via per-command Git configuration for this delivery, without changing global identity or attributing the work to a guessed human account.

### Login screenshot diagnosis (2026-10-29)

User supplied a screenshot of magic-link mode showing a development token. Read-only inspection confirmed the request API generates a token but has no email delivery integration; the login page displays the token without completing verification, while a separate POST verification API exists. Password sign-in is implemented, with the documented local seeded member fixture. No live token from the screenshot was copied into code, logs or documentation. No application behavior changed or tests rerun. Clarify the requested screenshot change before altering authentication; local testing can use the password sign-in toggle. Main app delivery remains commit 409d475 on origin/donel, previously verified; this diagnosis only updates the required memory notes and is not committed/pushed.

# Phase 2 API logging and input handling note (2026-10-31)

`readJsonObject()` enforces JSON content type and a byte limit before parsing and returns only the standard validation error envelope. Routes remain responsible for field validation and authorization. `logApiFailure()` accepts fixed event values and a validated opaque request ID; it deliberately does not accept/serialize exception objects or request payloads. Do not log credentials, tokens, email, proof URLs, request bodies, or database records. No production data store or new secret was introduced in this phase.

### Phase 3 task API security boundary (2026-10-31)

Task routes use existing signed-session/RBAC guards and then re-read the persisted User, requiring APPROVED status and matching session role/name. Task creator IDs derive from that row; no user IDs or task lifecycle can be supplied in create/update payloads. Members only query published tasks and their own latest submission status; hidden task details return not found. Reads use no-store. SQL search is parameterized and wildcard escaped; query/body inputs are bounded. Failures log only a fixed event and optional opaque request ID. The initial migration enables RLS without anon policies on all six tables; server-side access must use the configured server connection. The user reported both migrations applied. Do not put Supabase credentials in docs/chat or enable browser access to these tables.

### Phase 4 submission ownership and state transitions (2026-10-31)

Submission routes re-read the persisted approved User row and derive `userId` from that account. Member list queries are always scoped to the session user; foreign item access returns 404. Write payloads reject identity, status, reviewer, feedback, score, task-ID-on-edit, and other unknown fields. Proof links must be absolute HTTP(S) URLs; text is bounded. PATCH/DELETE use conditional updates limited to `DRAFT`/`SUBMITTED`; DELETE preserves history as `WITHDRAWN`. Resubmission after rejected/revision-requested decisions creates a separate attempt. The user reported that the additive partial unique index migration was applied to Supabase. No upload metadata or storage key is accepted because there is no persistent submission storage. Admin review endpoints remain 503; when implemented, review claims must transition atomically to `UNDER_REVIEW` so member edits/withdrawals stop.

### Phase 5 points award and leaderboard boundary (2026-10-31)

The points service treats review payload identity/maximum as untrusted: it looks up the submission's author/task and verifies the reviewer is an approved ADMIN. It accepts only integer scores `0..Task.pointsMax`, and writes approval metadata plus the immutable ledger row in one transaction. Unique submission and idempotency indexes prevent duplicate awards; exact retries are acknowledged and conflicting values fail. API errors do not expose raw Prisma exceptions. Leaderboard access requires a signed session and persisted approved account; only public display name, score, rank and streak are returned. No email, proof, chat or Personal Space data enters points calculations. Integration tests were not run without a separate `TEST_DATABASE_URL`; do not use primary Supabase for test fixtures.

### Phase 6 leaderboard privacy and eligibility (2026-10-31)

Leaderboard queries use only User, Streak, Submission, and PointTransaction. Users must be APPROVED and have at least one point transaction attached to a currently APPROVED submission. Request identity comes from the validated session; the caller cannot provide a current-user ID. Public response fields are limited to id, display name, points, rank, and streak, plus pagination metadata. Private workspace, Personal Space, Chat, proof URLs, and email are excluded. Pagination is bounded; sort order includes deterministic name/ID tie breaks. Integration verification requires a separate test database.

### Phase 7 streak data boundary (2026-10-31)

`GET /api/streaks` requires the signed session and persisted approved User row; all queries use that server-derived user ID, ignoring client-supplied IDs. Active days are sourced only from approved submissions with server-generated `reviewedAt`, mapped to IST dates. `StreakDay` has RLS enabled and no browser policies. Security-definer database functions pin `search_path`, derive user/date from persisted submissions, serialize per-user refresh with a transaction advisory lock, and revoke execution from `PUBLIC`, `anon`, and `authenticated`; only server/database roles can invoke them. No request payload, points value, Chat data, or Personal Space data enters streak calculations. Migration and SQL function execution have not yet been tested against PostgreSQL; apply only after reviewing the intended Supabase target.

## Phase 8 isolation and security audit (2026-10-31)

### Fixes made

- `authorize()` and the Next.js proxy now whitelist account statuses and reject malformed claims; they previously checked unknown roles but could pass an unknown status.
- `requirePersistedAccount()` now selects only `id`, `name`, `role`, and `status`, instead of reading the full User row including `passwordHash`.
- Member submission detail reads now include both submission ID and owner ID in the SQL predicate. The approved-ADMIN override remains because the current API contract explicitly allows it.
- Resource ownership checks now fail closed when a caller passes an empty owner ID.
- Award retry identity deliberately ignores `maxPoints`, which is an immutable award-time snapshot rather than request identity; task maximums may be edited after an award.

### Isolation and exposure findings

- Task member queries are restricted to published tasks and the requesting member's latest submission. Member submission list/write predicates use the persisted session owner. Leaderboard and streak reads use the caller's persisted identity, not query-string user IDs.
- The scoring and streak implementations only query User, Task, Submission, PointTransaction, Streak, and StreakDay. There are no imports or queries for Workspace, Chat, attachments, Todo, Note, Goal, or private profile data. Workspace and Chat API handlers are guarded 503 placeholders in this checkout.
- The current Submission DTO includes the author's email for its owner or an approved ADMIN. This is authorized by the existing contract, but no frontend use was found. Review whether the field is still required before broadening admin review APIs.
- `dispatchApprovedPoints` accepts an internal `reviewedById` argument and validates that it names an approved ADMIN. The unimplemented Person 1 review route must pass the actor ID from its persisted authenticated session; it must never forward a request-body reviewer ID.
- Admin review and durable auth routes remain 503, so this audit cannot verify their future implementation or session revocation in production. The pages/proxy use signed claims; connected API handlers re-read persisted account status/role/name.
- No Slack, Teams, or other Person 4 messaging connector is available in the workspace. Code-level privacy exclusion was verified; Person 4's sign-off is still outstanding.
- RLS is enabled in the checked-in migrations for the platform tables and StreakDay, with no browser policies. Live database policy/function execution was not tested because no isolated PostgreSQL test database is configured.
## Phase 10 verification note (2026-11-01)

The user reports the database-backed integration suite passed after fixes: 31/31 tests across 5 files. The synthetic integration fixtures use approved persisted test users and signed test sessions; Chat and Personal Space are not part of scoring/streak fixtures. This environment could not independently reach the separate test database.

## Persisted auth and onboarding review (2026-11-01)

- Registration derives role/status on the server, hashes passwords with the existing scrypt implementation, normalizes email, and transactionally consumes a hashed invitation with account creation. Invite validation does not expose invite details. Raw invitation codes appear only once in the admin create response; list responses return `code: null`.
- Login uses constant-work dummy hash verification for unknown email and a generic wrong-credential response. Session is the existing HMAC signed HttpOnly cookie. `/api/users/me` and admin-sensitive routes revalidate persisted account status/role. Pending users cannot access approved-member APIs.
- First-admin bootstrap requires a temporary secret header and same-origin request; endpoint is hidden unless configured. PostgreSQL transaction advisory lock serializes calls, and persisted ADMIN count prevents any second bootstrap admin. Bootstrap returns no session. Operator must remove the token and restart after success.
- Registration/login/invite/bootstrap rate limits are in process memory. A multi-instance deployment needs a shared edge/provider rate limit before production exposure. The current schema has no durable admin audit model; invite creation/revocation and approval are not recorded as durable audit events.
- Auth route unit tests passed. The auth PostgreSQL integration suite could not run because the test DB preflight failed on unreachable host; no database writes occurred in this verification. No migration or deploy was performed. Verify the full flow using a separate isolated test database before release.

### Bootstrap transaction follow-up

The initial-admin route's advisory lock now returns an integer through a materialized CTE instead of exposing PostgreSQL `void` to Prisma raw-result decoding. Lock scope and transaction are unchanged. This is a suspected fix for the user's HTTP 500 after read-only DB connectivity succeeded; live retry is pending. The password the user entered into chat must be considered compromised and should not be reused.

After another HTTP 500, bootstrap now logs only its fixed processing stage and a validated Prisma error code. Raw database error text and request values remain suppressed. Use the diagnostic line from the local server terminal for troubleshooting; never share the token/password/URL.

The reported sanitized code was `P2028` during the transaction. The bootstrap transaction now waits up to 10 seconds for a connection and has a 15-second execution timeout; atomicity and transaction-scoped locking are unchanged. Retry remains unverified.

The user subsequently reported HTTP 201 for bootstrap. The one-time admin was created. Remove the bootstrap token from `.env.local` and restart the server so the endpoint is disabled; do not reuse the password previously shared in chat.

### Settings preferences boundary (2026-11-01)

`GET/PATCH /api/users/me/settings` takes identity only from the signed session and revalidates the matching persisted approved account. Reads select only the one-to-one preference row and return account email/role from authenticated account context; writes enforce same-origin, bounded JSON, strict allowlisting, enum/boolean validation, and upsert using the server-derived user ID. User IDs, roles, account state, email, and password are not editable through this endpoint. The new preferences table has RLS enabled with no browser-facing policy; the app accesses it through the existing server-side Prisma connection. Preferences grant no authorization and are not read by points/streak or private Chat/Personal Space services. Theme is a display preference; notification toggles do not imply delivery. Portfolio visibility is saved but not yet enforced by a public profile API, which remains a documented 503 seam.
# Phase 5 Dashboard boundary (2026-11-01)

`GET /api/dashboard` authenticates the existing signed session, then revalidates the corresponding persisted approved account. All per-user database filters use that persisted account ID, never a request parameter. Only approved submissions contribute to visible task count/activity, and only ledger entries linked to approved submissions contribute points. The response contains no email, proof, chat, Personal Space, or other user's private data. Dashboard is `no-store`. Other tabs that currently return the deliberate 503 remain unavailable; do not enable them with client-only authorization or process-local substitute data.
# Phase 6 Dashboard data access review (2026-11-01)

The Dashboard integration uses the existing signed cookie guard, then rechecks the persisted account before reads. Prisma receives only that server-derived account ID in per-member predicates. Failures return the shared generic 500 envelope; logs contain a fixed stage and validated request ID, never secrets, raw SQL errors, or user data. No direct Supabase service-role access or RLS identity assumption was introduced. The response remains private/no-store.
# Sign-in rate limit troubleshooting (2026-11-01)

Password login is limited to five attempts per client IP per 15 minutes. The current limiter is in-process memory, so restarting the local app clears the counter; waiting for the full window also restores attempts. This is a local troubleshooting fact, not a production distributed-rate-limit guarantee. Do not log credentials, email addresses, request bodies, or environment values when diagnosing login. The first-admin bootstrap endpoint cannot be reused after an ADMIN already exists; do not manually alter account rows as a workaround.
# 2026-11-01 — Sign-out availability

Global header sign-out reuses the existing same-origin POST logout route, which expires the HttpOnly session cookie. It does not accept an identity or alter account status. This makes cookie clearing available even when an inactive account cannot read Settings.
# 2026-11-01 — Safe registration failure diagnostics

Unexpected registration errors now log only a fixed stage and validated Prisma error code, matching the bootstrap route's safe diagnostics. Password, invite code, email, request body, and raw exception text are not logged.

The registration interactive transaction has a bounded 10-second acquisition wait and 15-second execution timeout. It remains atomic across invite-use and account creation.
# 2026-11-01 — Pending registration sessions

Registration issues a signed HttpOnly session only after transactionally creating the account as MEMBER/PENDING_APPROVAL. The proxy allows this status only at `/onboarding` and `GET /api/users/me`; it redirects all workspace pages and denies protected APIs until approval. The polling current-user API reloads role/status from the database and refreshes the signed cookie before navigation. No client-supplied role/status is used.

## Stage 3 chat and Personal Space client boundary (2026-11-01, Person 4)

Client-side only; no server enforcement exists yet for the new routes. Changes with a privacy effect: chat polling no longer downloads the member's private to-dos, notes and goals every 15 seconds (it uses its own feed), and global search requests `/api/space` only while the search dialog is open. The first-visit rules acceptance is stored through the server, not localStorage; the server must reject posting until accepted (Stage 5). Avatar URLs in chat keep the existing behavior (user-supplied HTTP(S) URLs are loaded by each viewer's browser), as decided. The isolation rule for Personal Space (owner id only from the session, in every query, 404 for foreign ids, no admin read path) is recorded as D-039 and is not implemented until Stage 5. Person 4 privacy sign-off for Chat/Personal Space remains to be given by the owner.

## Stage 4 schema privacy boundary (2026-11-01, Person 4)

New tables `Todo`, `Note`, `Goal`, `ChatMessage` and `MessageReaction` have RLS enabled with no policies, so they are denied to Supabase's browser-facing roles; the app is meant to reach them only through server routes. Personal Space isolation between members and from admins is an application rule (D-039): every query must filter by the signed-in owner, and admins have no read path. The database does not enforce it, and whether the Prisma connection role bypasses RLS is unverified. Deleting a user cascades to all their Personal Space rows, messages and reactions (`ON DELETE CASCADE`); a deleted Task only clears `Todo.taskId`. Chat deletion is soft, so deleted message text stays in the database. Nothing was applied to a database and no route exists yet.
