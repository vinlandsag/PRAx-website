# API_CONTRACTS.md

## Phase 11 release handoff status (2026-11-01)

Review, points, task, submission, leaderboard, streak, persisted auth, own-profile, and own-settings endpoints are database-backed as described below. Configurable rubric, broad Workspace/Chat/Personal Space, and notification delivery remain unimplemented seams. `npm run test:integration` was user-reported passing with 31/31 tests in a separate test project; a subsequent agent attempt could not reach that host and did not execute Vitest. Release setup, safe smoke-check limits, and deployment gates are documented in README.

## Authenticated own profile (2026-11-01)

- `GET /api/users/me/profile` returns `{profile,stats}`. Profile fields are `name`, `handle`, `bio`, `skills`, `currentProject`, `portfolioUrl`, `githubUrl`, `linkedinUrl`, and `avatarUrl`; `stats` contains server-derived `totalPoints`, `weeklyRank` (null until ranked), `dayStreak`, and `tasksApproved`. It requires a signed session and revalidates the matching persisted APPROVED User. It ignores client-selected identities and returns only the caller's profile fields.
- `PATCH /api/users/me/profile` accepts a bounded JSON object containing one or more profile fields. Identity, account role/status, metrics, and all unknown fields are rejected. Name is 1–100 characters; handle matches `^@[A-Za-z0-9_]{2,49}$`; bio is at most 500 characters; skills contain at most 15 nonempty entries of at most 40 characters; current project is at most 200 characters; profile URLs are empty or credential-free HTTP(S) URLs up to 2048 characters.
- A successful PATCH returns the updated `{profile,stats}` and refreshes the signed session name claim if the display name changed. Stats come from the existing immutable points ledger, IST leaderboard service, persisted streak record, and approved submission count; they are never client-supplied. Duplicate handles return HTTP 409 `HANDLE_ALREADY_TAKEN`; other invalid fields return HTTP 400 `VALIDATION_ERROR`. Reads are `Cache-Control: no-store`.
- This endpoint is self-only. Public member profile resolution through the existing `/api/workspace?memberId=` seam remains unimplemented. Workspace, Chat, and Personal Space are not loaded or modified by this endpoint.

## Authenticated own settings (2026-11-01)

- `GET /api/users/me/settings` returns `{user:{email,role},profile,settings}` for the signed-in approved account. `profile` is the authenticated user's existing User profile projection; no leaderboard aggregation is done. Settings are read from the one-to-one `UserPreferences` row; if none exists, the response returns the UI defaults without writing a row.
- `PATCH /api/users/me/settings` accepts a non-empty allowlisted subset of `theme` (`light|dark`), `reviewNotifications`, `streakReminder`, `chatNotifications`, and `showPortfolio`. Unknown keys, IDs, roles, account state, malformed values, and cross-origin writes are rejected. The server gets the target ID from the signed session and rechecks persisted account approval before upserting.
- Both responses are `Cache-Control: no-store`. This endpoint cannot change email, role, approval, or password. Notification flags persist preference only; email/push delivery is not implemented. `showPortfolio` is stored, but public member profile fetching is still unavailable, so no public endpoint currently consumes that visibility flag.

## Persistence configuration — D-024

Supabase hosts PostgreSQL. Prisma 7 is the application's sole ORM and migration system. Runtime access uses `DATABASE_URL`; Prisma migration commands use `DIRECT_URL`. The app's task, submission, points and streak services use Prisma. Do not apply a parallel Supabase CLI schema migration.

## Phase 10 — task review integration (2026-11-01)

Verification update: after the initially reported database integration failures were fixed, the user reports `npm run test:integration` passed: 31/31 tests across 5 files. See TEST_LOG.md for the initial failure and successful retest details.

- `GET /api/admin/submissions?status=SUBMITTED&limit=20&offset=0` is admin-only and returns `{submissions, pagination}`. `status` defaults to `SUBMITTED` and accepts `SUBMITTED`, `UNDER_REVIEW`, or `ALL`; pagination uses the shared bounded parser.
- `POST /api/admin/submissions/:id/approve` retains the frontend body `{pointsAwarded}`. The route rejects all additional fields, derives `reviewedById` from the signed-in session and current persisted ADMIN row, and supplies server-owned rubric version `mvp-default-v1`. The points service checks `0..Task.pointsMax`, atomically approves, inserts the unique ledger record and refreshes the IST streak. Exact retries return the existing award.
- `POST /api/admin/submissions/:id/reject` and `/request-revision` accept `{feedback}` only, require 3–8000 trimmed characters, and conditionally transition reviewable attempts while recording reviewer and review time. They do not award points. Rejected/revision-requested attempts can be followed by a new submission.
- The existing rubric configuration endpoint is still a 503 seam. Until a versioned persisted rubric is implemented, review awards use the fixed default UI rubric version above; the client cannot select or forge that version.
- `npm run test:integration` loads local test DB settings without printing them, verifies TEST_DATABASE_URL targets a different project/database than DATABASE_URL and DIRECT_URL, performs a read-only connectivity/schema preflight, then runs the task, submission, points, streak and route-handler core-loop PostgreSQL suites. The core-loop test signs synthetic member/admin sessions but verifies both persisted users are APPROVED. It does not test login/registration, which remain pending seams.
- Chat and Personal Space are not read by review, award, leaderboard or streak operations.

## Phase 9 performance note (2026-11-01)

Measured existing GET task list/search/detail, own submissions, weekly/all-time leaderboard and streak route handlers against an isolated synthetic test database; timings and limitations are in TEST_LOG.md. `GET/PATCH /api/workspace` remains a 503 endpoint and profile read performance could not be measured. No API contract changed. Submission history no longer fetches the unused reviewer relation; its response fields remain unchanged.

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

