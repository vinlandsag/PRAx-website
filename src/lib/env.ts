/**
 * src/lib/env.ts
 *
 * Centralised environment variable access.
 * All env vars must be declared here and accessed from this module,
 * never from process.env directly in feature code.
 *
 * Variables marked REQUIRED will throw at startup if missing in production.
 */

function required(key: string): string {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? "";
}

function optional(key: string, defaultValue = ""): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),

  // Auth (NextAuth.js — pending D-004)
  nextauthUrl: required("NEXTAUTH_URL"),
  nextauthSecret: required("NEXTAUTH_SECRET"),

  // Database (pending D-005)
  databaseUrl: required("DATABASE_URL"),

  // App
  appUrl: optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),

  // Streak configuration (A-006)
  streakWindowDays: parseInt(optional("STREAK_WINDOW_DAYS", "7"), 10),
} as const;
