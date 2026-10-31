/**
 * src/lib/supabase/types.ts
 *
 * TypeScript Database Definitions for Supabase.
 * Matches the PostgreSQL schema defined in supabase/migrations/20261031000000_prax_schema.sql.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "MEMBER" | "ADMIN";
export type UserStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED" | "DISABLED";
export type SubmissionStatus =
  "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
export type InviteStatus = "ACTIVE" | "USED" | "EXPIRED" | "REVOKED";
export type TaskDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type NotificationType =
  "INFO" | "SUCCESS" | "WARNING" | "SUBMISSION_REVIEWED" | "POINTS_EARNED";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string | null;
          name: string;
          role: UserRole;
          status: UserStatus;
          rejection_reason: string | null;
          suspension_reason: string | null;
          disable_reason: string | null;
          avatar_url: string | null;
          headline: string | null;
          bio: string | null;
          portfolio_url: string | null;
          github_url: string | null;
          linkedin_url: string | null;
          skills: string[];
          currently_building: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash?: string | null;
          name: string;
          role?: UserRole;
          status?: UserStatus;
          rejection_reason?: string | null;
          suspension_reason?: string | null;
          disable_reason?: string | null;
          avatar_url?: string | null;
          headline?: string | null;
          bio?: string | null;
          portfolio_url?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          skills?: string[];
          currently_building?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string | null;
          name?: string;
          role?: UserRole;
          status?: UserStatus;
          rejection_reason?: string | null;
          suspension_reason?: string | null;
          disable_reason?: string | null;
          avatar_url?: string | null;
          headline?: string | null;
          bio?: string | null;
          portfolio_url?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          skills?: string[];
          currently_building?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invite_codes: {
        Row: {
          id: string;
          code: string;
          status: InviteStatus;
          max_uses: number;
          used_count: number;
          created_by_id: string | null;
          expires_at: string | null;
          revoked_at: string | null;
          revoked_by_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          status?: InviteStatus;
          max_uses?: number;
          used_count?: number;
          created_by_id?: string | null;
          expires_at?: string | null;
          revoked_at?: string | null;
          revoked_by_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          status?: InviteStatus;
          max_uses?: number;
          used_count?: number;
          created_by_id?: string | null;
          expires_at?: string | null;
          revoked_at?: string | null;
          revoked_by_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      magic_link_tokens: {
        Row: {
          id: string;
          email: string;
          token_hash: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          token_hash: string;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          token_hash?: string;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rubrics: {
        Row: {
          id: string;
          version: string;
          title: string;
          criteria: Json;
          max_points: number;
          updated_by_id: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          version?: string;
          title: string;
          criteria?: Json;
          max_points: number;
          updated_by_id?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          version?: string;
          title?: string;
          criteria?: Json;
          max_points?: number;
          updated_by_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      rubric_versions: {
        Row: {
          id: string;
          version: string;
          title: string;
          criteria: Json;
          max_points: number;
          created_by_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          version: string;
          title: string;
          criteria?: Json;
          max_points: number;
          created_by_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          version?: string;
          title?: string;
          criteria?: Json;
          max_points?: number;
          created_by_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          difficulty: TaskDifficulty;
          max_points: number;
          rules: string[];
          is_active: boolean;
          created_by_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: string;
          difficulty?: TaskDifficulty;
          max_points: number;
          rules?: string[];
          is_active?: boolean;
          created_by_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          difficulty?: TaskDifficulty;
          max_points?: number;
          rules?: string[];
          is_active?: boolean;
          created_by_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          status: SubmissionStatus;
          proof_url: string | null;
          note: string | null;
          code_snippet: string | null;
          checklist: string[];
          points_awarded: number | null;
          rubric_version: string | null;
          transaction_id: string | null;
          feedback: string | null;
          reviewed_by_id: string | null;
          reviewed_at: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          status?: SubmissionStatus;
          proof_url?: string | null;
          note?: string | null;
          code_snippet?: string | null;
          checklist?: string[];
          points_awarded?: number | null;
          rubric_version?: string | null;
          transaction_id?: string | null;
          feedback?: string | null;
          reviewed_by_id?: string | null;
          reviewed_at?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          status?: SubmissionStatus;
          proof_url?: string | null;
          note?: string | null;
          code_snippet?: string | null;
          checklist?: string[];
          points_awarded?: number | null;
          rubric_version?: string | null;
          transaction_id?: string | null;
          feedback?: string | null;
          reviewed_by_id?: string | null;
          reviewed_at?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      point_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string;
          idempotency_key: string;
          submission_id: string | null;
          admin_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          reason: string;
          idempotency_key: string;
          submission_id?: string | null;
          admin_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          reason?: string;
          idempotency_key?: string;
          submission_id?: string | null;
          admin_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      streaks: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      channels: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_private: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_private?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_private?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          channel_id: string;
          user_id: string;
          content: string;
          attachments: Json;
          is_deleted: boolean;
          deleted_by_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          channel_id: string;
          user_id: string;
          content: string;
          attachments?: Json;
          is_deleted?: boolean;
          deleted_by_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          user_id?: string;
          content?: string;
          attachments?: Json;
          is_deleted?: boolean;
          deleted_by_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      personal_space_pages: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          blocks: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content?: string;
          blocks?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          blocks?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          event: string;
          actor_id: string;
          target_id: string | null;
          prior_state: string | null;
          new_state: string | null;
          reason: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event: string;
          actor_id: string;
          target_id?: string | null;
          prior_state?: string | null;
          new_state?: string | null;
          reason?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event?: string;
          actor_id?: string;
          target_id?: string | null;
          prior_state?: string | null;
          new_state?: string | null;
          reason?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          read: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: NotificationType;
          read?: boolean;
          link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: NotificationType;
          read?: boolean;
          link?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      user_leaderboard: {
        Row: {
          user_id: string;
          name: string;
          avatar_url: string | null;
          headline: string | null;
          total_points: number;
          weekly_points: number;
          current_streak: number;
          longest_streak: number;
          all_time_rank: number;
          weekly_rank: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      submission_status: SubmissionStatus;
      invite_status: InviteStatus;
      task_difficulty: TaskDifficulty;
      notification_type: NotificationType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
