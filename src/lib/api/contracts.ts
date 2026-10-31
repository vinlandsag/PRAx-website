import type { TaskItem } from "@/lib/workspace/catalog";
import type { Submission } from "@/lib/db/submissions";
export interface TaskFeed {
  tasks: TaskItem[];
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
}
export interface SubmissionFeed {
  submissions: Submission[];
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
