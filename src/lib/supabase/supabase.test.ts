import { describe, expect, it } from "vitest";
import { getSupabaseBrowserClient, normalizeSupabaseUrl } from "./client";
import { getSupabaseAdminClient, getSupabaseServerClient } from "./server";
import { db } from "./db";
import { env } from "@/lib/env";

describe("Supabase Client and Database Layer", () => {
  it("normalizes Supabase URLs with paths or trailing slashes", () => {
    expect(normalizeSupabaseUrl("https://myproject.supabase.co/rest/v1/")).toBe(
      "https://myproject.supabase.co"
    );
    expect(normalizeSupabaseUrl("https://myproject.supabase.co/")).toBe(
      "https://myproject.supabase.co"
    );
    expect(normalizeSupabaseUrl("https://myproject.supabase.co")).toBe(
      "https://myproject.supabase.co"
    );
    expect(normalizeSupabaseUrl("")).toBe("https://placeholder-project.supabase.co");
  });

  it("initializes browser client singleton with standard Supabase interface", () => {
    const client1 = getSupabaseBrowserClient();
    const client2 = getSupabaseBrowserClient();

    expect(client1).toBeDefined();
    expect(client1).toBe(client2); // Singleton pattern
    expect(typeof client1.from).toBe("function");
    expect(typeof client1.auth.signUp).toBe("function");
  });

  it("initializes administrative server client with standard Supabase interface", () => {
    const adminClient1 = getSupabaseAdminClient();
    const adminClient2 = getSupabaseAdminClient();

    expect(adminClient1).toBeDefined();
    expect(adminClient1).toBe(adminClient2);
    expect(typeof adminClient1.from).toBe("function");
  });

  it("initializes public server client", () => {
    const serverClient = getSupabaseServerClient();

    expect(serverClient).toBeDefined();
    expect(typeof serverClient.from).toBe("function");
  });

  it("exposes typed database query helpers", () => {
    expect(typeof db.getUserById).toBe("function");
    expect(typeof db.getUserByEmail).toBe("function");
    expect(typeof db.getActiveTasks).toBe("function");
    expect(typeof db.getTaskById).toBe("function");
    expect(typeof db.getActiveRubric).toBe("function");
    expect(typeof db.getUserSubmissions).toBe("function");
    expect(typeof db.getReviewQueue).toBe("function");
    expect(typeof db.getLeaderboard).toBe("function");
    expect(typeof db.getChannels).toBe("function");
    expect(typeof db.getChannelMessages).toBe("function");
    expect(typeof db.createAuditLog).toBe("function");
  });

  it("verifies environment variable definitions and configuration flag", () => {
    expect("isSupabaseConfigured" in env).toBe(true);
    expect(typeof env.isSupabaseConfigured).toBe("boolean");
    expect("supabaseUrl" in env).toBe(true);
    expect("supabaseAnonKey" in env).toBe(true);
    expect("supabaseServiceRoleKey" in env).toBe(true);
  });
});
