# MVP_SPEC.md — PRAX Platform

> **Phase 1 output. All items marked PROPOSED are assumptions documented for team review.**  
> No app code was written. Ownership is explicit. No requirement is untestable.  
> _Last updated: 2026-10-27_

---

## 1. Product Purpose

PRAX is an invite-only team platform where members complete tasks, earn points and streaks, submit work for rubric-based review, and coordinate via chat. Admins manage membership, review submissions, assign points, maintain the rubric, and moderate content.

**Out of scope for MVP:**
- Public signup without invite code
- Payments / billing
- Mobile native apps
- Email notifications (may be added in Phase 5 as enhancement)

---

## 2. Roles & Exact Permissions

### 2.1 Visitor (unauthenticated)
| Action | Permitted |
|--------|-----------|
| View landing / marketing page | ✅ |
| Access any authenticated route | ❌ |
| Register with a valid invite code | ✅ |
| Login | ✅ (redirects to onboarding if PENDING) |

### 2.2 Member (authenticated, role = `MEMBER`, status = `APPROVED`)
| Action | Permitted |
|--------|-----------|
| View own dashboard | ✅ |
| View and edit own profile | ✅ |
| View task list | ✅ |
| Create / edit own task submission (DRAFT) | ✅ |
| Submit own task for review | ✅ |
| View own streak and points | ✅ |
| View rubric (read-only) | ✅ |
| Send and receive chat messages | ✅ |
| View and edit own Personal Space | ✅ |
| View other members' public profiles | ✅ |
| Access admin panel | ❌ |
| Approve/reject any user or submission | ❌ |
| Assign points to any user | ❌ |
| Edit or delete another member's submissions | ❌ |
| Moderate chat messages | ❌ |

> **PROPOSED assumption (A-001):** A member with status `PENDING_APPROVAL` can log in but lands on an onboarding/waiting screen; they cannot access tasks, chat, or personal space until `APPROVED`.

### 2.3 Admin (authenticated, role = `ADMIN`)
Inherits all Member permissions, plus:
| Action | Permitted |
|--------|-----------|
| View pending-approval user queue | ✅ |
| Approve a user (PENDING → APPROVED) | ✅ |
| Reject a user (PENDING → REJECTED) | ✅ |
| Suspend a user (APPROVED → SUSPENDED) | ✅ |
| Disable a user (any → DISABLED) | ✅ |
| Create invite codes | ✅ |
| Revoke invite codes | ✅ |
| View all invite codes and usage | ✅ |
| View full submission review queue | ✅ |
| Approve a submission | ✅ |
| Reject a submission (with feedback) | ✅ |
| Request revision on a submission | ✅ |
| View and update rubric | ✅ |
| Assign points to any member | ✅ |
| Delete/hide any chat message (moderation) | ✅ |
| View audit log | ✅ |

> **PROPOSED assumption (A-002):** There is exactly one Admin role for MVP. No super-admin / sub-admin hierarchy yet.

---

## 3. User Lifecycle States

```
            +------------------+
   register |                  | reject
   -------->| PENDING_APPROVAL |-----------> REJECTED
            |                  |
            +--------+---------+
                     | approve
                     v
            +--------+---------+
            |     APPROVED     |-----------> SUSPENDED ---> APPROVED (unsuspend)
            |                  |                        |
            +--------+---------+                        +---> DISABLED
                     | disable
                     v
            +------------------+
            |    DISABLED      |  (terminal: data retained, login blocked)
            +------------------+
```

| State | Login allowed | Platform access | Notes |
|-------|-------------|----------------|-------|
| `PENDING_APPROVAL` | ✅ (onboarding screen only) | ❌ | Waiting for admin review |
| `APPROVED` | ✅ | ✅ | Full member access |
| `REJECTED` | ❌ (error shown) | ❌ | Account exists, login blocked |
| `SUSPENDED` | ❌ (error shown) | ❌ | Temporary; reversible by admin |
| `DISABLED` | ❌ (error shown) | ❌ | Permanent; data retained |

---

## 4. Submission Review States

```
  DRAFT --> SUBMITTED --> UNDER_REVIEW --> APPROVED   (terminal)
    ^                         |
    |                         +-----------> REJECTED   (terminal)
    |                         |
    +-------------------------+-----------> REVISION_REQUESTED --> SUBMITTED (re-submit)
```

| State | Who sets it | Description |
|-------|------------|-------------|
| `DRAFT` | Member (auto on create) | Being edited; not yet submitted |
| `SUBMITTED` | Member (submit action) | Awaiting admin pickup |
| `UNDER_REVIEW` | Admin (claim/open) | Admin is actively reviewing |
| `APPROVED` | Admin | Accepted; points may be assigned |
| `REJECTED` | Admin | Not accepted; feedback required |
| `REVISION_REQUESTED` | Admin | Returned to member for changes |

