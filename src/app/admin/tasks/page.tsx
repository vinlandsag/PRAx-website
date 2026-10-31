"use client";
import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Card, EmptyState, Input } from "@/components/ui";
import { ResourceState } from "@/components/ui/ResourceState";
import { useResource } from "@/lib/api/use-resource";
import type { TaskFeed } from "@/lib/api/contracts";
export default function AdminTasksPage() {
  const api = useResource<TaskFeed>("/api/tasks");
  const [search, setSearch] = useState("");
  const tasks = (api.data?.tasks ?? []).filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <AppShell breadcrumbs={["PRAX", "Task manager"]} variant="admin">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Task manager</h1>
        <Link href="/admin/tasks/new">
          <Button>Create task</Button>
        </Link>
      </div>
      <div className="mb-4">
        <Input
          type="search"
          label="Search tasks"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {!api.data ? (
        <ResourceState loading={api.loading} error={api.error} onRetry={() => void api.refresh()} />
      ) : (
        <Card className="overflow-x-auto">
          {tasks.length ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="p-3">Task</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Max points</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr className="border-b border-border last:border-0" key={task.id}>
                    <td className="p-3">
                      <Link className="text-primary" href={"/tasks/" + encodeURIComponent(task.id)}>
                        {task.title}
                      </Link>
                    </td>
                    <td className="p-3">{task.category}</td>
                    <td className="p-3">
                      <Badge>{task.status}</Badge>
                    </td>
                    <td className="p-3">{task.pointsMax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No matching tasks" />
          )}
        </Card>
      )}
    </AppShell>
  );
}
