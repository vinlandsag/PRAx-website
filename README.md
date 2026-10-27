# PRAX — Developer Setup Guide

PRAX is an invite-only team platform built with Next.js 16, TypeScript, Tailwind CSS v4, and PostgreSQL via Prisma.

---

## Prerequisites

| Tool       | Required version               | Check            |
| ---------- | ------------------------------ | ---------------- |
| Node.js    | ≥ 20 (v24 recommended)         | `node --version` |
| npm        | ≥ 10                           | `npm --version`  |
| Git        | any                            | `git --version`  |
| PostgreSQL | 16 (see D-005 in DECISIONS.md) | varies by host   |

---

## Quick Start

### 1. Clone the repo

```bash
git clone <repo-url> PRAx
cd PRAx
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in real values:

| Variable              | Description                                             |
| --------------------- | ------------------------------------------------------- |
| `NEXTAUTH_SECRET`     | Random secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL`        | App URL, e.g. `http://localhost:3000`                   |
| `DATABASE_URL`        | PostgreSQL connection string                            |
| `NEXT_PUBLIC_APP_URL` | Public app URL (same as `NEXTAUTH_URL` locally)         |
| `STREAK_WINDOW_DAYS`  | Rolling window for streak computation (default: `7`)    |

> ⚠️ **Never commit `.env.local` or any file with real secrets.**  
> `.env.local` is already in `.gitignore`.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Verify the health route

```bash
curl http://localhost:3000/api/health
# Expected: { "status": "ok", "timestamp": "...", "env": "development" }
```

---

## Available Commands

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `npm run dev`           | Start dev server (Turbopack)           |
| `npm run build`         | Production build                       |
| `npm run start`         | Start production server                |
| `npm run lint`          | ESLint                                 |
| `npm run lint:fix`      | ESLint with auto-fix                   |
| `npm run format`        | Prettier (write)                       |
| `npm run format:check`  | Prettier (check only, used in CI)      |
| `npm run typecheck`     | TypeScript type check (`tsc --noEmit`) |
| `npm run test`          | Run unit tests (Vitest, single run)    |
| `npm run test:watch`    | Run unit tests in watch mode           |
| `npm run test:coverage` | Run unit tests with coverage report    |

---

## CI Checks (must all pass before merge)

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
```

---

## Project Structure

```
/PRAx
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── health/route.ts   ← Health check (no auth)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       ├── env.ts                ← Centralised env var access
│       ├── errors.ts             ← Shared API error utilities
│       └── errors.test.ts        ← Unit tests for errors lib
├── public/
├── .env.example                  ← Copy to .env.local and fill in
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
│
├── AGENTS.md                     ← Agent rules (read before any change)
├── MVP_SPEC.md                   ← Product specification
├── API_CONTRACTS.md              ← API contracts
├── DECISIONS.md                  ← Architecture decisions
└── PROJECT_STATE.md              ← Current state
```

---

## Adding a New API Route

1. Create `src/app/api/<path>/route.ts`.
2. Import error helpers from `@/lib/errors`.
3. Import env vars from `@/lib/env`.
4. Add a unit test in the same directory as `route.test.ts`.
5. Update `API_CONTRACTS.md` with the new endpoint shape.

---

## Key Documents

| File                                   | Purpose                                       |
| -------------------------------------- | --------------------------------------------- |
| [MVP_SPEC.md](./MVP_SPEC.md)           | Roles, lifecycle states, scoring, error codes |
| [API_CONTRACTS.md](./API_CONTRACTS.md) | Full endpoint contracts                       |
| [DECISIONS.md](./DECISIONS.md)         | Architecture decisions and assumptions        |
| [AGENTS.md](./AGENTS.md)               | Rules every coding agent must follow          |
| [TODO_NEXT.md](./TODO_NEXT.md)         | Prioritised task list                         |

---

## Database Setup (Phase 3 — not yet available)

Prisma will be added in Phase 3. Once available:

```bash
npx prisma migrate dev    # Apply migrations
npx prisma studio         # Browse data locally
```

---

## Troubleshooting

**`NEXTAUTH_SECRET` missing error in production**  
→ Ensure `NEXTAUTH_SECRET` is set in your deployment environment.

**`DATABASE_URL` not set**  
→ Copy `.env.example` to `.env.local` and set a valid PostgreSQL URL.

**TypeScript errors in `.next/`**  
→ Run `npm run build` once to generate route types, then retry `npm run typecheck`.
