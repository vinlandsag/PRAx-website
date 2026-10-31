# PRAX frontend

Next.js 16.4.3, React 19.3, TypeScript and Tailwind CSS 4. The frontend, reusable components and design review are implemented. A database, ORM, email delivery and production backend are **not connected**.

## Run locally

Use Node.js 24 and npm. Install dependencies with `npm ci`, then run `npm run dev`. Open http://localhost:3000/login. The local development test account is retained: `member@prax.build` / `MemberPass123!`. It works only with `npm run dev` on localhost/127.0.0.1, using a private configured session secret. Login fields stay blank. Production never accepts this fixture.

Copy `.env.example` to `.env.local`. If connecting the retained signed-session contract, generate a private secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and set `SESSION_SECRET` locally. Never commit that value. No default signing secret is accepted. Database selection and persistence belong to the backend team; setting DATABASE_URL alone does not connect a database.

## Backend handoff

Mock authentication, magic tokens, seeded users, in-memory workspace/uploads/rubric/audit/points stores and fake-success fallbacks have been removed. All unimplemented service routes retain their paths/methods and return HTTP 503 with error.code BACKEND_NOT_CONFIGURED. Protected routes first enforce the existing server-side session/role/status guard (401/403). This is an integration boundary, not a working backend. Production sign-in and persisted actions require backend implementation. The isolated local member test login and its current-user lookup are the only development exceptions; restoring the account does not restore removed mock data or saves. The health route reports backend: not_configured. Logout still clears the session cookie.

Start with authentication and current-user lookup, then workspace and task reads. Replace route bodies with real services while preserving contracts in API_CONTRACTS.md. Real services must recheck current account status, enforce ownership, validate writes and handle persistence/transactions. No preview auth bypass or alternate browser storage is included. Existing browser sessions may no longer validate after removal of default development secrets.

The client request helper is src/lib/api/client.ts, typed resource hook is src/lib/api/use-resource.ts, and read models are src/lib/api/contracts.ts. Workspace/chat/profile/settings controls retain their typed request shapes. Loading, unavailable, retry and empty states do not substitute demonstration data. Notification contracts and read/unread behavior are in src/lib/notifications/types.ts and NotificationBell.tsx; there is no simulated notification feed or delivery service.

## Design system

Tokens: src/app/tokens.css and src/lib/design-tokens.ts. Components: src/components/ui. Local Inter and artwork: public/fonts and public/artwork. The development-only /design-system page includes illustrative component specimens and the live notification control; its specimens are isolated from application data and never appear in production navigation.

## Checks

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. Test-only fixtures are not runtime services. Obsolete integration tests for removed prototype implementations were replaced with tests of the disconnected API boundary, retained authorization/session behavior, frontend states and notifications. See TEST_LOG.md for actual results and limitations.
