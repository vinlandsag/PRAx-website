/**
 * src/lib/supabase/server.ts
 *
 * Server-side Supabase client for Next.js App Router API route handlers and server actions.
 * Provides administrative service-role access (bypassing RLS) when service key is present.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { normalizeSupabaseUrl } from "./client";
import type { Database } from "./types";

let adminClientInstance: SupabaseClient<Database> | null = null;
let serverClientInstance: SupabaseClient<Database> | null = null;

/**
 * Returns an administrative Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Never expose this client or its key to the browser!
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> {
  if (adminClientInstance) {
    return adminClientInstance;
  }

  const url = normalizeSupabaseUrl(env.supabaseUrl);
  const key = env.supabaseServiceRoleKey || env.supabaseAnonKey || "placeholder-service-key";

  adminClientInstance = createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClientInstance;
}

/**
 * Returns a standard server-side client using the public anon key.
 */
export function getSupabaseServerClient(): SupabaseClient<Database> {
  if (serverClientInstance) {
    return serverClientInstance;
  }

  const url = normalizeSupabaseUrl(env.supabaseUrl);
  const anonKey = env.supabaseAnonKey || "placeholder-anon-key";

  serverClientInstance = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverClientInstance;
}
