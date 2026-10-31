"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Card, EmptyState, Notice } from "@/components/ui";
import { ResourceState } from "@/components/ui/ResourceState";
import { useResource } from "@/lib/api/use-resource";
import { apiRequest } from "@/lib/api/client";
interface Report {
  id: string;
  author: string;
  content: string;
  reason: string;
}
export default function ModerationPage() {
  const api = useResource<{ reports: Report[] }>("/api/admin/reports");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const act = async (id: string, operation: string) => {
    setSaving(true);
    setError("");
    try {
      await apiRequest("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, operation }),
      });
      await api.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update report.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <AppShell breadcrumbs={["PRAX", "Chat moderation"]} variant="admin">
      <h1 className="mb-6 text-2xl font-bold">Chat moderation</h1>
      {error && <Notice tone="danger">{error}</Notice>}
      {!api.data ? (
        <ResourceState loading={api.loading} error={api.error} onRetry={() => void api.refresh()} />
      ) : api.data.reports.length ? (
        <div className="space-y-4">
          {api.data.reports.map((report) => (
            <Card className="p-5" key={report.id}>
              <h2 className="text-sm font-bold">{report.author}</h2>
              <p className="my-3 whitespace-pre-wrap text-xs">{report.content}</p>
              <p className="mb-3 text-xs text-text-muted">{report.reason}</p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={saving}
                  onClick={() => void act(report.id, "dismiss")}
                >
                  Dismiss report
                </Button>
                <Button
                  variant="danger"
                  disabled={saving}
                  onClick={() => void act(report.id, "remove-message")}
                >
                  Remove message
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No reports awaiting review" />
      )}
    </AppShell>
  );
}
