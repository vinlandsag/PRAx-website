"use client";
import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Card, Input, Notice, Skeleton, Textarea } from "@/components/ui";
import { ResourceState } from "@/components/ui/ResourceState";
import { useResource } from "@/lib/api/use-resource";
import { apiRequest } from "@/lib/api/client";
import type { TaskDetail } from "@/lib/api/contracts";
export default function TaskDetailPage() {
  return (
    <Suspense fallback={<Skeleton label="Loading task" className="h-64" />}>
      <TaskContent />
    </Suspense>
  );
}
function TaskContent() {
  const { id } = useParams<{ id: string }>();
  const api = useResource<TaskDetail>("/api/tasks/" + encodeURIComponent(id));
  const [proofUrl, setProofUrl] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: id, proofUrl, note }),
      });
      setSubmitted(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not submit your work.");
    } finally {
      setSaving(false);
    }
  };
  const task = api.data?.task;
  return (
    <AppShell breadcrumbs={["PRAX", "Task detail"]}>
      <Link href="/tasks" className="mb-4 inline-block text-xs text-primary">
        ← Back to tasks
      </Link>
      {!task ? (
        <ResourceState
          loading={api.loading}
          error={api.error}
          onRetry={() => void api.refresh()}
          emptyTitle="Task not found"
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-6">
            <Badge>{task.status}</Badge>
            <h1 className="mt-3 text-2xl font-bold">{task.title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
              {task.description}
            </p>
            <p className="my-4 text-xs font-semibold text-primary">
              {task.pointsMax} points maximum
            </p>
            <p className="text-xs text-text-muted">
              {task.category} · {task.deadline}
            </p>
            {!!task.checklist?.length && (
              <>
                <h2 className="mt-6 text-sm font-bold">Acceptance checklist</h2>
                <ul className="mt-3 list-disc space-y-2 pl-4 text-xs">
                  {task.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-bold">Submit your work</h2>
            {error && <Notice tone="danger">{error}</Notice>}
            {submitted ? (
              <Notice tone="success">Your submission was received for review.</Notice>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <Input
                  label="Proof link"
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  required
                  disabled={saving}
                />
                <Textarea
                  label="Explanation"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  required
                  disabled={saving}
                />
                <Button type="submit" isLoading={saving}>
                  Submit for review
                </Button>
              </form>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
