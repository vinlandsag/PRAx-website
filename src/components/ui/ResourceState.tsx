"use client";
import { Button } from "./Button";
import { Card } from "./Card";
import { EmptyState, Skeleton } from "./Feedback";

export function ResourceState({
  loading,
  error,
  onRetry,
  emptyTitle = "Nothing here yet",
}: {
  loading: boolean;
  error: string;
  onRetry: () => void;
  emptyTitle?: string;
}) {
  if (loading) return <Skeleton className="h-48" label="Loading content" />;
  return (
    <Card>
      <EmptyState
        title={error ? "Content unavailable" : emptyTitle}
        description={error || "New content will appear here when it is available."}
        action={
          error ? (
            <Button variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
      />
    </Card>
  );
}
