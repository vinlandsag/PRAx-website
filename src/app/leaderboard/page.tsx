"use client";
import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, Badge, Card, Progress, Tabs, EmptyState } from "@/components/ui";
import { memberProfileHref } from "@/lib/workspace/members";
import { useResource } from "@/lib/api/use-resource";
import { ResourceState } from "@/components/ui/ResourceState";
import type { LeaderboardFeed } from "@/lib/api/contracts";

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"weekly" | "alltime">("weekly");
  const [offset, setOffset] = useState(0);
  const api = useResource<LeaderboardFeed>(`/api/leaderboard?period=${period}&offset=${offset}`);
  const ranked = api.data?.entries ?? [],
    own = api.data?.currentUser,
    next = api.data?.userAhead;
  const pagination = api.data?.pagination;
  const isFirstPage = (pagination?.offset ?? 0) === 0;
  const podium = isFirstPage
    ? [ranked[1], ranked[0], ranked[2]].filter(
        (builder): builder is NonNullable<typeof builder> => !!builder
      )
    : [];
  const periodLabel = period === "weekly" ? "Weekly" : "All-time";
  return (
    <AppShell breadcrumbs={["PRAX", "Leaderboard"]}>
      <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
      <p className="mt-1 mb-6 text-xs text-text-muted">Verified work. Recognised progress.</p>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          variant="segmented"
          activeTab={period}
          onChange={(value) => {
            setPeriod(value as typeof period);
            setOffset(0);
          }}
          tabs={[
            { id: "weekly", label: "Weekly" },
            { id: "alltime", label: "All-time" },
          ]}
        />
        <span className="text-xs text-text-muted">
          {period === "weekly"
            ? "Weekly period · Monday, 00:00 IST"
            : "All approved points · No weekly reset"}
        </span>
      </div>
      {(api.loading || api.error) && (
        <ResourceState loading={api.loading} error={api.error} onRetry={() => void api.refresh()} />
      )}
      {!api.loading && !api.error && api.data?.total === 0 && (
        <EmptyState
          title="No rankings yet"
          description="Rankings will appear after work has been approved."
        />
      )}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
        <Card className="p-4 sm:p-6">
          <div
            aria-label={`${periodLabel} podium`}
            className="flex items-end justify-center gap-3 border-b border-border pb-6 pt-3 sm:gap-6"
          >
            {podium.map((builder) => (
              <div
                key={builder.id}
                className="flex min-w-0 flex-1 flex-col items-center text-center sm:flex-none"
              >
                <Link
                  href={memberProfileHref(builder.id, "leaderboard")}
                  aria-label={`View profile of ${builder.name}`}
                >
                  <Avatar
                    name={builder.name}
                    size={builder.rank === 1 ? "xl" : "lg"}
                    colorScheme={
                      builder.rank === 1 ? "orange" : builder.rank === 2 ? "purple" : "blue"
                    }
                  />
                  <span className="mt-2 block text-xs font-semibold hover:text-primary">
                    {builder.name}
                  </span>
                </Link>
                <span className="mt-1 mb-3 text-[11px] text-text-muted">
                  {builder.points.toLocaleString()} points
                </span>
                <div
                  className={`flex w-full items-center justify-center rounded-t-xl border text-2xl font-bold sm:w-24 ${builder.rank === 1 ? "h-32 border-warning-border bg-warning-bg text-warning-text" : builder.rank === 2 ? "h-24 border-lavender-border bg-lavender text-lavender-text" : "h-16 border-info-border bg-info-bg text-info-text"}`}
                >
                  {builder.rank}
                </div>
              </div>
            ))}
          </div>
          <div aria-label={`${periodLabel} rankings`} className="divide-y divide-border">
            {ranked.slice(isFirstPage ? 3 : 0).map((builder) => (
              <div
                key={builder.id}
                className={`flex items-center justify-between gap-3 rounded-lg px-2 py-3 ${builder.id === own?.id ? "bg-lavender" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-5 text-xs text-text-muted">
                    {String(builder.rank).padStart(2, "0")}
                  </span>
                  <Link
                    href={memberProfileHref(builder.id, "leaderboard")}
                    aria-label={`View profile of ${builder.name}`}
                  >
                    <Avatar name={builder.name} size="sm" />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={memberProfileHref(builder.id, "leaderboard")}
                      className="text-xs font-semibold hover:text-primary hover:underline"
                    >
                      {builder.id === own?.id ? `You · ${builder.name}` : builder.name}
                    </Link>
                    <p className="text-[11px] text-text-muted">{builder.streak} day streak</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-bold tabular-nums">
                  {builder.points.toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
          {pagination && pagination.total > 0 && ranked.length === 0 && (
            <p className="py-5 text-center text-xs text-text-muted">
              No builders on this page. Try the previous page.
            </p>
          )}
          {pagination && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pagination.offset === 0 || api.loading}
                onClick={() => setOffset(Math.max(0, pagination.offset - pagination.limit))}
              >
                Previous
              </button>
              <span className="text-xs text-text-muted">
                {pagination.total === 0
                  ? "0 builders"
                  : `Showing ${pagination.offset + 1}–${Math.min(pagination.offset + ranked.length, pagination.total)} of ${pagination.total}`}
              </span>
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!pagination.hasMore || api.loading}
                onClick={() => setOffset(pagination.offset + pagination.limit)}
              >
                Next
              </button>
            </div>
          )}
        </Card>
        <div className="space-y-5">
          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold">Your standing</h2>
              <Badge variant="lavender" size="sm">
                {periodLabel}
              </Badge>
            </div>
            {own ? (
              <>
                <p className="text-3xl font-extrabold text-primary">
                  #{own.rank}
                  <span className="ml-2 text-xs font-normal text-text-muted">
                    / {api.data?.total ?? 0} builders
                  </span>
                </p>
                <p className="text-xs text-text-muted">
                  {own.points.toLocaleString()} points{" "}
                  {period === "weekly" ? "this week" : "all time"}
                </p>
                {next ? (
                  <>
                    <Progress
                      label={`Progress toward ${next.name}`}
                      value={own.points}
                      max={Math.max(next.points + 1, 1)}
                    />
                    <p className="text-[11px] text-text-muted">
                      {next.points - own.points + 1} points to pass {next.name}.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-text-muted">You lead this period.</p>
                )}
              </>
            ) : (
              <p className="text-xs text-text-muted">No standing is available for this period.</p>
            )}
          </Card>
          <Card className="space-y-3 p-5">
            <h2 className="text-sm font-bold">How points work</h2>
            <p className="text-xs text-text-muted">
              Only admin-approved platform tasks count toward ranking. Personal to-dos and chat
              never earn points.
            </p>
            <Link href="/tasks" className="text-xs font-semibold text-primary hover:underline">
              Browse tasks →
            </Link>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
