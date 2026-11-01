"use client";
import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Input, Card, Badge, EmptyState, Select } from "@/components/ui";
import { ResourceState } from "@/components/ui/ResourceState";
import { useResource } from "@/lib/api/use-resource";
import type { SubmissionFeed } from "@/lib/api/contracts";
export default function SubmissionsPage() {
  const api = useResource<SubmissionFeed>("/api/submissions");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const entries = (api.data?.submissions ?? []).filter(
    (item) =>
      (status === "all" || item.status === status) &&
      (item.taskTitle + " " + item.note).toLowerCase().includes(query.toLowerCase())
  );
  return (
    <AppShell breadcrumbs={["PRAX", "My submissions"]}>
      <h1 className="text-2xl font-bold">My submissions</h1>
      <p className="mt-1 mb-6 text-xs text-text-muted">
        Track your submitted work and review feedback
      </p>
      <div className="mb-5 flex flex-wrap gap-3">
        <Input
          label="Search submissions"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          label="Submission status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          {[
            "DRAFT",
            "SUBMITTED",
            "UNDER_REVIEW",
            "APPROVED",
            "REJECTED",
            "REVISION_REQUESTED",
            "WITHDRAWN",
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Select>
      </div>
      {!api.data ? (
        <ResourceState loading={api.loading} error={api.error} onRetry={() => void api.refresh()} />
      ) : (
        <Card className="overflow-x-auto">
          {entries.length ? (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-text-muted">
                <tr>
                  <th className="p-3">Task</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Points</th>
                  <th className="p-3">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <Link
                        className="font-semibold text-primary"
                        href={"/tasks/" + encodeURIComponent(item.taskId)}
                      >
                        {item.taskTitle}
                      </Link>
                    </td>
                    <td className="p-3">
                      <Badge>{item.status.replaceAll("_", " ")}</Badge>
                    </td>
                    <td className="p-3">{item.pointsAwarded ?? "—"}</td>
                    <td className="p-3">{item.feedback || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              title="No submissions found"
              description="Your submitted work will appear here."
            />
          )}
        </Card>
      )}
    </AppShell>
  );
}
