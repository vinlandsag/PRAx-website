# CHANGELOG_DEV.md

Chronological record of development changes.

## Format
Each entry must include:
- **Date/Time** (ISO 8601)
- **Phase**
- **Files Changed**
- **Behavior Added/Changed**
- **Commands Run**
- **Test Results**
- **Commit Hash** (if applicable)
- **Known Issues**

---

## 2026-10-27T22:59

### Phase 0 — Initialization
- **Files Changed:** `PROJECT_STATE.md`, `CHANGELOG_DEV.md`, `AGENT_HANDOFF.md`, `DECISIONS.md`, `API_CONTRACTS.md`, `TEST_LOG.md`, `SECURITY_NOTES.md`, `TODO_NEXT.md`, `AGENTS.md`
- **Behavior Added:** Created all required project memory files and global agent rules at repository root.
- **Commands Run:** None
- **Test Results:** N/A
- **Commit Hash:** NONE — git not initialized
- **Known Issues:** Git not initialized; no `.gitignore`.

## 2026-10-27T23:04

### Phase 0 — Repository Reconnaissance
- **Files Changed:** All memory files (updated)
- **Behavior Added:** Executed Phase 0 reconnaissance. Verified repo is empty. Probed runtime environment. Proposed MVP stack. Drafted phased plan (Phases 0–8), 8 cross-person integration contracts (IC-01 to IC-08), and 8 high-risk decisions (R-01 to R-08).
- **Commands Run:**
  - `git status` → `NOT_A_GIT_REPO`
  - `ls -la /Users/apple/milan/PRAx/` → 9 memory files only
  - `node --version` → v24.15.0 | `npm --version` → 11.12.1 | `python3 --version` → 3.9.6
  - `java -version` → OpenJDK 21.0.11 | `brew --version` → 6.0.12 | `sqlite3 --version` → 3.43.2
  - Docker, PostgreSQL, Redis, Go: NOT INSTALLED
- **Test Results:** N/A
- **Commit Hash:** NONE
- **Known Issues:** Git not initialized; PostgreSQL, Docker, Redis not installed.

## 2026-10-27T23:12

### Phase 1 — Product Requirements, Architecture & Interface Contracts
- **Files Changed (new):** `MVP_SPEC.md`
- **Files Changed (updated):** `API_CONTRACTS.md`, `DECISIONS.md`, `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `SECURITY_NOTES.md`, `TODO_NEXT.md`, `CHANGELOG_DEV.md`
- **Behavior Added:**
  - Full MVP specification: roles (Visitor/Member/Admin) with exact permissions
  - User lifecycle states (PENDING_APPROVAL, APPROVED, REJECTED, SUSPENDED, DISABLED) with state machine diagram
  - Submission review states (DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED/REVISION_REQUESTED)
  - Invite-code lifecycle (ACTIVE/USED/EXPIRED/REVOKED)
  - Audit event catalogue (20 events with actor, target, metadata)
  - Scoring constraints (non-negative integer points, server-side streak computation, append-only ledger)
  - Error code catalogue (11 codes with HTTP status)
  - DB table ownership (14 tables, each with single owner)
  - Endpoint and UI module ownership (all 15 modules covered)
  - Background process ownership (3 processes)
  - Full API contracts (IC-01 to IC-08) with request/response shapes
  - 6 documented assumptions (A-001 to A-006)
- **Commands Run:** None
- **Test Results:** N/A — no tests exist
- **Commit Hash:** NONE — git not initialized
- **Known Issues:** All IC contracts are PROPOSED; D-002 to D-006 still pending team approval.

---
