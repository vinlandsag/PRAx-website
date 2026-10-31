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

  // Database (Supabase / Postgres — D-005 / D-016)
  databaseUrl: optional("DATABASE_URL"),
  supabaseUrl: optional("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: optional("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: optional("SUPABASE_SERVICE_ROLE_KEY"),
  get isSupabaseConfigured(): boolean {
    return Boolean(this.supabaseUrl && this.supabaseAnonKey);
  },

  // App
  appUrl: optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),

  // Streak configuration (A-006)
  streakWindowDays: parseInt(optional("STREAK_WINDOW_DAYS", "7"), 10),
} as const;
