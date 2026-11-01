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
  /** Optional link to a published platform task; null when unlinked or the task is not published. */
  taskId: string | null;
  taskTitle: string | null;
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
/** Fixed reaction palette. The server enforces the same allowlist. */
export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "👀", "🙌"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];
export interface ChatReaction {
  emoji: ReactionEmoji;
  count: number;
  /** True when the signed-in member has used this reaction on the message. */
  reacted: boolean;
}
export interface ChatMessage {
  id: string;
  authorId: string;
  author: string;
  authorAvatarUrl: string;
  content: string;
  createdAt: string;
  edited: boolean;
  pinned: boolean;
  reactions: ChatReaction[];
  attachments?: ChatAttachment[];
}
/** Returned in `ChatFeed.updates` in place of a message that was removed. */
export interface ChatTombstone {
  id: string;
  deleted: true;
}
export interface ChatViewer {
  id: string;
  role: SessionUser["role"];
}
/**
 * Response of GET /api/chat/messages. `messages` are oldest first. `updates` carries changes to
 * messages the client already holds (edits, pins, reactions, removals).
 */
export interface ChatFeed {
  messages: ChatMessage[];
  updates: Array<ChatMessage | ChatTombstone>;
  pinned: ChatMessage[];
  hasMore: boolean;
  nextBefore: string | null;
  rulesAccepted: boolean;
  viewer: ChatViewer;
  serverTime: string;
  /** True when the server could not describe every change; the client must reload the latest page. */
  resync?: boolean;
}
/** Personal Space collections. These belong to the signed-in member only. */
export interface SpaceData {
  todos: Todo[];
  notes: Note[];
  goals: Goal[];
}
export type SpaceResource = "todos" | "notes" | "goals";
export interface SpaceMutation {
  resource: SpaceResource;
  operation: "create" | "update" | "delete";
  id?: string;
  data?: Record<string, unknown>;
}
/** Account data served by /api/workspace. Chat and Personal Space are no longer part of it. */
export interface WorkspaceData {
  user: SessionUser;
  profile: Profile;
  settings: Settings;
}
export type WorkspaceResource = "profile" | "settings";
export interface WorkspaceMutation {
  resource: WorkspaceResource;
  operation: "create" | "update" | "delete";
  id?: string;
  data?: Record<string, unknown>;
}
export function todayIST() {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
}
