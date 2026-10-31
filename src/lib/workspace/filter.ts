import type { TaskItem } from "./catalog";
import type { WorkspaceData, Todo } from "./types";
import { todayIST } from "./types";

export function filterTasks(
  query: string,
  category: string,
  status: string,
  sort: string,
  tasks: TaskItem[] = []
) {
  const wanted: Record<string, TaskItem["status"]> = {
    open: "Open",
    submitted: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  };
  const q = query.trim().toLowerCase();
  return tasks
    .filter(
      (task) =>
        (!wanted[status] || task.status === wanted[status]) &&
        (category === "all" || task.category === category) &&
        (!q || `${task.title} ${task.description} ${task.category}`.toLowerCase().includes(q))
    )
    .sort((a, b) =>
      sort === "points"
        ? b.pointsMax - a.pointsMax
        : sort === "deadline"
          ? (Date.parse(a.dueAt || "") || Infinity) - (Date.parse(b.dueAt || "") || Infinity)
          : (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0)
    );
}
export function filterTodos(
  todos: Todo[],
  filter: string,
  difficulty: string,
  query: string,
  today = todayIST()
) {
  const q = query.trim().toLowerCase();
  return todos.filter(
    (t) =>
      (filter === "done"
        ? t.completed
        : filter === "today"
          ? !t.completed && !!t.dueDate && t.dueDate <= today
          : filter === "upcoming"
            ? !t.completed && t.dueDate > today
            : true) &&
      (difficulty === "all" || t.difficulty === difficulty) &&
      `${t.title} ${t.description}`.toLowerCase().includes(q)
  );
}
export interface SearchResult {
  id: string;
  title: string;
  section: string;
  href: string;
}
export function searchWorkspace(
  query: string,
  data: WorkspaceData | null,
  tasks: TaskItem[] = []
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const pages = [
    ["Dashboard", "/dashboard"],
    ["Tasks", "/tasks"],
    ["My submissions", "/submissions"],
    ["Personal Space", "/space"],
    ["Leaderboard", "/leaderboard"],
    ["Streaks", "/streaks"],
    ["Community chat", "/chat"],
    ["My profile", "/profile"],
    ["Settings", "/settings"],
  ];
  if (data?.user.role === "ADMIN")
    pages.push(["Review queue", "/admin"], ["Member management", "/admin/members"]);
  const results: SearchResult[] = pages
    .filter(([title]) => title.toLowerCase().includes(q))
    .map(([title, href]) => ({ id: href, title, href, section: "Pages" }));
  results.push(
    ...tasks
      .filter((t) => `${t.title} ${t.category} ${t.description}`.toLowerCase().includes(q))
      .map((t) => ({
        id: `task-${t.id}`,
        title: t.title,
        href: `/tasks/${t.id}`,
        section: "Tasks",
      }))
  );
  if (data)
    for (const resource of ["todos", "notes", "goals"] as const)
      for (const item of data[resource])
        if (
          `${item.title} ${"description" in item ? item.description : item.content}`
            .toLowerCase()
            .includes(q)
        )
          results.push({
            id: `${resource}-${item.id}`,
            title: item.title,
            href: `/space?tab=${resource}&item=${encodeURIComponent(item.id)}`,
            section:
              resource === "todos"
                ? "Your to-dos"
                : resource === "notes"
                  ? "Your notes"
                  : "Your goals",
          });
  return results.slice(0, 20);
}
