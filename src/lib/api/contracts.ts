import type { TaskItem } from "@/lib/workspace/catalog";
import type { Submission } from "@/lib/db/submissions";
export interface TaskFeed {
  tasks: TaskItem[];
  pagination?: { limit: number; offset: number; total: number; hasMore: boolean };
}
export interface TaskDetail {
  task: TaskItem;
}
export interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  rank: number;
  streak: number;
}
export interface LeaderboardFeed {
  entries: LeaderboardEntry[];
  total: number;
  pagination: { limit: number; offset: number; total: number; hasMore: boolean };
  currentUser: LeaderboardEntry | null;
  userAhead: LeaderboardEntry | null;
}
export interface SubmissionFeed {
  submissions: Submission[];
  pagination?: { limit: number; offset: number; total: number; hasMore: boolean };
}
export interface DashboardSummary {
  totalPoints: number;
  weeklyRank: number | null;
  dayStreak: number;
  tasksApproved: number;
  activity: { id: string; title: string; createdAt: string }[];
}
export interface StreakSummary {
  current: number;
  longest: number;
  activeDays: string[];
}
