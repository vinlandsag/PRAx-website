# API_CONTRACTS.md

## Supabase Database Integration Contract — D-024 (2026-10-31)

Supabase PostgreSQL 16 database established as the core persistence engine.

- **Client Packages:** `@supabase/supabase-js` v2.
- **Client Endpoints:**
  - `src/lib/supabase/client.ts`: `getSupabaseBrowserClient()` and `supabase` singleton (browser with `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
  - `src/lib/supabase/server.ts`: `getSupabaseAdminClient()` (bypasses RLS with `SUPABASE_SERVICE_ROLE_KEY` for API routes) and `getSupabaseServerClient()`.
  - `src/lib/supabase/db.ts`: Typed data access layer (`db.getUserById`, `db.getActiveTasks`, `db.getTaskById`, `db.getUserSubmissions`, `db.getReviewQueue`, `db.getLeaderboard`, `db.getChannels`, `db.getChannelMessages`, `db.createAuditLog`).
- **Database Schema Models:**
  - `users` (id, email, password_hash, name, role, status, avatar_url, headline, bio, skills, currently_building, created_at, updated_at)
  - `invite_codes` (id, code, status, max_uses, used_count, created_by_id, expires_at, revoked_at)
  - `magic_link_tokens` (id, email, token_hash, expires_at, used_at)
  - `rubrics` & `rubric_versions` (id, version, title, criteria, max_points, updated_by_id)
  - `tasks` (id, title, description, category, difficulty, max_points, rules, is_active, created_by_id)
  - `submissions` (id, task_id, user_id, status, proof_url, note, checklist, points_awarded, feedback)
  - `point_transactions` (id, user_id, amount, reason, idempotency_key, submission_id, admin_id)
  - `streaks` (id, user_id, current_streak, longest_streak, last_activity_date)
  - `channels` & `messages` (id, channel_id, user_id, content, attachments, is_deleted)
  - `personal_space_pages` (id, user_id, title, content, blocks)
  - `audit_logs` (id, event, actor_id, target_id, prior_state, new_state, reason, metadata)
  - `notifications` (id, user_id, title, message, type, read, link)
  - `user_leaderboard` (computed view aggregating non-negative points and streak ranks)
- **1-Click SQL Script:** `supabase/schema.sql` (schema + seed + verification counts) ready for the Supabase SQL editor.

## Authorized GitHub delivery of current work (2026-10-31)

User explicitly requested pushing the current changes to GitHub; continue using the previously selected donel branch at origin https://github.com/vinlandsag/PRAx-website.git. Fetched origin/donel and verified it matches local base 409d475 (0 ahead, 0 behind) before this delivery commit. Scope includes the backend cleanup, notification UI, retained development-only member account, Node 24/upload configuration and current handoff docs. Local-only hosting clarification remains in effect; this Git push does not deploy a website.

Fresh pre-push checks passed: 226 tests/13 files in 8.91 s; tsc --noEmit and full ESLint exit 0; Git whitespace check clean. Limited scan of 157 text candidates found no high-confidence secret markers or configured private session key. .env.local, .next, node_modules and .vercel remain ignored; only blank .env.example is included. Last production build is the passed 47/47 hosting preflight; it was not repeated for this Git-only action.

No global Git author identity is configured; use existing repository convention PRAX Agent <prax-agent@local> for this commit command only. Publish normally to donel, without force pushing or changing main; verify HEAD against the remote receipt afterward. This note records scope/checks before commit/push so the final delivery hash is available from Git history. Keep the local test account and existing local server; do not restart cloud hosting.

## Latest clarification — run locally (2026-10-31)

User clarified “host it” means local hosting. This supersedes the pending Vercel deployment/sign-in next step. Do not continue cloud deployment or request Vercel authorization for this task. Prior device-login exec session 44678 is no longer available; no site was deployed. Existing hosting-preparation files remain harmless local changes; no application code changed in this run.

Started npm run dev -- --hostname 127.0.0.1 --port 3000 using installed Node/npm (exec session 41439), ready in 728 ms. Confirmed health HTTP 200/environment development and login page HTTP 200; queued the local login browser panel. Server remains running on loopback only. The original local member test account is preserved; backend-dependent data remains disconnected. No secret, commit, push or remote deployment. Tests/lint/build not repeated for this server-only action. Next step: open http://127.0.0.1:3000/login and use the retained test credentials.

## Hosting preparation status (2026-10-31, D-023)

No HTTP contract changed for hosting. Native Next.js source remains intact; upload filtering and Node engine metadata are the only build/deployment changes. Production fixture login remains disabled and backend services remain unconfigured. A successful website deployment will not imply that auth/database/mail/notifications are integrated. No production runtime secret was set or copied from local .env.local. Vercel sign-in is pending, so no base URL or deployed endpoint result can yet be reported.

## Local test-account exception — D-022 (2026-10-31)

This explicitly supersedes D-021's “no test sign-in” statement only for local development. POST /api/auth/login accepts the original member test credentials on loopback request hosts when NODE_ENV is development; returns 200 {user:{id,email,name,role,status}} and a signed HttpOnly prax_session cookie. Normalizes the email, verifies password using scrypt, enforces same Origin when supplied and existing login rate limits. Invalid fields ->400; wrong fixture password ->401; foreign Origin ->403; rate limit ->429. Unconfigured private secret, nonlocal hosts, other identities, test/production mode ->503 with no issued session.

Fixture identity: usr_member_01, MEMBER/APPROVED. GET /api/users/me returns {user} with no-store only for its matching authenticated local development session. Missing/invalid sessions ->401. Other properly authenticated accounts remain 503 pending backend implementation. No mutable account API added.

SessionPayload gains optional developmentOnly:true. signSession accepts optional third options argument {developmentOnly?:boolean}; requests to issue such a token outside development throw, and verifySession rejects this signed marker outside development. Existing normal-session calls remain compatible. Therefore a development fixture cookie cannot authenticate a production run with the same private key. All other service contracts and unavailable behavior remain unchanged; successful local login does not restore workspace/chat/notification data persistence.

## Current integration status — D-021 (2026-10-29)

**Runtime prototype implementations are removed.** Existing contracts below are historical requirements/reference until real backend implementation. There are no working demo accounts, magic token issuance, process-local collections/upload bytes, scoring ledger, audit persistence or sample member lookup. Public auth/invite-verification handlers return 503. Protected handlers first enforce the retained signed-session/role/status guard (401/403), then return 503. Real implementations must validate current account records, ownership and inputs server-side; the placeholder does not provide database-backed revocation or durable auth.

Disconnected response: HTTP 503, Cache-Control: no-store, {error:{code:"BACKEND_NOT_CONFIGURED",message:"This service is not connected yet. Please try again later.",status:503}}. Never return empty success data or issue a session cookie to simulate integration. GET /api/health remains 200 with backend:"not_configured"; POST /api/auth/logout only expires the cookie. Session helpers require SESSION_SECRET or NEXTAUTH_SECRET >=32 characters, no built-in key. Existing paths/methods remain available as guarded integration seams.

New frontend read/write shapes below are declared integration contracts, **not implemented backend features**. They are centralized in src/lib/api/contracts.ts; workspace/chat/attachment/settings shapes remain in src/lib/workspace/types.ts and attachment-policy.ts. Submission and rubric types moved to lib/db/submissions.ts and lib/rubric/types.ts; points payload types live in lib/points/types.ts with no ledger.

| Route                          | Methods / intended successful shape                                             |
| ------------------------------ | ------------------------------------------------------------------------------- |
| /api/tasks                     | GET {tasks:TaskItem[]}; admin POST task fields -> {task:{id,...}}               |
| /api/tasks/[id]                | GET {task:TaskItem}; admin PATCH task fields                                    |
| /api/submissions               | GET {submissions:Submission[]}; POST {taskId,proofUrl,note}                     |
| /api/dashboard                 | GET {totalPoints,weeklyRank:number                                              | null,dayStreak,tasksApproved,activity:[{id,title,createdAt}]}                         |
| /api/streaks                   | GET {current,longest,activeDays:string[]}                                       |
| /api/leaderboard?period=weekly | alltime                                                                         | GET {entries:[{id,name,points,rank,streak}],total}; ranking/order computed by backend |
| /api/admin/reports             | admin GET {reports:[{id,author,content,reason}]}; PATCH {id,operation:"dismiss" | "remove-message"}                                                                     |
| /api/notifications             | GET {notifications:[{id,title,message,createdAt,readAt:string                   | null,href?:string}]}; PATCH {operation:"mark-all-read"}, successful 204 or JSON       |

TaskItem also accepts dueAt/createdAt ISO timestamps for real filtering/sorting and optional checklist:string[]. No ID-specific deadlines or locally invented ranking data. Profile response no longer includes isDemo or sample aliases: GET /api/workspace?memberId=<id> expects {profile}, with private fields and portfolio privacy enforced by real backend. Profile metrics/activity remain unknown rather than fabricated.

NotificationBell derives badge count from returned unread items, shows an error rather than an empty-success feed on service failure, and refreshes only after accepted mark-all-read. Links accept internal destinations only; preferences point to /settings?tab=notifications. No email/push delivery, read persistence or notification fixture service exists. ChatComposer retains multipart/send contracts and local preview controls, but uploads/sending require backend endpoints. The backend team must implement former documented authorization, validation, range/download, size/quota and lifecycle rules before claiming those services work.

## Interaction profiles and chat media (2026-10-29, D-020)

No standalone member-directory endpoint is added. GET /api/workspace?memberId=<id> resolves an existing APPROVED real account whether or not it initialized its workspace, returning {profile,isDemo:false}. Unknown/inactive targets are 404. Known display fixtures return {profile,isDemo:true}; these do not create auth accounts. Profile remains a public-field projection with portfolio privacy and no email/private collections/settings. Authenticated approved viewer required. Existing {profile} consumers remain compatible with the additive flag. ProfileView adds optional isDemo and returnTo (chat|leaderboard) props. Links use /members/<encoded id>?from=chat|leaderboard; the page ignores other return destinations.

ChatMessage adds optional attachments: ChatAttachment[]; each is {id,name,size,mimeType,kind:image|video|file,url}. Message create data accepts content (<=500, may be empty with files) and attachmentIds (up to 3 distinct author-owned, unclaimed upload ids; 30 MB total). No raw file/base64 content or client-chosen attachment URLs are accepted. Text-only messages remain compatible. Caption edits may be empty only if attachments exist. Message removal or eviction deletes its bytes.

- POST /api/chat/attachments: signed current APPROVED account and same-origin check, multipart/form-data with exactly one file field. Bounded body <=25 MB +64 KB before parsing; original header boundary case retained. Returns 201 {attachment}. Filename sanitized/truncated to 160, server-detected MIME, signatures/UTF-8 and size/extension validated. Images <=5 MB: PNG/JPG/JPEG/GIF/WEBP. Videos <=25 MB: MP4/MOV/WEBM/OGV. Other files <=10 MB: PDF/TXT/CSV/MD/JSON/ZIP/DOCX/XLSX/PPTX/MP3/WAV. Request over stream cap: 413; validation: 400; quota: 429. No real file bytes in JSON.
- GET /api/chat/attachments/[id]: current approved account required. Pending bytes visible only to uploader (others 404); claimed bytes shared with approved channel members. 200 or valid single byte range 206 with Content-Range/Length and Accept-Ranges; invalid ranges 416. Controlled Content-Type, RFC5987 filename, nosniff, default-src none CSP and private,no-store. Images/videos inline unless ?download=1; other files always attachment disposition. Missing/deleted/expired bytes: 404.
- DELETE /api/chat/attachments/[id]: same-origin author only, pending files only; 204 success, 404 foreign/missing, 409 already attached (remove the message instead).

Pending files expire lazily at 30 minutes; storage caps 60 MB/account and 128 MB/process. Storage and messages remain process-local/volatile, not durable or multi-instance. Next proxy buffer is 26mb; API limits remain authoritative. Existing message author/admin permissions and audits are retained. No new environment variable, auth token or storage dependency.

## Cursor asset supplement (2026-10-29, D-019)

No application endpoint, authentication payload or component prop changed. Existing --cursor-default / --cursor-pointer CSS variables now reference /artwork/cursor-arrow.png at 8,8 and /artwork/cursor-hand.png at 13,6, respectively, retaining auto/pointer fallbacks. Assets are transparent 32x32 PNGs, with matching SVG authoring sources retained. The static halo is encoded in the image pixels. DESIGN_SYSTEM.md documents the source/export relationship.

## Workspace interaction API supplement (2026-10-29, D-018)

GET /api/workspace and PATCH /api/workspace require a signed session and an existing APPROVED account. Current database-store role/status are rechecked; no client-supplied owner/role is trusted. Responses are Cache-Control: no-store. Missing session/account is 401; inactive accounts and denied actions are 403; unknown items/profiles 404; invalid input 400; unexpected failure 500, using the existing error envelope.

GET returns WorkspaceData: user (safe own SessionUser), profile, settings, todos, notes, goals, messages. GET ?memberId=<id> returns only {profile}, without user email, private collections or settings; portfolioUrl is empty when that account disables showPortfolio. Only initialized workspace profiles currently exist in this process; an unknown id is 404. /members/[id] consumes this read contract.

PATCH body: {resource,operation,id?,data?}. Typed definitions: src/lib/workspace/types.ts. Successful response is the updated own WorkspaceData. Body capped at 32,000 characters; malformed JSON rejected. Origin, when present, must match protocol plus browser-facing Host (request URL fallback); forwarded-host is not trusted. This supports 127.0.0.1 despite Next internally normalizing the request URL to localhost.

- todos: create/update/delete; title <=200 required, description <=5000, difficulty Easy/Medium/Hard, priority Low/Medium/High, dueDate empty or real YYYY-MM-DD, completed boolean. Defaults Medium/Medium/empty/false. Updates may be partial.
- notes: create/update/delete; title <=200 required, content <=5000; server-generated updatedAt.
- goals: create/update/delete; title <=200 required, description <=5000, integer progress 0..100.
- Private collections have max 100 items each and server-generated ids. All item access is scoped to the current account, including admins. Unsupported item fields are rejected.
- profile: update only; name required <=100, handle @ plus 2..49 ASCII letters/digits/underscores, bio <=500, currentProject <=200, skills <=15 nonempty strings of <=40, optional portfolioUrl/githubUrl/linkedinUrl/avatarUrl <=2048, HTTP(S) only. Unsupported fields rejected atomically.
- settings: update only; theme light/dark, reviewNotifications/streakReminder/chatNotifications/showPortfolio booleans. Unsupported fields rejected atomically. Notification delivery is not configured.
- messages: create (content nonblank <=500), update (author only), delete (author or ADMIN), pin (ADMIN only; toggles pin/unpin). Shared latest 500 messages, server ids/timestamps/author. No private-message feature or points effects. Moderation emits CHAT_MESSAGE_PINNED/UNPINNED/DELETED through existing audit storage, containing actor/target/state/author id without content.

Storage remains process-local; no durability or multi-instance consistency is promised. The task catalog and leaderboard period fixtures remain client-side sample data. No existing endpoint/auth payload is removed. ProfileView gains optional skills/URLs/avatar and onEditProfile/onEditSkills/onEditProject callbacks; absent portfolio URLs render setup/empty states. All new icons use the existing outline family.

Shared data shapes, endpoint contracts, auth requirements, error formats, ownership, and compatibility notes.

> **Rule:** Agreed upon by Persons 2–5. Do not change without consensus.  
> All items marked **PROPOSED** are pending owner agreement. Mark as **AGREED** once signed off.  
> Breaking changes must be logged in `CHANGELOG_DEV.md`.

---

## Auth Requirements

- All authenticated routes require a valid server-side session (NextAuth.js v5, cookie-based — pending D-004).
- The session exposes: `session.user = { id: string, email: string, role: "MEMBER" | "ADMIN", status: UserStatus, orgId: string | null }`.
- Admin-only routes additionally call `requireRole("ADMIN")` middleware server-side. Client-side guards are UX only.

## Standard Error Format

```json
{ "error": { "code": "ERROR_CODE", "message": "Human-readable string", "status": 4xx } }
```

See `MVP_SPEC.md §8` for the full error code table.

---

## Shared Types (TypeScript — PROPOSED)

```typescript
type UserStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED" | "DISABLED";
type UserRole = "MEMBER" | "ADMIN";

type SubmissionStatus =
  "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";

type InviteCodeStatus = "ACTIVE" | "USED" | "EXPIRED" | "REVOKED";

interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  name: string | null;
}
```

---

## Integration Contracts

### IC-01 — Session user shape

| Field     | Value                                                           |
| --------- | --------------------------------------------------------------- |
| Producer  | **P1** (auth/session)                                           |
| Consumers | **P2**, **P4**, **P5**                                          |
| Interface | `session.user: SessionUser` (see Shared Types above)            |
| Status    | 🟢 AGREED (Phase 3) — Implemented via `src/lib/auth/session.ts` |

---

### IC-02 — Prisma model exports

| Field     | Value                                                                              |
| --------- | ---------------------------------------------------------------------------------- |
| Producer  | **P3** (DB schema)                                                                 |
| Consumers | **P1**, **P2**, **P4**                                                             |
| Interface | Prisma-generated types: `User`, `Task`, `Submission`, `PointTransaction`, `Streak` |
| Status    | 🟡 PROPOSED — P3 must publish schema before Phase 2                                |

---

### IC-03 — Task & Submission REST API

| Field    | Value             |
| -------- | ----------------- |
| Producer | **P3** (API + DB) |
| Consumer | **P2** (UI)       |
| Status   | 🟡 PROPOSED       |

#### `GET /api/tasks`

- Auth: APPROVED member or ADMIN
- Response: `{ tasks: Task[] }`

#### `GET /api/tasks/:id`

- Auth: APPROVED member or ADMIN
- Response: `{ task: Task }`

#### `POST /api/submissions`

- Auth: APPROVED member
- Body: `{ taskId: string, content: string }`
- Response: `{ submission: Submission }` (status = DRAFT)
- Errors: `ACCOUNT_PENDING`, `VALIDATION_ERROR`

#### `PATCH /api/submissions/:id/submit`

- Auth: Submission owner (APPROVED member)
- Body: none
- Response: `{ submission: Submission }` (status = SUBMITTED)
- Errors: `NOT_FOUND`, `FORBIDDEN`, `SUBMISSION_IN_PROGRESS`, `INVALID_STATE_TRANSITION`

#### `GET /api/submissions/:id`

- Auth: Owner OR ADMIN
- Response: `{ submission: Submission }`

---

### IC-04 — RBAC Proxy Middleware & Server-Side Authorization Guards

| Field     | Value                                                                                                                                                                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Producer  | **P1** (auth/RBAC)                                                                                                                                                                                                                                  |
| Consumers | **P5** (admin UI & API routes), **P3** (admin API routes), **P2** (member routes)                                                                                                                                                                   |
| Interface | `src/proxy.ts` (Next.js Proxy Middleware), `src/lib/auth/rbac.ts` (`hasPermission`, `canAccessResource`), `src/lib/auth/guard.ts` (`authorize`, `requireRole`, `requirePermission`)                                                                 |
| Status    | 🟢 AGREED (Phase 5) — Authoritative proxy middleware + server guards enforcing deny-by-default, role boundaries, resource ownership, and standard error envelopes (401 UNAUTHENTICATED, 403 FORBIDDEN, 403 ACCOUNT_PENDING, 403 ACCOUNT_NOT_ACTIVE) |

---

### IC-05 — Chat Message model & channel schema

| Field     | Value                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------- |
| Producer  | **P4** (Chat)                                                                                       |
| Consumer  | **P3** (DB — shared Prisma schema)                                                                  |
| Interface | `Message { id, channelId, authorId, content, createdAt, deletedAt? }`, `Channel { id, name, type }` |
| Status    | 🟡 PROPOSED — P4 must confirm schema before Phase 6                                                 |

---

### IC-06 — Rubric data shape

| Field    | Value                                                                                         |
| -------- | --------------------------------------------------------------------------------------------- |
| Producer | **P1** (Rubric API & System Architect)                                                        |
| Consumer | **P2** (task UI), **P5** (admin review scoring)                                               |
| Status   | 🟢 AGREED (Phase 7) — Implemented via `src/lib/rubric/rubric-store.ts` & `src/app/api/rubric` |

#### `GET /api/rubric`

- Auth: APPROVED member or ADMIN
- Response: `{ rubric: { id, version, criteria: RubricCriterion[], totalMaxPoints, updatedAt } }`

```typescript
interface RubricCriterion {
  id: string;
  num: string;
  title: string;
  description: string;
  maxPoints: number;
}
```

#### `PUT /api/rubric`

- Auth: ADMIN only (`authorize(req, { allowedRoles: ["ADMIN"] })`)
- Body: `{ criteria: RubricCriterion[] }`
- Validation: Criteria array non-empty, title ≥ 2 chars, description ≥ 5 chars, `1 <= maxPoints <= 1000` integer, unique IDs
- Response: `{ rubric: Rubric }`
- Side-effects: Increments version (`v1` → `v2`); creates immutable history; emits `RUBRIC_UPDATED` audit event

---

### IC-06B — Person 1 ↔ Person 3 Points Transaction Boundary

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundary  | **P1** (Review/Scoring Engine) ↔ **P3** (Points Calculation & Score Persistence)                                                                                                                                                                                                                                                                                                                                                                      |
| Producer  | **P1** (`src/app/api/admin/submissions/[id]/approve/route.ts`)                                                                                                                                                                                                                                                                                                                                                                                        |
| Consumer  | **P3** (`src/lib/points/points-boundary.ts`)                                                                                                                                                                                                                                                                                                                                                                                                          |
| Status    | 🟢 AGREED (Phase 7)                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Agreement | P1 strictly validates scores (`0 <= pointsAwarded <= maxPoints`), binds the active rubric version, and dispatches via `dispatchApprovedPoints(payload)` using an idempotency key (`pts_${submissionId}_${rubricVersion}`). P1 DOES NOT create a second ledger or mutate leaderboard totals. P3 processes and stores the immutable `PointTransaction`. Duplicate calls return idempotent status (preventing double awards); failure triggers rollback. |

---

### IC-07 — Streaks & Points API (UI consumption)

| Field    | Value                            |
| -------- | -------------------------------- |
| Producer | **P3** (API + DB)                |
| Consumer | **P2** (member UI badges/scores) |
| Status   | 🟡 PROPOSED                      |

#### `GET /api/users/:id/streak`

- Auth: APPROVED member or ADMIN
- Response: `{ streak: { userId, currentStreak: number, longestStreak: number, lastApprovedAt: string | null } }`

#### `GET /api/users/:id/points`

- Auth: APPROVED member or ADMIN
- Response: `{ points: { userId, total: number, transactions: PointTransaction[] } }`

#### `POST /api/admin/users/:id/points`

- Auth: ADMIN only
- Body: `{ amount: number, reason: string }`
- Validation: `amount` must be positive integer
- Response: `{ transaction: PointTransaction }`
- Side-effects: Emits `POINTS_ASSIGNED` audit event
- Errors: `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`

---

### IC-08 — CI & Branch protection rules

| Field     | Value                        |
| --------- | ---------------------------- |
| Producer  | **P5** (CI / GitHub Actions) |
| Consumers | All                          |
| Status    | 🟡 PROPOSED                  |

Rules (to be enforced via branch protection on `main`):

- PRs require at least 1 approving review
- All status checks must pass: `lint`, `typecheck`, `test:unit`
- No direct pushes to `main`
- Commit message format: `type(scope): description` (conventional commits)
- `npm run lint` — ESLint + Prettier
- `npm run typecheck` — `tsc --noEmit`
- `npm run test:unit` — Vitest
- `npm run test:e2e` — Playwright (runs on merge to main only)

---

## Auth / Session Endpoints

Owner: **P1**

### `POST /api/auth/register`

- Auth: None (public)
- Body: `{ email: string, password: string, name: string, inviteCode: string }`
- Response: `{ user: { id, email, status: "PENDING_APPROVAL" } }`
- Errors: `INVALID_INVITE`, `INVITE_EXHAUSTED`, `VALIDATION_ERROR`
- Side-effects: Creates `User` (status=PENDING_APPROVAL), marks invite used, emits `USER_REGISTERED` + `INVITE_USED` audit events

### `GET /api/users/me`

- Auth: Any authenticated user
- Response: `{ user: SessionUser & { createdAt: string } }`

### `GET /api/admin/users`

- Auth: ADMIN only
- Query: `?status=PENDING_APPROVAL` (optional filter)
- Response: `{ users: User[] }`

### `POST /api/admin/users/:id/approve`

- Auth: ADMIN only
- Body: none
- Response: `{ user: User }` (status = APPROVED)
- Errors: `INVALID_STATE_TRANSITION`, `NOT_FOUND`
- Side-effects: Emits `USER_APPROVED` audit event

### `POST /api/admin/users/:id/reject`

- Auth: ADMIN only
- Body: `{ reason: string }`
- Response: `{ user: User }` (status = REJECTED)
- Side-effects: Emits `USER_REJECTED` audit event

### `POST /api/admin/users/:id/suspend`

- Auth: ADMIN only
- Body: `{ reason: string }`
- Response: `{ user: User }` (status = SUSPENDED)
- Side-effects: Emits `USER_SUSPENDED` audit event

### `POST /api/admin/users/:id/unsuspend`

- Auth: ADMIN only
- Body: none
- Response: `{ user: User }` (status = APPROVED)
- Side-effects: Emits `USER_UNSUSPENDED` audit event

### `POST /api/admin/users/:id/disable`

- Auth: ADMIN only
- Body: `{ reason: string }`
- Response: `{ user: User }` (status = DISABLED)
- Side-effects: Emits `USER_DISABLED` audit event

---

## Invite Endpoints

Owner: **P1**

### `POST /api/invites/verify`

- Auth: None (public; called during registration flow)
- Body: `{ code: string }`
- Response: `{ valid: true, remainingUses: number }` OR error
- Errors: `INVALID_INVITE`, `INVITE_EXHAUSTED`

### `POST /api/invites`

- Auth: ADMIN only
- Body: `{ maxUses?: number, expiresAt?: string }`
- Response: `{ invite: InviteCode }`
- Side-effects: Emits `INVITE_CREATED` audit event

### `GET /api/invites`

- Auth: ADMIN only
- Response: `{ invites: InviteCode[] }`

### `DELETE /api/invites/:id`

- Auth: ADMIN only
- Response: `{ invite: InviteCode }` (status = REVOKED)
- Errors: `NOT_FOUND`, `INVALID_STATE_TRANSITION` (already terminal)
- Side-effects: Emits `INVITE_REVOKED` audit event

---

## Admin Review Queue Endpoints

API Owner: **P3** | UI Owner: **P5** | Status: 🟢 AGREED (Phase 6) — Implemented

### `GET /api/admin/submissions`

- Auth: ADMIN only (`authorize(req, { allowedRoles: ["ADMIN"] })`)
- Query: `?status=SUBMITTED` (optional filter)
- Response: `{ submissions: Submission[] }`

### `POST /api/admin/submissions/:id/approve`

- Auth: ADMIN only
- Body: `{ pointsAwarded?: number }`
- Validation: `0 <= pointsAwarded <= submission.maxPoints`
- Response: `{ submission: Submission }` (status = APPROVED)
- Side-effects: Emits `SUBMISSION_APPROVED`; if `pointsAwarded > 0`, emits `POINTS_ASSIGNED`; triggers streak recomputation

### `POST /api/admin/submissions/:id/reject`

- Auth: ADMIN only
- Body: `{ feedback: string }` (minimum 3 characters)
- Response: `{ submission: Submission }` (status = REJECTED)
- Side-effects: Emits `SUBMISSION_REJECTED`

### `POST /api/admin/submissions/:id/request-revision`

- Auth: ADMIN only
- Body: `{ feedback: string }` (minimum 3 characters)
- Response: `{ submission: Submission }` (status = REVISION_REQUESTED)
- Side-effects: Emits `SUBMISSION_REVISION_REQUESTED`

---

## Audit Log Endpoint

Owner: **P5**

### `GET /api/admin/audit-log`

- Auth: ADMIN only
- Query: `?userId=&event=&from=&to=&page=&limit=`
- Response: `{ events: AuditLog[], total: number, page: number }`

---

## Moderation Endpoint

Owner: **P5**

### `DELETE /api/admin/messages/:id`

- Auth: ADMIN only
- Body: `{ reason: string }`
- Response: `{ message: Message }` (deletedAt set)
- Side-effects: Emits `CHAT_MESSAGE_DELETED` audit event

---

## Ownership Summary

| Area                                 | API Owner | UI Owner |
| ------------------------------------ | --------- | -------- |
| Auth, invite, user lifecycle, rubric | P1        | P1       |
| Tasks, submissions, points, streaks  | P3        | P2       |
| Admin review queue                   | P3        | P5       |
| Chat, personal space                 | P4        | P4       |
| Audit log, moderation, CI            | P5        | P5       |

---

## Versioning Strategy

- MVP: no versioning prefix (all routes under `/api/`).
- If a breaking change is needed post-MVP: introduce `/api/v2/` prefix. Document in this file + `CHANGELOG_DEV.md`.

---

_Last updated: 2026-10-28 · Phase 7 Rubric Engine & Points Boundary complete_

## UI foundation supplement (2026-10-28)

No backend endpoint, authentication payload or database interface changed.

`src/components/ui/index.ts` preserves prior exports and adds form choices, textarea/select, status/category, outline icons, sidebar item/breadcrumb/segmented choices, table primitives, task card, screenshot upload, feedback, Dialog alias, and progress. Typed props are declared with their components.

- Dialog aliases Modal, preserving its existing props; it now restores focus and traps keyboard navigation.
- Button retains prior variants and adds text/destructive/iconOnly. Default type is button; native form submissions must specify type="submit".
- Tabs gain optional item content/disabled, panel linkage and accessible naming. SegmentedControl uses controlled value/onChange and native radios. Avatar adds profile size and image fallback.
- FileUpload.onFileChange(file: File | null) reports local selection/removal; maxBytes defaults to 5 MB, PNG/JPEG only. No persistence contract is implied.
- Progress takes label/value and optional max/showValue, clamping invalid values.
- colors/radii/shadows exports now resolve CSS variables instead of literal values. CSS styles are supported; canvas/export consumers should resolve computed values. Layout and breakpoints remain numeric.
- /design-system is development-only; public font/artwork prefixes pass the proxy. Existing protected-route authorization remains.

Cursor token supplement (2026-10-28): additive CSS tokens --cursor-default and --cursor-pointer reference local 32 px SVG assets, including hotspot coordinates and native fallback keywords. No component props or backend interfaces changed.

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
