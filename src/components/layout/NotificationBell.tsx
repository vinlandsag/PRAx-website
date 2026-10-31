"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { Button, EmptyState, Icon, Modal, Notice, Skeleton } from "@/components/ui";
import { useResource } from "@/lib/api/use-resource";
import { apiRequest } from "@/lib/api/client";
import type { NotificationFeed } from "@/lib/notifications/types";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [writeError, setWriteError] = useState("");
  const dialogId = useId();
  const feed = useResource<NotificationFeed>("/api/notifications");
  const unread = feed.data?.notifications.filter((item) => !item.readAt).length ?? 0;
  const markRead = async () => {
    setSaving(true);
    setWriteError("");
    try {
      await apiRequest("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "mark-all-read" }),
      });
      await feed.refresh();
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : "Could not update notifications.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <Button
        variant="text"
        iconOnly
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={() => setOpen(true)}
        className="relative"
      >
        <Icon name="bell" size={18} />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-white"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Button>
      <Modal
        id={dialogId}
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Notifications"
        maxWidth="sm"
        footer={
          <>
            <Link
              href="/settings?tab=notifications"
              onClick={() => setOpen(false)}
              className="mr-auto text-xs text-primary hover:underline"
            >
              Notification preferences
            </Link>
            {unread > 0 && (
              <Button variant="secondary" isLoading={saving} onClick={() => void markRead()}>
                Mark all read
              </Button>
            )}
          </>
        }
      >
        {writeError && <Notice tone="danger">{writeError}</Notice>}
        {feed.loading ? (
          <Skeleton className="h-32" label="Loading notifications" />
        ) : feed.error ? (
          <EmptyState
            title="Notifications unavailable"
            description={feed.error}
            icon="bell"
            action={
              <Button variant="secondary" onClick={() => void feed.refresh()}>
                Retry
              </Button>
            }
          />
        ) : !feed.data?.notifications.length ? (
          <EmptyState
            title="You're all caught up"
            description="New updates will appear here."
            icon="bell"
          />
        ) : (
          <ul className="divide-y divide-border">
            {feed.data.notifications.map((item) => (
              <li key={item.id} className="py-3">
                <p className="font-semibold">
                  {!item.readAt && <span className="mr-2 text-primary">Unread ·</span>}
                  {item.title}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-text-muted">
                  {item.message}
                </p>
                <time className="mt-1 block text-[10px] text-text-muted" dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString()}
                </time>
                {item.href?.startsWith("/") &&
                  !item.href.startsWith("//") &&
                  !item.href.includes("\\") && (
                    <Link
                      onClick={() => setOpen(false)}
                      className="mt-2 inline-block text-primary hover:underline"
                      href={item.href}
                    >
                      View update
                    </Link>
                  )}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
