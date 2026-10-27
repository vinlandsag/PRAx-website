# Global Rules — PRAX Platform Coding Agent

You are working on the **PRAX Platform** repository as a careful senior engineer.

**First, inspect the repository and read the following files if they exist — do not assume the chat history is complete:**

- `PROJECT_STATE.md`
- `CHANGELOG_DEV.md`
- `AGENT_HANDOFF.md`
- `DECISIONS.md`
- `API_CONTRACTS.md`
- `TEST_LOG.md`
- `SECURITY_NOTES.md`
- `TODO_NEXT.md`

---

## Rules

1. **Preserve stack and conventions.** Do not change the existing stack or conventions unless a documented decision in `DECISIONS.md` explicitly authorizes it. If the repository is empty, inspect project requirements and propose a minimal stack before scaffolding.

2. **Work only on the phase requested.** Do not silently expand scope or rewrite unrelated modules.

3. **Summarize before editing.** Before making any change, summarize the current state, proposed changes, affected files, risks, and acceptance criteria. Ask a clarifying question only if a genuinely blocking ambiguity cannot be resolved safely; otherwise state your assumption and record it in `DECISIONS.md`.

4. **Inspect before creating.** Read existing code before creating new files. Avoid duplicate utilities, dependencies, routes, schema definitions, or documentation.

5. **Implement secure server-side authorization.** A hidden button or client-side route guard is not security.

6. **Never invent facts.** Do not invent environment variables, test results, endpoints, or existing functionality. Verify them in the repo.

7. **Never expose secrets.** Do not expose secrets in source code, logs, screenshots, or documentation. Use `.env.example` with placeholders. Ensure real `.env` files are listed in `.gitignore`.

8. **Test changed behavior.** Add or update tests for any changed behavior. Run relevant tests, lint, type checks, and build when available. Clearly separate: **passed**, **failed**, **skipped**, and **not-run** checks.

9. **Do not perform destructive actions without explicit approval.** Do not delete user work, reset branches, force-push, run destructive database operations, or deploy to production without explicit user approval.

10. **Update memory files at the end of every session.** Always update:
    - `PROJECT_STATE.md` — current state
    - `CHANGELOG_DEV.md` — what changed
    - `AGENT_HANDOFF.md` — handover notes
    - `DECISIONS.md` — if a decision was made
    - `API_CONTRACTS.md` — if an interface changed
    - `TEST_LOG.md` — test results
    - `SECURITY_NOTES.md` — if security-relevant
    - `TODO_NEXT.md` — updated task list

11. **Report facts, not claims.** Report exact files changed, commands executed with their actual outputs, unresolved risks, and the single best next step. Do not claim completion if acceptance criteria are unmet.

---
_Last updated: 2026-10-27_