New frontend shapes below remain integration contracts unless marked implemented. Task APIs and member submission APIs have persisted Prisma implementations; auth, admin review, workspace/chat/attachment/settings and scoring services remain disconnected. Types are centralized in `src/lib/api/contracts.ts`, `src/lib/workspace/types.ts`, `src/lib/db/submissions.ts`, and the corresponding feature modules.

| Route                          | Methods / intended successful shape                                             |
| ------------------------------ | ------------------------------------------------------------------------------- |
| /api/tasks                     | GET {tasks:TaskItem[]}; admin POST task fields -> {task:{id,...}}               |
| /api/tasks/[id]                | GET {task:TaskItem}; admin PATCH task fields                                    |
| /api/submissions               | GET own paginated submissions; POST {taskId,proofUrl,note} -> submitted attempt |
| /api/submissions/[id]          | owner GET/PATCH; DELETE withdraws before review                                 |
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
- Body: `{ taskId: string, proofUrl: string, note: string }`
- Response: `{ submission: Submission }` (status = SUBMITTED; HTTP 201)
- Errors: `ACCOUNT_PENDING`, `VALIDATION_ERROR`, `NOT_FOUND`, `SUBMISSION_IN_PROGRESS`

#### `GET /api/submissions`

- Auth: APPROVED member; returns only rows owned by the session user, with optional `status` and bounded `limit`/`offset` filters.
- Response: `{ submissions: Submission[], pagination: { limit, offset, total, hasMore } }`

#### `PATCH /api/submissions/:id`

- Auth: Submission owner (APPROVED member)
- Body: partial `{ proofUrl?: string, note?: string }`; unknown fields such as `userId`, `status`, `pointsAwarded`, reviewer, or task ID are rejected.
- Allowed while `DRAFT` or `SUBMITTED`; rejected once review starts or reaches a terminal state.

#### `DELETE /api/submissions/:id`

- Auth: Submission owner (APPROVED member)
- Withdraws only `DRAFT`/`SUBMITTED` attempts by changing status to `WITHDRAWN`; preserves the row and its history.
- Returns 409 `SUBMISSION_IN_PROGRESS` once `UNDER_REVIEW`; returns 422 `INVALID_STATE_TRANSITION` after a review decision.

Resubmitting after `REJECTED` or `REVISION_REQUESTED` creates a new attempt, preserving the earlier review and feedback. A partial unique database index permits only one `DRAFT`, `SUBMITTED`, or `UNDER_REVIEW` attempt per member/task. New writes accept safe HTTP(S) proof links and non-empty bounded text. There is no persistent submission upload store in this repository, so upload metadata is not accepted.

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

# Phase 0 live contract reconciliation (2026-10-31)

This verified snapshot distinguishes frontend expectations from live endpoint behavior. It supersedes any older statement in this file that describes feature endpoints as functioning services.

## Frontend consumers and current backend behavior

| Feature                | Frontend request / expected response                                                              | Live handler                                                                           | Integration status                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Task catalog           | `GET /api/tasks` → `{tasks: TaskItem[]}`                                                          | Guarded, persisted and approved-account checked                                        | Database-backed; admin `POST` also persists tasks                                                                |
| Task detail            | `GET /api/tasks/:id` → `{task: TaskItem}`                                                         | Guarded and persisted                                                                  | Database-backed; admin `PATCH` persists changes                                                                  |
| Submission create/list | `POST /api/submissions` and `GET /api/submissions` → `{submissions: Submission[]}`                | Guarded and persisted                                                                  | Owner derives from signed session; server validates proof and state                                              |
| Admin review           | `GET /api/admin/submissions`, `POST /api/admin/submissions/:id/{approve,reject,request-revision}` | Admin-only, persisted account revalidated                                              | Queue and transitions are database-backed; approve calls atomic points/streak boundary                           |
| Leaderboard            | `GET /api/leaderboard?period=weekly                                                               | alltime`→`{entries,total}`                                                             | Protected; database-backed ledger aggregation                                                                    | Weekly/all-time totals derive from PointTransaction; ranking is score descending, then name/id |
| Streaks                | `GET /api/streaks` → `{current,longest,activeDays}`                                               | Guarded, persisted and approved-account checked                                        | Database-backed reads; approval updates streak transactionally                                                   |
| Dashboard              | `GET /api/dashboard` → `DashboardSummary`                                                         | Guarded then 503                                                                       | Contract only                                                                                                    |
| Workspace/profile      | `GET/PATCH /api/workspace`; public profile consumer sends `memberId`                              | Both guarded then 503                                                                  | Contract only; no owner/profile storage. `memberId` is a requested public-profile lookup, not proof of ownership |
| Current user           | `GET /api/users/me` → `{user}`                                                                    | Session/status guard; matching local development fixture can return 200, otherwise 503 | Narrow local exception; no durable account lookup                                                                |

Current-state correction: the admin review row reflects the Phase 10 implementation. The configurable rubric routes, auth registration/persisted login and current-user persistence remain 503 seams.

Typed response contracts are in `src/lib/api/contracts.ts` and workspace shapes in `src/lib/workspace/types.ts`. `src/lib/api/backend.ts` constructs the no-store 503 response for pending routes. Protected routes may return 401/403 before reaching that response. Task, submission, admin review, points, leaderboard and streak routes are database-backed; persisted login/registration/current-user and configurable rubric remain pending.

## Verified mismatches / implementation notes

- `/api/workspace?memberId=...` is shared by private workspace consumers and the public member profile consumer. A durable implementation must branch and authorize public profile reads separately; it must not return private workspace data for a foreign `memberId`.
- Frontend `Submission` includes author/task display fields and optional review/points metadata. These are UI contract fields, not verified database columns or permission to accept client-authored reviewer/points values.
- The Phase 5 points boundary implementation is described below and is now called by the Phase 10 admin approval route.
- Proxy and `authorize()` enforce signed-session claims and role/status policy. Task, submission and leaderboard routes revalidate the current persisted account; disconnected auth/admin routes still require durable account lifecycle integration.
- Prisma schema, generated types, migrations and migration commands are documented in the Phase 1/3 implementation notes above.