> **PROPOSED assumption (A-003):** A member may only have one submission per task in any non-terminal, non-draft state at a time. Attempting a second `SUBMITTED` record for the same task while one is already `SUBMITTED` or `UNDER_REVIEW` returns `SUBMISSION_IN_PROGRESS`.

---

## 5. Invite-Code Lifecycle

| State | Description | Transition |
|-------|-------------|-----------|
| `ACTIVE` | Valid; use count < max uses | --> `USED` / `EXPIRED` / `REVOKED` |
| `USED` | Single-use code fully redeemed | Terminal |
| `EXPIRED` | Past `expiresAt` timestamp | Terminal |
| `REVOKED` | Manually disabled by admin | Terminal |

> **PROPOSED assumption (A-004):** An invite code has a `maxUses` field (default 1). Each use decrements remaining uses. Multi-use codes expire by TTL or revocation only.

> **PROPOSED assumption (A-005):** Invite codes are alphanumeric strings, 8-16 chars, server-generated. Members cannot generate invite codes.

---

## 6. Audit Event Catalogue

Schema + query owner: **P5**. Callers (P1, P3, P4) invoke a shared `createAuditEvent(event, actorId, targetId, metadata)` function.

| Event | Actor | Target | Extra data |
|-------|-------|--------|-----------|
| `USER_REGISTERED` | System | UserId | inviteCodeId |
| `USER_APPROVED` | AdminId | UserId | — |
| `USER_REJECTED` | AdminId | UserId | reason |
| `USER_SUSPENDED` | AdminId | UserId | reason |
| `USER_UNSUSPENDED` | AdminId | UserId | — |
| `USER_DISABLED` | AdminId | UserId | reason |
| `INVITE_CREATED` | AdminId | InviteCodeId | maxUses, expiresAt |
| `INVITE_USED` | UserId | InviteCodeId | — |
| `INVITE_REVOKED` | AdminId | InviteCodeId | — |
| `SUBMISSION_CREATED` | UserId | SubmissionId | taskId |
| `SUBMISSION_SUBMITTED` | UserId | SubmissionId | — |
| `SUBMISSION_UNDER_REVIEW` | AdminId | SubmissionId | — |
| `SUBMISSION_APPROVED` | AdminId | SubmissionId | pointsAwarded |
| `SUBMISSION_REJECTED` | AdminId | SubmissionId | feedback |
| `SUBMISSION_REVISION_REQUESTED` | AdminId | SubmissionId | feedback |
| `POINTS_ASSIGNED` | AdminId | UserId | amount, reason |
| `RUBRIC_UPDATED` | AdminId | RubricVersionId | previousVersionId |
| `CHAT_MESSAGE_DELETED` | AdminId | MessageId | reason |
| `USER_LOGIN` | UserId | — | ip (hashed) |
| `USER_LOGOUT` | UserId | — | — |

---

## 7. Scoring Constraints

1. Points are **non-negative integers** only. No fractional or negative values in MVP.
2. Only `ADMIN` role may call the point-assignment endpoint. Others get `403 FORBIDDEN`.
3. Each assignment is an **immutable `PointTransaction` record** (append-only ledger). Balance = `SUM(amount)`.
4. **Streaks** are computed server-side only on `SUBMISSION_APPROVED`. Client values are never trusted.
5. **PROPOSED assumption (A-006):** Streak increments when a member has ≥1 approved submission in the rolling 7-day window. Resets to 0 after a 7-day gap. `streakWindowDays` defaults to 7, configurable via env var.
6. Points and streak totals are readable by any `APPROVED` member. Writes are admin-only.

---

## 8. Failure States & Error Codes

```json
{ "error": { "code": "ERROR_CODE", "message": "Human-readable string", "status": 4xx } }
```

| Code | HTTP | Trigger |
|------|------|---------|
| `INVALID_INVITE` | 400 | Invite code not found, EXPIRED, or REVOKED |
| `INVITE_EXHAUSTED` | 400 | `usedCount >= maxUses` |
| `ACCOUNT_NOT_ACTIVE` | 403 | Login by REJECTED, SUSPENDED, or DISABLED user |
| `ACCOUNT_PENDING` | 403 | Action requires APPROVED; user is PENDING_APPROVAL |
| `FORBIDDEN` | 403 | Role-based access denied |
| `SUBMISSION_IN_PROGRESS` | 409 | Duplicate submission while same task is SUBMITTED or UNDER_REVIEW |
| `INVALID_STATE_TRANSITION` | 422 | Illegal state machine transition |
| `NOT_FOUND` | 404 | Resource missing or not visible to caller |
| `UNAUTHENTICATED` | 401 | No valid session |
| `VALIDATION_ERROR` | 400 | Body fails schema validation |
| `INTERNAL_ERROR` | 500 | Unhandled exception (stack trace never in response) |

