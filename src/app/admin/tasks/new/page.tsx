"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Card, Input, Notice, Textarea } from "@/components/ui";
import { apiRequest } from "@/lib/api/client";
export default function TaskEditorPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [checklist, setChecklist] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await apiRequest<{ task: { id: string } }>("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          pointsMax: Number(maxPoints),
          dueAt: dueAt || null,
          checklist: checklist
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      if (!result.task?.id) throw new Error("Task creation could not be confirmed.");
      router.push("/admin/tasks");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create this task.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <AppShell breadcrumbs={["PRAX", "Create task"]} variant="admin">
      <h1 className="mb-6 text-2xl font-bold">Create task</h1>
      <Card className="max-w-2xl p-6">
        {error && <Notice tone="danger">{error}</Notice>}
        <form onSubmit={save} className="space-y-4">
          <Input
            label="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={saving}
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={saving}
          />
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={saving}
          />
          <Input
            label="Maximum points"
            type="number"
            min="0"
            step="1"
            value={maxPoints}
            onChange={(e) => setMaxPoints(e.target.value)}
            required
            disabled={saving}
          />
          <Input
            label="Due date"
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            disabled={saving}
          />
          <Textarea
            label="Acceptance checklist"
            helperText="One requirement per line."
            value={checklist}
            onChange={(e) => setChecklist(e.target.value)}
            disabled={saving}
          />
          <Button type="submit" isLoading={saving}>
            Create task
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
