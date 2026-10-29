import type { SessionUser } from "@/lib/auth/types";

export type Difficulty = "Easy" | "Medium" | "Hard";
export interface Todo {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  priority: "Low" | "Medium" | "High";
  dueDate: string;
  completed: boolean;
}
export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}
export interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
}
export interface Profile {
  name: string;
  handle: string;
  bio: string;
  skills: string[];
  currentProject: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  avatarUrl: string;
}
export interface PublicMemberDetail {
  profile: Profile;
  isDemo: boolean;
}
export interface Settings {
  theme: "light" | "dark";
  reviewNotifications: boolean;
  streakReminder: boolean;
  chatNotifications: boolean;
  showPortfolio: boolean;
}
export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  kind: "image" | "video" | "file";
  url: string;
}
export interface ChatMessage {
  id: string;
  authorId: string;
  author: string;
  content: string;
  createdAt: string;
  edited: boolean;
  pinned: boolean;
  attachments?: ChatAttachment[];
}
export interface WorkspaceData {
  user: SessionUser;
  profile: Profile;
  settings: Settings;
  todos: Todo[];
  notes: Note[];
  goals: Goal[];
  messages: ChatMessage[];
}
export type WorkspaceResource = "todos" | "notes" | "goals" | "profile" | "settings" | "messages";
export interface WorkspaceMutation {
  resource: WorkspaceResource;
  operation: "create" | "update" | "delete" | "pin";
  id?: string;
  data?: Record<string, unknown>;
}
export function todayIST() {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
}