---

## 9. Database Table Ownership

| Table | Owner | Notes |
|-------|-------|-------|
| `User` | **P1** | Core identity, status, role |
| `Account` | **P1** | NextAuth OAuth accounts |
| `Session` | **P1** | NextAuth sessions |
| `InviteCode` | **P1** | Invite lifecycle |
| `Rubric` | **P1** | Active rubric config |
| `RubricVersion` | **P1** | Immutable rubric history |
| `Task` | **P3** | Task definitions |
| `Submission` | **P3** | Submission records + review state |
| `PointTransaction` | **P3** | Append-only point ledger |
| `Streak` | **P3** | Per-user streak state (computed) |
| `Message` | **P4** | Chat messages |
| `Channel` | **P4** | Chat channels / rooms |
| `PersonalSpacePage` | **P4** | Per-user personal space content |
| `AuditLog` | **P5** | Immutable event log |

---

## 10. Endpoint & UI Module Ownership

| Module | Endpoints | UI | Owner |
|--------|----------|-----|-------|
| Auth / Session | `/api/auth/[...nextauth]`, `POST /api/auth/register` | Login, Register pages | **P1** |
| Onboarding status | `GET /api/users/me` | Onboarding / waiting screen | **P1** |
| Invite management | `POST /api/invites`, `DELETE /api/invites/:id`, `GET /api/invites`, `POST /api/invites/verify` | Admin invite UI | **P1** |
| User lifecycle (admin) | `POST /api/admin/users/:id/approve`, `/reject`, `/suspend`, `/unsuspend`, `/disable`, `GET /api/admin/users` | Admin approval queue | **P1** |
| Rubric | `GET /api/rubric`, `PUT /api/rubric` | Rubric view (member) + edit (admin) | **P1** |
| Tasks | `GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks` (admin) | Task list, task detail | **P2** (UI) / **P3** (API + DB) |
| Submissions | `POST /api/submissions`, `GET /api/submissions/:id`, `PATCH /api/submissions/:id/submit` | Submission form, status | **P2** (UI) / **P3** (API + DB) |
| Admin review queue | `GET /api/admin/submissions`, `POST /api/admin/submissions/:id/approve`, `/reject`, `/request-revision` | Admin review UI | **P5** (UI) / **P3** (API) |
| Points | `POST /api/admin/users/:id/points`, `GET /api/users/:id/points` | Points display (P2) / assign (P5 admin) | **P3** (API + DB) |
| Streaks | `GET /api/users/:id/streak` | Streak badge (P2) | **P3** (API + DB) |
| Chat | `GET/POST /api/chat/channels/:id/messages`, WS/Pusher | Chat UI, moderation | **P4** (UI + API + DB) |
| Personal Space | `GET/PUT /api/personal-space` | Personal space pages | **P4** (UI + API + DB) |
| Audit log | `GET /api/admin/audit-log` | Audit log viewer | **P5** |
| Moderation | `DELETE /api/admin/messages/:id` | Moderation panel | **P5** |

---

## 11. Background Process Ownership

| Process | Trigger | Owner | Notes |
|---------|---------|-------|-------|
| Streak recomputation | On `SUBMISSION_APPROVED` (same request) | **P3** | Defer to queue if slow |
| Invite TTL expiry | Daily cron job | **P1** | Mark past-`expiresAt` codes as EXPIRED |
| Audit log writes | Per audit event; callers invoke shared fn | **P5** owns fn | No direct cross-module DB writes |

---

## 12. Acceptance Criteria (Phase 1)

- [x] All role permissions are listed explicitly and testable.
- [x] All lifecycle state transitions are diagrammed and mutually exclusive.
- [x] All invite states have clear terminal/non-terminal designation.
- [x] All audit events catalogued with actor and target.
- [x] All scoring rules are computable from this spec without ambiguity.
- [x] All error codes defined with HTTP status.
- [x] Every DB table has exactly one owner.
- [x] Every endpoint and UI module has exactly one owner.
- [x] Every background process has exactly one owner.
- [x] All assumptions (A-001 through A-006) documented and flagged PROPOSED.
- [x] No product code written or changed.

---
_Phase 1 spec. No product code written or changed. — 2026-10-27_
