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
  nextauthSecret: optional("NEXTAUTH_SECRET"),
  get sessionSecret() {
    return optional("SESSION_SECRET", optional("NEXTAUTH_SECRET"));
  },
  get firstAdminBootstrapToken() {
    return optional("FIRST_ADMIN_BOOTSTRAP_TOKEN");
  },

  // Supabase Postgres: pooled runtime URL and direct migration URL.
  get databaseUrl() {
    return optional("DATABASE_URL");
  },
  get directDatabaseUrl() {
    return optional("DIRECT_URL");
  },

  // App
  appUrl: optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
} as const;
