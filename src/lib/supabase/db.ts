/**
 * src/lib/supabase/db.ts
 *
 * High-level typed data access helpers for PRAX Platform.
 * Simplifies querying users, tasks, submissions, points, and chat.
 */

import { getSupabaseAdminClient } from "./server";
import type { Database } from "./types";

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];
export type PointTransactionRow = Database["public"]["Tables"]["point_transactions"]["Row"];
export type RubricRow = Database["public"]["Tables"]["rubrics"]["Row"];
export type ChannelRow = Database["public"]["Tables"]["channels"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type LeaderboardRow = Database["public"]["Views"]["user_leaderboard"]["Row"];

export const db = {
  // --------------------------------------------------------------------------
  // Users
  // --------------------------------------------------------------------------
  async getUserById(id: string): Promise<UserRow | null> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async getUserByEmail(email: string): Promise<UserRow | null> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // --------------------------------------------------------------------------
  // Tasks
  // --------------------------------------------------------------------------
  async getActiveTasks(): Promise<TaskRow[]> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getTaskById(id: string): Promise<TaskRow | null> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("tasks").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  // --------------------------------------------------------------------------
  // Rubric
  // --------------------------------------------------------------------------
  async getActiveRubric(): Promise<RubricRow | null> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("rubrics")
      .select("*")
      .eq("id", "active")
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // --------------------------------------------------------------------------
  // Submissions
  // --------------------------------------------------------------------------
  async getUserSubmissions(userId: string): Promise<SubmissionRow[]> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getReviewQueue(): Promise<SubmissionRow[]> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .in("status", ["SUBMITTED", "UNDER_REVIEW"])
      .order("submitted_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  // --------------------------------------------------------------------------
  // Leaderboard
  // --------------------------------------------------------------------------
  async getLeaderboard(): Promise<LeaderboardRow[]> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("user_leaderboard")
      .select("*")
      .order("total_points", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  // --------------------------------------------------------------------------
  // Chat
  // --------------------------------------------------------------------------
  async getChannels(): Promise<ChannelRow[]> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("channels").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },

  async getChannelMessages(channelId: string, limit = 50): Promise<MessageRow[]> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  // --------------------------------------------------------------------------
  // Audit Logs
  // --------------------------------------------------------------------------
  async createAuditLog(entry: {
    event: string;
    actor_id: string;
    target_id?: string | null;
    prior_state?: string | null;
    new_state?: string | null;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const insertPayload: Database["public"]["Tables"]["audit_logs"]["Insert"] = {
      event: entry.event,
      actor_id: entry.actor_id,
      target_id: entry.target_id ?? null,
      prior_state: entry.prior_state ?? null,
      new_state: entry.new_state ?? null,
      reason: entry.reason ?? null,
      metadata: (entry.metadata ??
        {}) as Database["public"]["Tables"]["audit_logs"]["Insert"]["metadata"],
    };
    const { error } = await supabase.from("audit_logs").insert(insertPayload);
    if (error) {
      console.error("Failed to write audit log:", error);
    }
  },
};
