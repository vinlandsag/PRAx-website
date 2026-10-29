import { randomUUID } from "node:crypto";
import type { SessionUser } from "@/lib/auth/types";
import { isSafeUrl } from "@/lib/utils/url";
import { createAuditEvent } from "@/lib/audit/audit";
import type {
  WorkspaceData,
  WorkspaceMutation,
  Todo,
  Note,
  Goal,
  ChatMessage,
  Profile,
  Settings,
} from "./types";
import { todayIST } from "./types";

import { WorkspaceError } from "./error";
export { WorkspaceError } from "./error";
import { attachmentStore } from "./attachment-store";

function text(value: unknown, label: string, max: number, required = false) {
  if (typeof value !== "string" || value.trim().length > max || (required && !value.trim()))
    throw new WorkspaceError(
      `${label} ${required ? "is required and " : ""}must be at most ${max} characters.`
    );
  return value.trim();
}
function link(value: unknown) {
  const result = text(value, "Link", 2048);
  if (result && !isSafeUrl(result))
    throw new WorkspaceError("Use a full http:// or https:// link.");
  return result;
}
const defaults: Settings = {
  theme: "light",
  reviewNotifications: true,
  streakReminder: true,
  chatNotifications: false,
  showPortfolio: true,
};
type PrivateData = Pick<WorkspaceData, "profile" | "settings" | "todos" | "notes" | "goals">;
function defaultProfile(user: SessionUser): Profile {
  return {
    name: user.name,
    handle:
      user.id === "usr_member_01"
        ? "@arjunbuilds"
        : "@builder_" + user.id.replace(/[^a-zA-Z0-9_]/g, "").slice(-12),
    bio:
      user.id === "usr_member_01"
        ? "Building useful things, learning in public, and sharing the process."
        : "",
    skills: user.id === "usr_member_01" ? ["Frontend", "Backend"] : [],
    currentProject: "",
    portfolioUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    avatarUrl: "",
  };
}
class WorkspaceStore {
  private users = new Map<string, PrivateData>();
  private messages: ChatMessage[] = [
    {
      id: "welcome",
      authorId: "usr_admin_01",
      author: "Admin User",
      content: "Share your work, give useful feedback, stay kind.",
      createdAt: "2026-10-28T10:00:00.000Z",
      edited: false,
      pinned: true,
    },
    {
      id: "intro",
      authorId: "demo_meera",
      author: "Meera Shah",
      content: "Anyone working on the landing page challenge? Happy to swap feedback.",
      createdAt: "2026-10-28T10:05:00.000Z",
      edited: false,
      pinned: false,
    },
  ];
  private own(user: SessionUser) {
    if (!this.users.has(user.id))
      this.users.set(user.id, {
        profile: defaultProfile(user),
        settings: { ...defaults },
        todos: [
          {
            id: "starter-todo",
            title: "Plan your next small project",
            description:
              "Add a description, choose difficulty and a due date, then track your progress.",
            difficulty: "Easy",
            priority: "Medium",
            dueDate: todayIST(),
            completed: false,
          },
        ],
        notes: [
          {
            id: "starter-note",
            title: "Project ideas",
            content: "Capture research links, ideas and lessons here.",
            updatedAt: new Date().toISOString(),
          },
        ],
        goals: [
          {
            id: "starter-goal",
            title: "Ship three side projects",
            description: "Track your own progress without affecting platform points.",
            progress: 0,
          },
        ],
      });
    return this.users.get(user.id)!;
  }
  get(user: SessionUser): WorkspaceData {
    const own = this.own(user);
    return structuredClone({
      user: { ...user, name: own.profile.name },
      ...own,
      messages: this.messages.map((m) =>
        this.users.has(m.authorId) ? { ...m, author: this.users.get(m.authorId)!.profile.name } : m
      ),
    });
  }
  publicProfile(user: SessionUser): Profile {
    const own = this.users.get(user.id),
      profile = own?.profile ?? defaultProfile(user);
    return {
      ...structuredClone(profile),
      portfolioUrl: own?.settings.showPortfolio === false ? "" : profile.portfolioUrl,
    };
  }
  mutate(user: SessionUser, mutation: WorkspaceMutation) {
    const own = this.own(user);
    const { resource, operation, id } = mutation;
    const data = mutation.data || {};
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new WorkspaceError("Invalid fields.");
    if (resource === "profile") {
      if (operation !== "update") throw new WorkspaceError("Invalid profile operation.");
      const next: Profile = { ...own.profile };
      for (const key of Object.keys(data)) {
        if (key === "name") next.name = text(data[key], "Display name", 100, true);
        else if (key === "handle") {
          const handle = text(data[key], "Handle", 50, true);
          if (!/^@[a-zA-Z0-9_]{2,49}$/.test(handle))
            throw new WorkspaceError("Use @ followed by 2–49 letters, numbers or underscores.");
          next.handle = handle;
        } else if (key === "bio") next.bio = text(data[key], "Bio", 500);
        else if (key === "currentProject")
          next.currentProject = text(data[key], "Current project", 200);
        else if (["portfolioUrl", "githubUrl", "linkedinUrl", "avatarUrl"].includes(key))
          next[key as "portfolioUrl" | "githubUrl" | "linkedinUrl" | "avatarUrl"] = link(data[key]);
        else if (key === "skills") {
          if (!Array.isArray(data.skills) || data.skills.length > 15)
            throw new WorkspaceError("Use up to 15 skills.");
          next.skills = [...new Set(data.skills.map((s) => text(s, "Skill", 40, true)))];
        } else throw new WorkspaceError("Unsupported profile field.");
      }
      own.profile = next;
    } else if (resource === "settings") {
      if (operation !== "update") throw new WorkspaceError("Invalid settings operation.");
      const next = { ...own.settings };
      for (const key of Object.keys(data)) {
        if (key === "theme") {
          if (data.theme !== "light" && data.theme !== "dark")
            throw new WorkspaceError("Choose light or dark theme.");
          next.theme = data.theme;
        } else if (
          ["reviewNotifications", "streakReminder", "chatNotifications", "showPortfolio"].includes(
            key
          ) &&
          typeof data[key] === "boolean"
        )
          next[key as Exclude<keyof Settings, "theme">] = data[key] as boolean;
        else throw new WorkspaceError("Unsupported settings field.");
      }
      own.settings = next;
    } else if (resource === "messages") {
      const message = this.messages.find((m) => m.id === id);
      if (operation === "create") {
        if (Object.keys(data).some((key) => !["content", "attachmentIds"].includes(key)))
          throw new WorkspaceError("Unsupported message field.");
        const content = text(data.content ?? "", "Message", 500);
        const ids = data.attachmentIds ?? [];
        if (!content && (!Array.isArray(ids) || !ids.length))
          throw new WorkspaceError("Add a message or an attachment.");
        const messageId = randomUUID(),
          attachments = attachmentStore.claim(ids, user.id, messageId);
        this.messages.push({
          id: messageId,
          authorId: user.id,
          author: own.profile.name,
          content,
          createdAt: new Date().toISOString(),
          edited: false,
          pinned: false,
          attachments,
        });
        const removed = this.messages.slice(0, Math.max(0, this.messages.length - 500));
        removed.forEach((message) => attachmentStore.removeMessage(message.id));
        this.messages = this.messages.slice(-500);
      } else {
        if (!message) throw new WorkspaceError("Message not found.", 404);
        if (operation === "pin") {
          if (user.role !== "ADMIN")
            throw new WorkspaceError("Only admins can pin community messages.", 403);
          message.pinned = !message.pinned;
          createAuditEvent(
            message.pinned ? "CHAT_MESSAGE_PINNED" : "CHAT_MESSAGE_UNPINNED",
            user.id,
            {
              targetId: message.id,
              newState: message.pinned ? "PINNED" : "UNPINNED",
              metadata: { authorId: message.authorId },
            }
          );
        } else if (operation === "update") {
          if (message.authorId !== user.id)
            throw new WorkspaceError("You can only edit your own messages.", 403);
          message.content = text(data.content, "Message", 500, !message.attachments?.length);
          message.edited = true;
        } else if (operation === "delete") {
          if (message.authorId !== user.id && user.role !== "ADMIN")
            throw new WorkspaceError("You can only delete your own messages.", 403);
          this.messages = this.messages.filter((m) => m.id !== id);
          attachmentStore.removeMessage(message.id);
          createAuditEvent("CHAT_MESSAGE_DELETED", user.id, {
            targetId: message.id,
            priorState: "VISIBLE",
            newState: "DELETED",
            metadata: { authorId: message.authorId },
          });
        } else throw new WorkspaceError("Unsupported message operation.");
      }
    } else if (["todos", "notes", "goals"].includes(resource)) {
      const key = resource as "todos" | "notes" | "goals";
      const list = own[key];
      const index = list.findIndex((item) => item.id === id);
      if (operation === "delete") {
        if (index < 0) throw new WorkspaceError("Item not found.", 404);
        list.splice(index, 1);
      } else if (operation === "create" || operation === "update") {
        if (operation === "update" && index < 0) throw new WorkspaceError("Item not found.", 404);
        if (operation === "create" && list.length >= 100)
          throw new WorkspaceError("Keep at most 100 items per section.");
        const allowed =
          key === "todos"
            ? ["title", "description", "difficulty", "priority", "dueDate", "completed"]
            : key === "notes"
              ? ["title", "content"]
              : ["title", "description", "progress"];
        if (Object.keys(data).some((k) => !allowed.includes(k)))
          throw new WorkspaceError("Unsupported item field.");
        const previous = operation === "update" ? list[index] : {};
        const values: Record<string, unknown> = { ...previous, ...data };
        const title = text(values.title, "Title", 200, true);
        const itemId = operation === "create" ? randomUUID() : id!;
        let item: Todo | Note | Goal;
        if (key === "todos") {
          const difficulty = values.difficulty ?? "Medium",
            priority = values.priority ?? "Medium",
            completed = values.completed ?? false,
            dueDate = values.dueDate ?? "";
          if (
            !["Easy", "Medium", "Hard"].includes(difficulty as string) ||
            !["Low", "Medium", "High"].includes(priority as string) ||
            typeof completed !== "boolean"
          )
            throw new WorkspaceError("Choose a valid difficulty, priority and status.");
          if (
            typeof dueDate !== "string" ||
            (dueDate &&
              (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
                !Number.isFinite(Date.parse(dueDate)) ||
                new Date(dueDate).toISOString().slice(0, 10) !== dueDate))
          )
            throw new WorkspaceError("Choose a valid due date.");
          item = {
            id: itemId,
            title,
            description: text(values.description ?? "", "Description", 5000),
            difficulty: difficulty as Todo["difficulty"],
            priority: priority as Todo["priority"],
            completed,
            dueDate,
          };
        } else if (key === "notes")
          item = {
            id: itemId,
            title,
            content: text(values.content ?? "", "Note", 5000),
            updatedAt: new Date().toISOString(),
          };
        else {
          const progress = values.progress ?? 0;
          if (
            typeof progress !== "number" ||
            !Number.isInteger(progress) ||
            progress < 0 ||
            progress > 100
          )
            throw new WorkspaceError("Progress must be a whole number from 0 to 100.");
          item = {
            id: itemId,
            title,
            description: text(values.description ?? "", "Description", 5000),
            progress,
          };
        }
        if (operation === "create") (list as (Todo | Note | Goal)[]).unshift(item);
        else (list as (Todo | Note | Goal)[])[index] = item;
      } else throw new WorkspaceError("Unsupported item operation.");
    } else throw new WorkspaceError("Unknown resource.");
    return this.get(user);
  }
  reset() {
    this.users.clear();
    attachmentStore.reset();
    this.messages = this.messages.filter((m) => m.id === "welcome" || m.id === "intro");
  }
}
const root = globalThis as typeof globalThis & { praxWorkspaceStore?: WorkspaceStore };
export const workspaceStore = (root.praxWorkspaceStore ??= new WorkspaceStore());

// Preserve process-local data while replacing stale methods during development reloads.
Object.setPrototypeOf(workspaceStore, WorkspaceStore.prototype);