## Phase 5 — transactional points engine (2026-10-31)

`dispatchApprovedPoints(prisma, payload)` is the Person 1 review-to-ledger boundary in `src/lib/points/service.ts`. It accepts only `submissionId`, `pointsAwarded`, `rubricVersion`, `reviewedById`, and the contracted key `pts_${submissionId}_${rubricVersion}`. The service re-reads the persisted submission, task maximum, approved author, and approved ADMIN reviewer. It does not accept a recipient ID or client-supplied maximum. A score must be an integer in the inclusive range `0..Task.pointsMax`; zero-point approvals create a ledger row.

One Prisma transaction conditionally changes `SUBMITTED`/`UNDER_REVIEW` to `APPROVED` and creates the immutable `PointTransaction`. Failure in either operation rolls the other back. An exact retry returns the existing ledger ID as already processed; a conflicting score, reviewer, rubric version, or idempotency key is rejected. Existing unique constraints on `submissionId` and `idempotencyKey`, the amount/max check, and `(userId, createdAt)` index provide database enforcement. No schema change or migration is required for this phase.

No balance or weekly cache is stored. `/api/leaderboard` derives sums from the ledger for all approved accounts. Weekly means Monday 00:00 Asia/Kolkata (the UI's current definition); all-time sums every ledger row. Entries are protected by existing session authorization and persisted-account revalidation. Chat and Personal Space are not read or scored.

Integration note (Phase 10): the admin approval route now authorizes and revalidates the persisted ADMIN, then supplies reviewer identity and the fixed MVP rubric version to this service. Configurable rubric persistence remains a separate seam.

## Phase 6 — weekly and all-time leaderboard (2026-10-31)

`GET /api/leaderboard?period=weekly|alltime&limit=20&offset=0` requires an authenticated, persisted APPROVED account. `period` defaults to `weekly`; limit/offset follow the shared pagination parser (limit 1–100, offset 0–100000). Repeated, malformed or unsupported values return 400. Response:

```ts
{
  entries: LeaderboardEntry[]; // requested page
  total: number;               // all ranked members in this period
  pagination: { limit: number; offset: number; total: number; hasMore: boolean };
  currentUser: LeaderboardEntry | null; // caller's row even if outside page
  userAhead: LeaderboardEntry | null;   // immediately higher ordinal row
}
```

Entries are approved users with at least one points log tied to a currently APPROVED submission. An approved zero-point award is still eligible; users with no approved work in the period are omitted. Pending, rejected, withdrawn, and revision-requested submissions do not count. Weekly boundary is Monday 00:00 Asia/Kolkata. Tie order: points descending, lowercased name ascending under `C` collation, then ID ascending under `C` collation; ranks are stable ordinal positions. `currentUser` and `userAhead` are independent of page offset so the existing standing panel works on every page. The UI has Previous/Next controls and resets to the first page when the period changes.

The query reads only User, Streak, Submission, and PointTransaction; it returns public leaderboard fields only. Personal Space and Chat data are not queried. The Phase 6 migration adds `Submission(userId,status)` and `PointTransaction(createdAt,userId)` indexes. Migration is additive and has not been applied by the agent; PostgreSQL integration tests remain gated by the separate test database.

## Phase 7 — Streak engine

### `GET /api/streaks`

- Auth: approved persisted session; the member ID comes from the signed session and is revalidated against `User`.
- Response: `{ current, longest, activeDays }`. `activeDays` contains the member's distinct active IST dates from the current date and previous 41 calendar dates, as `YYYY-MM-DD` strings.
- Client-supplied user IDs are ignored. Missing streak state returns zero current/longest and an empty day list.
- Qualification: a persisted submission with `status=APPROVED`, approved author, and a server-generated `reviewedAt`; zero-point approvals qualify. Login, submitted/rejected/withdrawn work, Chat, and Personal Space do not qualify.
- Date mapping: `reviewedAt AT TIME ZONE 'Asia/Kolkata'`. The unique primary key on `StreakDay(userId,activityDate)` deduplicates multiple approved submissions on one day.
- Approval integration: `dispatchApprovedPoints` calls `public.record_approved_submission_streak(submissionId)` inside the same transaction as the status change and PointTransaction write. The database derives owner/date and serializes per-user refresh with an advisory transaction lock.
- Reset: current streak remains active when the most recent activity date is today or yesterday. Once there is a full missed IST day, current becomes zero; longest is retained.
- Scheduler: Supabase Cron runs `select public.refresh_all_streaks();` daily at `35 18 * * *` UTC (00:05 IST). Setup and verification SQL are in `DB_SCHEMA.md`. The scheduler is a reconciliation/reset path; same-day approval refresh does not wait for Cron.
- Privacy: only User, Submission, StreakDay, and Streak are read/written. Personal Space and Chat are excluded.
- Integration note (Phase 10): the admin approval route calls `dispatchApprovedPoints`; a route-handler PostgreSQL core-loop test covers immediate streak visibility. The current login endpoint does not persist login events; no login streak is recorded.

## Phase 8 — Isolation & security audit (2026-10-31)

### Verified protections

- Persisted task, submission, leaderboard, and streak routes authenticate through the existing signed-session guard and revalidate an APPROVED persisted account before data access. Role and display name must match the persisted row.
- Member submission list/create/edit/withdraw operations derive the owner from the session. Direct submission detail reads now apply `id AND userId` in the database query for members; the contract permits an approved ADMIN to read any submission detail. Foreign-member detail lookups return 404.
- Task members see only PUBLISHED rows; task create/edit is ADMIN-only. The points service derives recipient and maximum from persisted submission/task data, verifies an approved ADMIN reviewer, and records approval, point log, and streak in one transaction.
- `GET /api/leaderboard` and `GET /api/streaks` use the signed-in persisted account; client-supplied user IDs do not select another member's rows.
- No Workspace, Chat, attachment, Todo, Note, Goal, or profile-private source is queried by point or streak calculations. Those endpoint handlers currently remain guarded 503 stubs.

### Audit fixes

- Session authorization and the Next.js proxy now reject unknown user-status claims in addition to unknown roles; a malformed status cannot pass as active.
- Persisted-account revalidation selects only `id`, `name`, `role`, and `status`, avoiding unnecessary retrieval of `passwordHash`.
- The generic resource-owner guard now treats an empty owner ID as a denial instead of skipping the ownership check.
- Submission detail lookup applies member ownership in SQL rather than fetching a foreign submission before denying it.
- `maxPoints` remains an immutable award-time audit snapshot and is deliberately not part of retry identity because task maximums can later change. Tests preserve exact retries after a task edit.

### Remaining risks and coordination

- The owner/admin Submission response currently includes `authorEmail` under the existing contract. It is limited to the owner or approved ADMIN; no frontend use was found, but removing it needs the contract owners' review.
- Admin approval/rejection are implemented in Phase 10 and derive reviewer identity from the authenticated persisted ADMIN session; never accept `reviewedById` from the body. Persisted auth lifecycle and configurable rubric routes remain 503 stubs.
- Workspace and Chat routes currently return 503, so no persisted private-data query path exists in this checkout. A Person 4 messaging channel was not available; their explicit privacy sign-off remains outstanding. The verified code boundary excludes those sources from scoring/streaks.
- PostgreSQL integration tests are present but require a separate migrated `TEST_DATABASE_URL`; they were skipped in this audit. Live RLS and SQL-function behavior therefore remain unverified.

# Phase 1 schema/API review notes (2026-10-31)

Schema is a draft in `DB_SCHEMA.md`; no migration or operational API behavior is approved by these notes. Review required from Persons 1 and 2 before implementation.

- Person 1's `User` and `InviteCode` declarations in `src/lib/auth/types.ts` are the existing contract to reuse; no parallel account/invite model should be added. Confirm durable IDs and invite code hashing. The current InviteCode response type contains `code`, but D-010 requires secure token handling; recommend store only a hash and expose a raw code once at creation if Person 1 approves.
- Person 1's existing points boundary key is `pts_${submissionId}_${rubricVersion}`. Person 3 owns the one immutable `PointTransaction` ledger. The ledger idempotency key is unique; score/recipient/reviewer must be checked against persisted Task, Submission, and User rows. Approval + ledger + streak refresh are one transaction. No balance cache/second ledger.
- Person 2 currently submits only `{taskId, proofUrl, note}` to `POST /api/submissions`; admin approval UI sends `{pointsAwarded}` to `POST /api/admin/submissions/:id/approve`. Server must derive identity, max score, reviewer, and rubric version; validate server-side.
- Task UI currently defines `TaskItem.status` as `Open|Pending|Approved|Rejected`, which is member-specific/display state. Proposed persisted Task lifecycle is `DRAFT|PUBLISHED|ARCHIVED`; derive the UI status from published task plus that member's submission. Person 2 review required.
- The `Submission` response type includes joined display fields (`taskTitle`, `category`, `maxPoints`, `authorName`, `authorEmail`) and optional review metadata. Treat these as projected response fields, not client-writable persistence fields. Private workspace/chat payloads stay outside the scoring and streak contracts.

# Phase 2 backend conventions (2026-10-31)

These conventions preserve the current Next.js App Router and centralized `src/lib` helpers. They do not imply that disconnected routes now persist data.

## Route flow and ownership

1. Keep route handlers thin. Apply the existing proxy/RBAC guard and route-level `authorize()` before resource access; when a database exists, re-read account status/role from the authoritative user row before protected writes.
2. Parse bounded JSON object bodies with `readJsonObject()` from `src/lib/api/request.ts`; validate field types, lengths, enums, URLs and ownership in the route/service. Never accept client identity, role, approval state, score, or streak as authoritative.
3. Put reusable business rules in services under `src/lib`; isolate persistence in repositories only when an approved database/ORM is introduced. Keep transactional/idempotent review and points logic in the Person 3 service boundary.
4. Return successful JSON with existing typed contracts. Return failures through `apiError()` or `errors` from `src/lib/errors.ts`, preserving `{error:{code,message,status}}`. Never return exception text or stack traces.

## Request parsing and pagination

`readJsonObject(request, {maxBytes, message})` enforces JSON content type, a byte limit even without trustworthy `Content-Length`, valid JSON, and a top-level object. Field-specific constraints remain the route/service's responsibility. It returns the standard `VALIDATION_ERROR` / 400 envelope on parse/size failures. The login endpoint uses a 4096-byte cap.

For collection endpoints, use `parsePagination(URL.searchParams)`: optional integer `limit` defaults to 20 and is bounded 1–100; `offset` defaults to 0 and is bounded 0–100000. Duplicate or malformed values return `VALIDATION_ERROR` / 400. Response convention: `{items, pagination:{limit,offset,total,hasMore}}`, with `paginationMeta()` computing metadata. The leaderboard now uses this shared paging convention and adds `currentUser`/`userAhead` fields so the standings panel remains available on every page.

## Logging and test fixtures

`logApiFailure()` accepts only fixed event codes and an optional validated opaque request ID. Do not pass errors, request bodies, credentials, email, tokens, proof URLs, or database records to logs. Catch unexpected failures at route/service boundaries, log only the safe event, and return `errors.internal()`; expected validation/authorization failures do not need error logs.

Keep fixtures in test files or a clearly test-only fixture location; use synthetic identities/data, never import fixtures from runtime routes, and never turn fixture success into a simulated service response. Existing `src/lib/api/backend.test.ts` exercises handlers with synthetic signed sessions and asserts the 503 boundary plus auth behavior.

## Setup and environment

Use Node 24 and `npm ci`; configure ignored `.env.local` and generate a private `SESSION_SECRET` only if local signed-session login is needed. Supabase is selected and Prisma 7 is installed. The user reported applying the checked-in initial migration successfully. Use a separate disposable `TEST_DATABASE_URL` for database integration tests.

# Phase 3 — task lifecycle API contract (implemented; initial migration reported applied)

Status: **Implemented against Prisma/Supabase schema; live database access requires private Supabase URLs.** Task handlers return guarded 503 when `DATABASE_URL` is unset; they never return fixture-backed runtime data.

## Existing frontend contracts

- `GET /api/tasks` is consumed by the member task list, global search and admin task manager. Current task UI filters are `All`, `Open`, `Submitted`, `Approved`, `Rejected`; the filter utility maps Submitted to the existing `TaskItem.status === "Pending"` display value. Sort values are `newest` (`createdAt` descending) and `points` (`pointsMax` descending). The UI also has local category and text search filters.
- `GET /api/tasks/:id` supplies the task detail used by submission UI. Existing `TaskItem.checklist` is displayed as “Acceptance checklist” and is the only existing task rules/requirements payload. There is no separate rules endpoint or `rules` property in the current contract.
- Admin creation uses `POST /api/tasks` with `{title,description,category,pointsMax,dueAt,checklist}`. Existing admin task list reads the same collection. `PATCH /api/tasks/:id` is the only assigned task update contract.
- Existing contracts do not assign task deletion or a separate activation endpoint. Do not add either without an agreed contract. Task create/edit authorization remains ADMIN-only; member list/detail requires APPROVED member or ADMIN.

## Implemented list query/response convention

`GET /api/tasks` supports `status=all|open|submitted|approved|rejected` (member) or `status=all|draft|published|archived` (admin; default `all`), `sort=newest|points` (default `newest`), optional `category`/`search`, and shared `limit`/`offset` (defaults 20/0, max limit 100, max offset 100000). Unknown, repeated, overlong, malformed or role-incompatible values return `VALIDATION_ERROR` / 400. Member status derives from that authenticated member's latest persisted submission; `userId` is never accepted from the query. `Open` means published/visible with no effective submission; `Submitted` maps pending review/revision; `Approved` and `Rejected` reflect the latest review. Category/search apply before pagination. Stable ties: `createdAt DESC`, then `id ASC` for newest; `pointsMax DESC`, then `createdAt DESC`, then `id ASC` for points.

Response: `{tasks: TaskItem[], pagination:{limit,offset,total,hasMore}}`. Empty results are `200` with `tasks: []` and `total: 0`. Admins can view all lifecycle states; members only see published tasks. Admin DTOs include `lifecycle` and the admin task table displays that value separately from member-specific `TaskItem.status`.

## Detail, errors, and visibility

`GET /api/tasks/:id` returns `{task: TaskItem}` including `checklist` as the task requirements payload. An unknown or non-visible task returns `NOT_FOUND`; hidden task existence is not disclosed to members. All task routes use the existing signed-session/RBAC guard, then revalidate persisted user role/status before repository access. Successful reads are no-store. `POST /api/tasks` is ADMIN-only, validates the existing admin form fields, derives creator identity from the session, and creates a published task. `PATCH /api/tasks/:id` is ADMIN-only and accepts only task content fields; lifecycle cannot be client-mutated. No delete or activation endpoint is defined. If `DATABASE_URL` is missing, guarded requests return 503; database errors return the standard generic 500 envelope and a safe log event.

The approved initial schema/migration lives in `prisma/schema.prisma` and `prisma/migrations/`. It includes User, Task, Submission, PointTransaction, Streak and InviteCode; task endpoints use only User/Task/Submission. The user reported that Supabase successfully applied the initial migration. Database integration tests require a separate `TEST_DATABASE_URL` and are skipped when unset.

# Phase 4 — Submission lifecycle API (implemented; migration reported applied)

`POST /api/submissions` uses the current task detail form body `{taskId, proofUrl, note}` and creates status `SUBMITTED` immediately. `GET /api/submissions` returns only the signed-in user's rows, optionally filtered by status and bounded `limit`/`offset`; `GET /api/submissions/:id` returns the owner’s submission or an admin-authorized detail.

The owner may `PATCH /api/submissions/:id` with only `proofUrl` and/or `note`, or `DELETE` it to mark `WITHDRAWN`, while status is `DRAFT` or `SUBMITTED`. Both transitions are conditional database writes. `UNDER_REVIEW` is locked with 409 `SUBMISSION_IN_PROGRESS`; decided or withdrawn attempts return 422 `INVALID_STATE_TRANSITION`. A foreign owner receives 404. No client field can set `userId`, task, review status, reviewer, feedback, points, or rubric version.

A rejected or revision-requested attempt may be followed by a new `SUBMITTED` attempt for the same task; the earlier row and feedback remain intact. Concurrent active attempts are rejected by the additive partial unique index in `prisma/migrations/20261031210000_submission_lifecycle/`. The user reported that this migration and the original schema migration were applied successfully to Supabase on 2026-10-31. Database transition tests still require a separate migrated test database.

Proof must be an absolute HTTP(S) URL up to 2048 characters; note is required and bounded to 8000 characters. The current frontend sends proof links and notes only. No persistent submission-upload storage exists, so file/upload metadata is not accepted. Admin approval/rejection/revision is implemented as described in Phase 10; edits remain locked once the submission is under review or decided.

# Phase 12 — Persisted authentication and invite onboarding (implemented; integration DB run pending)

These endpoints use the existing Prisma `User` and `InviteCode` models; no parallel auth store or migration was added. Passwords are stored with the existing scrypt helper. Invite codes are stored only as SHA-256 hashes, and email comparisons/unique ownership use normalized lowercase email.

- `POST /api/auth/register` accepts exactly `{name,email,password,inviteCode}`. Names are trimmed and limited to 120 characters; passwords are 8–256 UTF-8 bytes; invite format is validated. Invite capacity is claimed conditionally inside the same transaction as `User` creation. The server assigns `role: MEMBER` and `status: PENDING_APPROVAL`; request role/status/user IDs are rejected. Returns `201 {user:{id,email,name,role,status,createdAt}}` and sets the existing signed HttpOnly session cookie for that pending member. The frontend opens `/onboarding`. Invalid/exhausted invitation is `400`; normalized duplicate email is `409 EMAIL_ALREADY_REGISTERED`.
- Pending sessions are restricted by middleware to `/onboarding` and `GET /api/users/me`; workspace routes redirect to onboarding and protected APIs return `403 ACCOUNT_PENDING`. The waiting page polls the persisted current-user endpoint and navigates to `/dashboard` only after it returns `APPROVED` (or `/admin` if the persisted role is ADMIN); `/api/users/me` refreshes the session from persisted role/status.
- `POST /api/invites/verify` accepts `{code}` and returns `{valid:true,remainingUses}` only for a current active invitation. Invalid, expired, revoked, or exhausted codes return a generic invalid/exhausted error; it does not reveal invite metadata.
- `POST /api/auth/login` accepts exactly `{email,password}`, looks up the persisted account case-insensitively, verifies the existing scrypt hash, and signs the existing HttpOnly session cookie. Wrong email/password share the same `401` response. Rejected/suspended/disabled users are denied. Pending accounts can sign in, but member APIs remain blocked by the existing RBAC status guard.
- `GET /api/users/me` validates the signed session against the persisted row, returns `{user:{id,email,name,role,status,createdAt}}`, and refreshes the signed cookie from current database role/status. Missing or inactive accounts are denied. The local loopback fixture remains development-only.
- `POST /api/auth/bootstrap-admin` is disabled (404) unless `FIRST_ADMIN_BOOTSTRAP_TOKEN` is configured with 32+ characters. It requires same-origin and `x-first-admin-token`, accepts exactly `{name,email,password}`, requires a 12-character minimum password, serializes first-admin creation with a PostgreSQL transaction advisory lock, and refuses creation if any ADMIN exists. It returns no login cookie; sign in normally afterward. Remove the bootstrap environment variable and restart the app immediately after success.
- `GET /api/invites` is persisted-ADMIN-only and paginated; raw codes and hashes are never returned. `POST /api/invites` is persisted-ADMIN-only and accepts `{maxUses?,expiresAt?}`. It returns a generated raw code once in the create response; admins must copy/share it then because the database stores only its hash. `DELETE /api/invites/:id` revokes an eligible invite.
- `GET /api/admin/users?status=PENDING_APPROVAL&limit=20&offset=0` is persisted-ADMIN-only and returns an allowlisted user projection and pagination. `POST /api/admin/users/:id/approve` only transitions a different `MEMBER` from `PENDING_APPROVAL` to `APPROVED`; repeated/invalid transitions return 409.

Registration, login, invite verification and bootstrap use bounded bodies and process-local IP rate limits. These rate limits are not distributed across instances. Registration/login/invite and admin flows use generic error responses and allowlisted error-event logging. Durable audit records are unavailable because this schema has no audit-log model. Reject/suspend/disable/unsuspend admin user actions and magic-link authentication remain unimplemented. Automated route unit tests pass; the checked-in DB integration flow tests invite creation/verification, registration, approval, login, current-user lookup and task browse, but the agent environment could not connect to the separate test database. No database mutation or deployment was performed by this implementation.

# Phase 5 — remaining tab integration status (2026-11-01)

| Tab/page                                 | UI contract and observed request                                                                    | Backend status / verified cause                                                                                                                                                     | Resolution or next dependency                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Dashboard                                | `GET /api/dashboard`; points, weekly rank, current streak, approved count, recent activity          | Was an explicit 503 placeholder despite existing ledger, leaderboard, streak and submission data                                                                                    | Connected in this phase; authenticated self-only projection, with activity limited to approved work                                  |
| Tasks, submissions, leaderboard, streaks | Existing APIs under `/api/tasks`, `/api/submissions`, `/api/leaderboard`, `/api/streaks`            | Prisma-backed endpoints and tests exist                                                                                                                                             | No integration gap verified in this pass                                                                                             |
| Profile / Settings                       | `/api/users/me/profile`, `/api/users/me/settings`                                                   | Current local changes add self-only APIs and migrations; migrations remain pending application                                                                                      | No additional endpoint change in this phase                                                                                          |
| Personal Space and Chat                  | `GET/PATCH /api/workspace`; chat composer also calls `/api/chat/attachments`                        | Workspace and attachment routes explicitly return 503. Prisma has no corresponding persistent models/storage. Existing contracts mix private todos/notes/goals with shared messages | Requires approved domain schema/storage, ownership model, Person 4 privacy review, and chat transport decision before implementation |
| Notifications                            | `GET/PATCH /api/notifications`                                                                      | Both methods explicitly return 503; no Notification model or delivery/read source exists                                                                                            | Requires notification persistence/event-source and delivery policy decision                                                          |
| Admin rubric                             | `GET/PUT /api/rubric`                                                                               | Explicit 503; no rubric persistence/version model. Approval currently supplies server-owned `mvp-default-v1`                                                                        | Requires rubric version/storage design and compatibility plan with review flow                                                       |
| Admin moderation                         | `GET/PATCH /api/admin/reports`                                                                      | Explicit 503; chat/report records are not persisted                                                                                                                                 | Requires persisted report model and Person 4 moderation/privacy contract                                                             |
| Admin audit log                          | `GET /api/admin/audit-log`                                                                          | Explicit 503; no durable audit model exists                                                                                                                                         | Requires audit schema/retention/access policy                                                                                        |
| Admin member management                  | `GET /api/admin/users` and approve exist; reject/suspend/disable/unsuspend routes are explicit 503s | Partial implementation; state transitions need endpoint-specific contracts and tests                                                                                                | Reject is visible in the member UI; lifecycle actions need defined reason/state semantics before enabling                            |

## Dashboard response contract

`GET /api/dashboard` requires the existing signed session and a persisted `APPROVED` account. It derives the user ID from the validated account, and returns the existing `DashboardSummary` shape: `totalPoints`, `weeklyRank`, `dayStreak`, `tasksApproved`, and up to five recent `activity` items. Points are summed from `PointTransaction` rows linked to approved submissions; weekly rank uses the existing IST leaderboard service; streak comes from `Streak`; approved count/activity use the caller's approved submissions. Empty history returns zeros, `weeklyRank: null`, and `activity: []`. `Cache-Control: no-store` is set. No dashboard-specific schema or migration is required.

# Phase 6 — API/database integration review (2026-11-01)

The new Dashboard handler follows existing API conventions: signed-session authorization, persisted approved-account validation, `getPrismaClient()` for all data access, selected Prisma fields, `Cache-Control: no-store`, the shared JSON error envelope, and allowlisted logging without exception details. It uses the existing Prisma PostgreSQL adapter and configured database connection; there is no parallel Supabase JS data client or direct `pg` query in this route. The response shape is unchanged from `DashboardSummary` documented above. No schema or API contract change was needed. Independent read queries can return a momentarily mixed snapshot; there is no multi-write operation that requires an encompassing transaction, and leaderboard computation maintains its own repeatable-read transaction.

# Phase 8 — connected-page API handoff (2026-11-01)

No API signature or response changed in Phase 8. Current connected page endpoints are:

| Page      | Method and path                | Request                                                                                                                                                                       | Response / behavior                                                                                                                                                                                            |
| --------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard | `GET /api/dashboard`           | Signed session; no request body or identity query                                                                                                                             | `{totalPoints,weeklyRank,dayStreak,tasksApproved,activity:[{id,title,createdAt}]}`. Requires persisted approved account. Empty history yields zero counts, null rank if unranked, and an empty activity array. |
| Profile   | `GET /api/users/me/profile`    | Signed session; caller identity only                                                                                                                                          | `{profile,stats}`; only own profile is selected.                                                                                                                                                               |
| Profile   | `PATCH /api/users/me/profile`  | Same-origin JSON subset of `name`, `handle`, `bio`, `skills`, `currentProject`, `portfolioUrl`, `githubUrl`, `linkedinUrl`, `avatarUrl`; no user ID, role, status, or metrics | Updated `{profile,stats}`; validates fields, writes only the persisted caller's User row, refreshes signed name claim if changed; duplicate handle is 409.                                                     |
| Settings  | `GET /api/users/me/settings`   | Signed session; no identity parameter                                                                                                                                         | `{user:{email,role},profile,settings}`; preferences use UI defaults when no saved row exists.                                                                                                                  |
| Settings  | `PATCH /api/users/me/settings` | Same-origin JSON subset of `theme`, `reviewNotifications`, `streakReminder`, `chatNotifications`, `showPortfolio`; no user ID/role/status                                     | `{user:{email,role},settings}`; upserts only the caller's preference row after persisted-account validation.                                                                                                   |

These handlers use the shared Prisma/PostgreSQL adapter and current signed-session/persisted-account checks. Dashboard/Profile/Settings tests use Prisma mocks and UI HTTP fixtures where noted in `TEST_LOG.md`; the present verification does not prove the two new migrations are applied or establish live save/reload behavior.

## Verified disconnected contracts and Retry causes

The following existing frontend calls currently reach explicit `pendingEndpoint` 503s (`BACKEND_NOT_CONFIGURED`): `GET/PATCH /api/workspace` (Personal Space and Chat), `POST /api/chat/attachments` and attachment detail, `GET/PATCH /api/notifications`, `GET/PUT /api/rubric`, `GET/PATCH /api/admin/reports`, `GET /api/admin/audit-log`, and admin user reject/suspend/disable/unsuspend actions. Those are intentional backend seams; the current Prisma schema has no durable Workspace/Chat/attachment, Notification, configurable Rubric, Report, or Audit models. Further work depends on domain/storage/retention decisions, Person 4 privacy review for Workspace/Chat/moderation, and explicit member lifecycle transitions. Do not claim these tabs are connected or replace the 503s with fake stores. No affected endpoint contract was changed by this documentation-only phase.

# 2026-11-01 — Sign-out UI integration

No API contract changed. The shared header now invokes the existing `POST /api/auth/logout` endpoint, which clears the session cookie and returns `{success:true}`. On success the browser navigates to `/login`; inactive-account status is not changed by logout.

# 2026-11-01 — Registration diagnostic logging

No endpoint contract changed. Unexpected registration 500s now emit safe `stage` and Prisma `code` fields in server logs; registration request data and exception messages remain private.

Registration's interactive Prisma transaction uses a 10-second acquisition wait and 15-second execution timeout, matching the first-admin bootstrap route. This is operational behavior; request/response shape is unchanged.

## PLANNED chat and Personal Space contract — NOT IMPLEMENTED (2026-11-01, Stage 3, D-037/D-038)

Status: the Stage 3 UI and hooks (`src/lib/workspace/use-chat.ts`, `use-space.ts`) call the routes below. None of these routes exist yet (Stage 5), so the pages show load errors until then. Types: `src/lib/workspace/types.ts`. Every route requires a signed APPROVED session plus a persisted-account check; writes are same-origin JSON; responses are `Cache-Control: no-store`.

Personal Space (private to the signed-in member; the owner id is never taken from the client):

- `GET /api/space` → `{todos, notes, goals}`.
- `PATCH /api/space` body `{resource: "todos"|"notes"|"goals", operation: "create"|"update"|"delete", id?, data?}` → updated `{todos, notes, goals}`. `Todo` now includes `taskId: string|null` and `taskTitle: string|null` (published tasks only; otherwise both null). Plain-text notes. Existing field limits from the 2026-10-29 workspace supplement still apply (title ≤200, description/content ≤5000, progress 0..100, 100 items per collection).

Chat (shared `#general`):

- `GET /api/chat/messages?limit=50[&before=<id>|&after=<id>][&updatedSince=<ISO>]` → `ChatFeed` (see D-038).
- `POST /api/chat/messages` `{content}` (1..500, nonblank) → 201 `{message}`. Refused with 403 `CHAT_RULES_NOT_ACCEPTED` until rules are accepted. Non-empty `attachmentIds` are rejected while attachments are unbuilt.
- `PATCH /api/chat/messages/[id]` `{content}` (author only) → `{message}`.
- `DELETE /api/chat/messages/[id]` (author or ADMIN; soft delete) → 204.
- `POST /api/chat/messages/[id]/pin` `{pinned: boolean}` (ADMIN only) → `{message}`.
- `POST /api/chat/messages/[id]/reactions` `{emoji}` from the fixed palette; toggles the caller's reaction → `{messageId, reactions}`. Contract addition.
- `POST /api/chat/rules/accept` `{}` → `{rulesAccepted: true}`; stores `UserPreferences.chatRulesAcceptedAt`. Contract addition.
- New error code `CHAT_RULES_NOT_ACCEPTED` (403). Contract addition.

Type changes: `ChatMessage` gains `authorAvatarUrl` and `reactions`; `WorkspaceData` loses `todos`, `notes`, `goals` and `messages`; `WorkspaceResource` is `"profile"|"settings"`. Chat attachment routes (`/api/chat/attachments`) are unchanged 503 stubs.

## Chat and Personal Space API — IMPLEMENTED in Stage 5 (2026-11-01, D-037/D-038/D-041)

Supersedes the "PLANNED chat and Personal Space contract" section above; request and response shapes are unchanged from it. The routes need the Stage 4 migration applied to the target database; until it is, they fail with the generic 500 (missing tables). Every route requires a signed APPROVED session, rechecks the persisted account (stale or forged cookies are refused), sets `Cache-Control: no-store`, and writes require a same-origin request and JSON.

Personal Space (`src/app/api/space/route.ts`, `src/lib/space/service.ts`): permissions `view:space` (GET) and `edit:own_space` (PATCH). The owner is always the persisted session account; `userId` in a body, nested `data`, or query string is not accepted or read. A foreign or unknown item id returns 404 (also for admins). Validation (400 `VALIDATION_ERROR`): unknown fields; title required, trimmed, ≤200; description/content ≤5000 (may be empty); difficulty Easy/Medium/Hard; priority Low/Medium/High; `dueDate` empty, null or a real `YYYY-MM-DD`; `completed` boolean; goal progress an integer 0..100; `taskId` null or the id of a PUBLISHED task; NUL characters; `id` on create; missing `id` on update/delete; empty update; body over 32 KB. At most 100 items per collection (the 101st create returns 400). Responses return the full refreshed `{todos, notes, goals}`. A to-do whose linked task is no longer published is returned with `taskId` and `taskTitle` null (the link is kept in the database).

Chat (`src/app/api/chat/…`, `src/lib/chat/service.ts`): permission `chat:read_write`.
- `GET /api/chat/messages`: `limit` 1..50 (default 50); `before` or `after` (not both); `updatedSince` (ISO `…Z`) only with `after`. An unknown cursor id returns 400. Deleted messages are never listed; with `after`+`updatedSince`, `updates` carries changed messages already delivered and `{id, deleted: true}` tombstones; more than 100 changes returns `resync: true`. `pinned` lists up to 10 pinned messages (newest first). Reactions are returned as counts per palette emoji with the viewer's own flagged; reactor identities are never returned.
- `POST /api/chat/messages`: body only `content` (trimmed, 1..500) and optionally an empty `attachmentIds`; a non-empty list returns 400 "Attachments are not available yet." 403 `CHAT_RULES_NOT_ACCEPTED` until the member has accepted the rules; 201 `{message}`.
- `PATCH /api/chat/messages/[id]`: author only (403 for anyone else, admins included); 404 if missing or deleted.
- `DELETE /api/chat/messages/[id]`: soft delete by the author or a persisted ADMIN (403 otherwise); 204; 404 if missing or already deleted.
- `POST /api/chat/messages/[id]/pin`: needs `admin:moderate_chat` in the session and a persisted ADMIN; body `{pinned: boolean}`.
- `POST /api/chat/messages/[id]/reactions`: body `{emoji}` from the six-emoji palette; toggles the caller's reaction; returns `{messageId, reactions}`; 404 for a missing or deleted message.
- `POST /api/chat/rules/accept`: takes no fields; records the first acceptance time and never overwrites it.
Edits, deletes, pins and reactions set the message `updatedAt` explicitly so polling clients see them.

Chat attachments (`/api/chat/attachments`) and `/api/workspace` are unchanged 503 stubs. Not implemented: chat rate limiting, message reporting, audit events.
