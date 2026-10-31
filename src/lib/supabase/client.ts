/**
 * src/lib/supabase/client.ts
 *
 * Browser-side Supabase client for interactive components.
 * Utilizes public anonymous key and conforms to Database schema types.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "./types";

let clientInstance: SupabaseClient<Database> | null = null;

export function normalizeSupabaseUrl(url: string): string {
  if (!url) return "https://placeholder-project.supabase.co";
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  }
}

/**
 * Returns a typed Supabase client for browser usage.
 * If credentials are not yet configured in .env.local, returns a client instance with placeholders.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (clientInstance) {
    return clientInstance;
  }

  const url = normalizeSupabaseUrl(env.supabaseUrl);
  const anonKey = env.supabaseAnonKey || "placeholder-anon-key";

  clientInstance = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return clientInstance;
}

/** Convenience default export for frontend components */
export const supabase = getSupabaseBrowserClient();
