"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Input,
  Modal,
  Notice,
  Progress,
  Select,
  Skeleton,
  Tabs,
  Textarea,
} from "@/components/ui";
import { useSpace } from "@/lib/workspace/use-space";
import { useResource } from "@/lib/api/use-resource";
import type { TaskFeed } from "@/lib/api/contracts";
import { filterTodos } from "@/lib/workspace/filter";
import { todayIST, type Difficulty, type SpaceData, type Todo } from "@/lib/workspace/types";

type Section = "todos" | "notes" | "goals";
type Draft = {
  title: string;
  description: string;
  content: string;
  difficulty: Difficulty;
  priority: Todo["priority"];
  dueDate: string;
  completed: boolean;
  progress: number;
  taskId: string | null;
};
const blank: Draft = {
  title: "",
  description: "",
  content: "",
  difficulty: "Medium",
  priority: "Medium",
  dueDate: "",
  completed: false,
  progress: 0,
  taskId: null,
};
// /api/tasks allows at most 100 items per page (MAX_PAGE_SIZE in src/lib/api/pagination.ts).
const TASK_OPTIONS_PATH = "/api/tasks?limit=100";
export default function PersonalSpacePage() {
  return (
    <Suspense fallback={<Skeleton className="h-48" label="Loading personal space" />}>
      <SpaceLoader />
    </Suspense>
  );
}
function SpaceLoader() {
  const api = useSpace();
  const params = useSearchParams();
  if (!api.data)
    return (
      <AppShell breadcrumbs={["PRAX", "Personal Space"]}>
        <h1 className="mb-5 text-2xl font-bold">Personal Space</h1>
        {api.error ? (
          <Notice tone="danger">
            {api.error}
            <Button onClick={() => void api.refresh()}>Retry</Button>
          </Notice>
        ) : (
          <Skeleton className="h-48" label="Loading personal space" />
        )}
      </AppShell>
    );
  return (
    <SpaceContent key={params.toString()} {...api} data={api.data} params={params.toString()} />
  );
}
function SpaceContent({
  data,
  error,
  saving,
  mutate,
  refresh,
  params,
}: { data: SpaceData; params: string } & Omit<ReturnType<typeof useSpace>, "data">) {
  const search = new URLSearchParams(params);
  const requested = search.get("tab");
  const initial: Section = requested === "notes" || requested === "goals" ? requested : "todos";
  const item = data[initial].find((i) => i.id === search.get("item"));
  const [tab, setTab] = useState<Section>(initial),
    [filter, setFilter] = useState("all"),
    [difficulty, setDifficulty] = useState("all"),
    [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ section: Section; id?: string; editing: boolean } | null>(
      item ? { section: initial, id: item.id, editing: false } : null
    ),
    [draft, setDraft] = useState<Draft>({ ...blank, ...item }),
    [remove, setRemove] = useState(false),
    [notice, setNotice] = useState("");
  const open = (section: Section, id?: string) => {
    const item = id ? data[section].find((item) => item.id === id) : undefined;
    setDraft({ ...blank, ...item });
    setEditor({ section, id, editing: !id });
    setRemove(false);
  };
  const update = (key: keyof Draft, value: string | number | boolean | null) =>
    setDraft((d) => ({ ...d, [key]: value }));
  // Task choices load only while a to-do is being edited. Members receive published tasks only.
  const taskFeed = useResource<TaskFeed>(
    editor?.section === "todos" && editor.editing ? TASK_OPTIONS_PATH : null
  );
  const linkedTitle = data.todos.find((t) => t.id === editor?.id)?.taskTitle ?? null;
  const taskOptions = taskFeed.data?.tasks ?? [];
  const hasOption = taskOptions.some((t) => t.id === draft.taskId);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    const fields =
      editor.section === "todos"
        ? {
            title: draft.title,
            description: draft.description,
            difficulty: draft.difficulty,
            priority: draft.priority,
            dueDate: draft.dueDate,
            completed: draft.completed,
            taskId: draft.taskId,
          }
        : editor.section === "notes"
          ? { title: draft.title, content: draft.content }
          : { title: draft.title, description: draft.description, progress: draft.progress };
    if (
      await mutate({
        resource: editor.section,
        operation: editor.id ? "update" : "create",
        id: editor.id,
        data: fields,
      })
    ) {
      setEditor(null);
      setNotice("Changes saved.");
    }
  };
  const destroy = async () => {
    if (
      editor?.id &&
      (await mutate({ resource: editor.section, operation: "delete", id: editor.id }))
    ) {
      setEditor(null);
      setNotice("Item removed.");
    }
  };
  const todos = data ? filterTodos(data.todos, filter, difficulty, query) : [];
  return (
    <AppShell breadcrumbs={["PRAX", "Personal Space"]}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Personal Space</h1>
          <p className="mt-1 text-xs text-text-muted">Plan privately. Build on your terms.</p>
        </div>
        <Button disabled={!data} onClick={() => open(tab)}>
          New {tab === "todos" ? "to-do" : tab === "notes" ? "note" : "goal"}
        </Button>
      </div>
      {notice && (
        <div className="mb-4">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Notice tone="danger">
            {error}{" "}
            <Button size="sm" variant="text" onClick={() => void refresh()}>
              Retry
            </Button>
          </Notice>
        </div>
      )}
      {!data && !error && <Skeleton label="Loading personal space" className="h-48" />}
      {data && (
        <>
          <Tabs
            label="Personal space sections"
            activeTab={tab}
            onChange={(id) => {
              setTab(id as Section);
              setQuery("");
            }}
            tabs={[
              { id: "todos", label: "To-dos", count: data.todos.length },
              { id: "notes", label: "Notes", count: data.notes.length },
              { id: "goals", label: "Goals", count: data.goals.length },
            ]}
          />
          <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
            <Card className="p-5">
              <h2 className="mb-4 text-sm font-bold">
                {tab === "todos" ? "Your to-dos" : tab === "notes" ? "Your notes" : "Your goals"}
              </h2>
              <Input
                label={`Search ${tab === "todos" ? "to-dos" : tab}`}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search titles and details"
              />
              {tab === "todos" && (
                <>
                  <div className="my-4 flex flex-wrap gap-2">
                    {["all", "today", "upcoming", "done"].map((value) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={filter === value ? "primary" : "secondary"}
                        aria-pressed={filter === value}
                        onClick={() => setFilter(value)}
                      >
                        {value[0].toUpperCase() + value.slice(1)} (
                        {filterTodos(data.todos, value, "all", "").length})
                      </Button>
                    ))}
                  </div>
                  <Select
                    label="Filter by difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="all">All difficulties</option>
                    {["Easy", "Medium", "Hard"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </Select>
                  <div className="mt-4 divide-y divide-border">
                    {todos.map((todo) => (
                      <div key={todo.id} className="flex items-start gap-3 py-4">
                        <div className="w-5 shrink-0">
                          <Checkbox
                            aria-label={`Mark ${todo.title} ${todo.completed ? "incomplete" : "complete"}`}
                            checked={todo.completed}
                            disabled={saving}
                            onChange={(e) =>
                              void mutate({
                                resource: "todos",
                                operation: "update",
                                id: todo.id,
                                data: { completed: e.target.checked },
                              })
                            }
                          />
                        </div>
                        <button
                          onClick={() => open("todos", todo.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span
                            className={`block break-words text-xs font-semibold ${todo.completed ? "text-text-muted line-through" : "text-text"}`}
                          >
                            {todo.title}
                          </span>
                          <span className="mt-1 block text-[11px] text-text-muted">
                            {todo.dueDate
                              ? `Due ${todo.dueDate}${todo.dueDate < todayIST() && !todo.completed ? " · Overdue" : ""}`
                              : "No due date"}{" "}
                            · {todo.priority} priority
                            {todo.taskTitle ? ` · Task: ${todo.taskTitle}` : ""}
                          </span>
                        </button>
                        <Badge
                          size="sm"
                          variant={
                            todo.difficulty === "Hard"
                              ? "warning"
                              : todo.difficulty === "Easy"
                                ? "success"
                                : "lavender"
                          }
                        >
                          {todo.difficulty}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {!todos.length && (
                    <EmptyState
                      title="No matching to-dos"
                      description="Change your filters or add a to-do."
                      action={<Button onClick={() => open("todos")}>New to-do</Button>}
                    />
                  )}
                </>
              )}
              {tab === "notes" && (
                <div className="mt-4 space-y-3">
                  {data.notes
                    .filter((n) =>
                      `${n.title} ${n.content}`.toLowerCase().includes(query.trim().toLowerCase())
                    )
                    .map((note) => (
                      <button
                        key={note.id}
                        onClick={() => open("notes", note.id)}
                        className="w-full rounded-lg border border-border bg-background p-4 text-left"
                      >
                        <span className="block break-words text-xs font-bold">{note.title}</span>
                        <span className="mt-2 block whitespace-pre-wrap break-words text-xs text-text-muted line-clamp-3">
                          {note.content || "No details yet."}
                        </span>
                      </button>
                    ))}
                  {!data.notes.some((n) =>
                    `${n.title} ${n.content}`.toLowerCase().includes(query.trim().toLowerCase())
                  ) && (
                    <EmptyState
                      title="No matching notes"
                      action={<Button onClick={() => open("notes")}>New note</Button>}
                    />
                  )}
                </div>
              )}
              {tab === "goals" && (
                <div className="mt-4 space-y-4">
                  {data.goals
                    .filter((g) =>
                      `${g.title} ${g.description}`
                        .toLowerCase()
                        .includes(query.trim().toLowerCase())
                    )
                    .map((goal) => (
                      <button
                        key={goal.id}
                        onClick={() => open("goals", goal.id)}
                        className="w-full rounded-lg border border-border p-4 text-left"
                      >
                        <Progress label={goal.title} value={goal.progress} showValue />
                        <span className="mt-2 block break-words text-xs text-text-muted">
                          {goal.description || "Add details to your goal."}
                        </span>
                      </button>
                    ))}
                  {!data.goals.some((g) =>
                    `${g.title} ${g.description}`.toLowerCase().includes(query.trim().toLowerCase())
                  ) && (
                    <EmptyState
                      title="No matching goals"
                      action={<Button onClick={() => open("goals")}>New goal</Button>}
                    />
                  )}
                </div>
              )}
              <p className="mt-5 border-t border-border pt-3 text-[11px] text-text-muted">
                Private to your account · Personal plans do not award platform points or streaks.
              </p>
            </Card>
            <div className="space-y-4">
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold">Your goals</h3>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => {
                      setTab("goals");
                      setQuery("");
                    }}
                  >
                    Open all
                  </Button>
                </div>
                <div className="space-y-4">
                  {data.goals.slice(0, 3).map((g) => (
                    <button
                      key={g.id}
                      onClick={() => open("goals", g.id)}
                      className="w-full text-left"
                    >
                      <Progress label={g.title} value={g.progress} showValue />
                    </button>
                  ))}
                  {!data.goals.length && (
                    <p className="text-xs text-text-muted">Create your first goal.</p>
                  )}
                </div>
              </Card>
              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold">Quick notes</h3>
                  <Button size="sm" variant="text" onClick={() => open("notes")}>
                    New note
                  </Button>
                </div>
                {data.notes.slice(0, 2).map((n) => (
                  <button
                    key={n.id}
                    className="mb-2 block w-full truncate rounded-md bg-background p-3 text-left text-xs font-semibold"
                    onClick={() => open("notes", n.id)}
                  >
                    {n.title}
                  </button>
                ))}
                {!data.notes.length && (
                  <p className="text-xs text-text-muted">Capture an idea with New note.</p>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
      <Modal
        isOpen={!!editor}
        onClose={() => {
          if (!saving) setEditor(null);
        }}
        title={
          editor
            ? `${editor.id ? (editor.editing ? "Edit" : "View") : "New"} ${editor.section === "todos" ? "to-do" : editor.section === "notes" ? "note" : "goal"}`
            : "Item"
        }
        footer={
          <>
            {editor?.id && (
              <Button
                variant="destructive"
                disabled={saving}
                onClick={() => (remove ? void destroy() : setRemove(true))}
              >
                {remove ? "Confirm removal" : "Remove"}
              </Button>
            )}
            {remove ? (
              <Button variant="secondary" onClick={() => setRemove(false)}>
                Keep item
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setEditor(null)} disabled={saving}>
                Close
              </Button>
            )}
            {!remove &&
              (editor?.editing ? (
                <Button key="save" form="space-editor" type="submit" isLoading={saving}>
                  Save changes
                </Button>
              ) : (
                <Button
                  key="edit"
                  onClick={(event) => {
                    event.preventDefault();
                    setEditor((e) => (e ? { ...e, editing: true } : e));
                  }}
                >
                  Edit
                </Button>
              ))}
          </>
        }
      >
        {error && <Notice tone="danger">{error}</Notice>}
        {remove && <Notice tone="warning">Remove this item? This cannot be undone.</Notice>}
        {editor?.editing ? (
          <form id="space-editor" onSubmit={submit} className="space-y-4">
            <Input
              label="Title"
              required
              maxLength={200}
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
            />
            {editor.section === "notes" ? (
              <Textarea
                label="Note"
                maxLength={5000}
                value={draft.content}
                onChange={(e) => update("content", e.target.value)}
              />
            ) : (
              <Textarea
                label="Description"
                maxLength={5000}
                value={draft.description}
                onChange={(e) => update("description", e.target.value)}
              />
            )}
            {editor.section === "todos" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Difficulty"
                    value={draft.difficulty}
                    onChange={(e) => update("difficulty", e.target.value)}
                  >
                    {["Easy", "Medium", "Hard"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </Select>
                  <Select
                    label="Priority"
                    value={draft.priority}
                    onChange={(e) => update("priority", e.target.value)}
                  >
                    {["Low", "Medium", "High"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </Select>
                </div>
                <Input
                  label="Due date"
                  type="date"
                  value={draft.dueDate}
                  onInput={(e) => update("dueDate", e.currentTarget.value)}
                  onChange={(e) => update("dueDate", e.target.value)}
                />
                <Select
                  label="Linked platform task (optional)"
                  className="min-h-11"
                  value={draft.taskId ?? ""}
                  onChange={(e) => update("taskId", e.target.value || null)}
                  helperText={
                    taskFeed.error
                      ? "Tasks could not load. You can still save this to-do without a task link."
                      : taskFeed.data?.pagination?.hasMore
                        ? "Showing the first 100 published tasks."
                        : undefined
                  }
                >
                  <option value="">No linked task</option>
                  {draft.taskId && !hasOption && (
                    <option value={draft.taskId}>{linkedTitle ?? "Linked task"}</option>
                  )}
                  {taskOptions.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </Select>
                <Checkbox
                  label="Completed"
                  checked={draft.completed}
                  onChange={(e) => update("completed", e.target.checked)}
                />
              </>
            )}
            {editor.section === "goals" && (
              <Input
                label="Progress (%)"
                type="number"
                min={0}
                max={100}
                required
                value={draft.progress}
                onChange={(e) => update("progress", Number(e.target.value))}
              />
            )}
          </form>
        ) : (
          <div className="space-y-3">
            <h3 className="break-words text-sm font-bold">{draft.title}</h3>
            <p className="whitespace-pre-wrap break-words text-xs text-text-muted">
              {editor?.section === "notes"
                ? draft.content || "No note details."
                : draft.description || "No description yet."}
            </p>
            {editor?.section === "todos" && (
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <dt>Difficulty</dt>
                <dd>{draft.difficulty}</dd>
                <dt>Priority</dt>
                <dd>{draft.priority}</dd>
                <dt>Due date</dt>
                <dd>{draft.dueDate || "Not set"}</dd>
                <dt>Status</dt>
                <dd>{draft.completed ? "Completed" : "Open"}</dd>
                <dt>Linked task</dt>
                <dd>
                  {draft.taskId && linkedTitle ? (
                    <Link
                      href={`/tasks/${encodeURIComponent(draft.taskId)}`}
                      className="text-primary hover:underline"
                    >
                      {linkedTitle}
                    </Link>
                  ) : (
                    "Not linked"
                  )}
                </dd>
              </dl>
            )}
            {editor?.section === "goals" && (
              <Progress label="Progress" value={draft.progress} showValue />
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
