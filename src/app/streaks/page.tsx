"use client";
import { AppShell } from "@/components/layout/AppShell";
import { Card, EmptyState, StatCard } from "@/components/ui";
import { ResourceState } from "@/components/ui/ResourceState";
import { useResource } from "@/lib/api/use-resource";
import type { StreakSummary } from "@/lib/api/contracts";
export default function StreaksPage() {
  const api = useResource<StreakSummary>("/api/streaks");
  return (
    <AppShell breadcrumbs={["PRAX", "Streaks"]}>
      <h1 className="text-2xl font-bold">Streaks</h1>
      <p className="mt-1 mb-6 text-xs text-text-muted">
        Build a steady rhythm through approved work
      </p>
      {api.data ? (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <StatCard label="Current streak" value={api.data.current} />
            <StatCard label="Longest streak" value={api.data.longest} />
          </div>
          <Card className="p-5">
            <h2 className="text-sm font-bold">Active days</h2>
            {api.data.activeDays.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {api.data.activeDays.map((day) => (
                  <li key={day} className="rounded-md border border-border px-3 py-2 text-xs">
                    <time dateTime={day}>{day}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No activity recorded yet" />
            )}
          </Card>
        </>
      ) : (
        <ResourceState loading={api.loading} error={api.error} onRetry={() => void api.refresh()} />
      )}
    </AppShell>
  );
}
