# API_CONTRACTS.md

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

| Field    | Value               |
| -------- | ------------------- |
| Producer | **P1** (Rubric API) |
| Consumer | **P2** (task UI)    |
| Status   | 🟡 PROPOSED         |

#### `GET /api/rubric`

- Auth: APPROVED member or ADMIN
- Response: `{ rubric: { id, version, criteria: RubricCriterion[], updatedAt } }`

```typescript
interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
}
```

#### `PUT /api/rubric`

- Auth: ADMIN only
- Body: `{ criteria: RubricCriterion[] }`
- Response: `{ rubric: Rubric }`
- Side-effects: Creates `RubricVersion` record; emits `RUBRIC_UPDATED` audit event

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

_Last updated: 2026-10-28 · Phase 6 Admin Review Queue complete_
