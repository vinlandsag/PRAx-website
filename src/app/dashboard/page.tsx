"use client";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, EmptyState, StatCard } from "@/components/ui";
import { ResourceState } from "@/components/ui/ResourceState";
import { useResource } from "@/lib/api/use-resource";
import type { DashboardSummary } from "@/lib/api/contracts";
export default function DashboardPage() {
  const api = useResource<DashboardSummary>("/api/dashboard");
  return (
    <AppShell breadcrumbs={["PRAX", "Dashboard"]}>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 mb-6 text-xs text-text-muted">Your work and progress</p>
      {api.data ? (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total points" value={api.data.totalPoints.toLocaleString()} />
            <StatCard
              label="Weekly rank"
              value={api.data.weeklyRank === null ? "—" : "#" + api.data.weeklyRank}
            />
            <StatCard label="Day streak" value={api.data.dayStreak} />
            <StatCard label="Tasks approved" value={api.data.tasksApproved} />
          </div>
          <Card className="p-5">
            <h2 className="text-sm font-bold">Recent activity</h2>
            {api.data.activity.length ? (
              <ul className="mt-3 divide-y divide-border">
                {api.data.activity.map((item) => (
                  <li className="py-3 text-xs" key={item.id}>
                    {item.title}
                    <time className="ml-2 text-text-muted" dateTime={item.createdAt}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No activity yet" />
            )}
          </Card>
        </>
      ) : (
        <ResourceState loading={api.loading} error={api.error} onRetry={() => void api.refresh()} />
      )}
      <div className="mt-5 flex gap-4 text-xs font-semibold text-primary">
        <Link href="/tasks">Browse tasks</Link>
        <Link href="/space">Personal Space</Link>
      </div>
    </AppShell>
  );
}
