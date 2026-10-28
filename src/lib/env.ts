/**
 * src/lib/env.ts
 *
 * Centralised environment variable access.
 * All env vars must be declared here and accessed from this module,
 * never from process.env directly in feature code.
 *
 * Variables marked REQUIRED will throw at startup if missing in production.
 */

function optional(key: string, defaultValue = ""): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),

  // Auth & Session
  nextauthUrl: optional("NEXTAUTH_URL", "http://localhost:3000"),
  nextauthSecret: optional("NEXTAUTH_SECRET", "prax-dev-secret-32-characters-placeholder"),
  sessionSecret: optional(
    "SESSION_SECRET",
    optional("NEXTAUTH_SECRET", "prax-default-dev-session-secret-change-in-prod-32chars")
  ),

  // Database (pending D-005)
  databaseUrl: optional("DATABASE_URL", "postgresql://localhost:5432/prax"),

  // App
  appUrl: optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),

  // Streak configuration (A-006)
  streakWindowDays: parseInt(optional("STREAK_WINDOW_DAYS", "7"), 10),
} as const;
