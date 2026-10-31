"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { memberProfileHref } from "@/lib/workspace/members";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatAttachments } from "@/components/chat/ChatAttachments";
import { AppShell } from "@/components/layout/AppShell";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  Modal,
  Notice,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { useWorkspace } from "@/lib/workspace/use-workspace";
import type { ChatMessage } from "@/lib/workspace/types";

export default function ChatPage() {
  const { data, error, saving, mutate, refresh } = useWorkspace();
  const [rules, setRules] = useState(false),
    [selected, setSelected] = useState<ChatMessage | null>(null),
    [mode, setMode] = useState<"actions" | "edit" | "delete">("actions"),
    [draft, setDraft] = useState("");
  useEffect(() => {
    if (!data) return;
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => clearInterval(timer);
  }, [refresh, data]);
  const close = () => setSelected(null),
    own = selected?.authorId === data?.user.id,
    admin = data?.user.role === "ADMIN";
  const act = async (operation: "update" | "delete" | "pin") => {
    if (
      selected &&
      (await mutate({
        resource: "messages",
        operation,
        id: selected.id,
        data: operation === "update" ? { content: draft } : {},
      }))
    )
      close();
  };
  return (
    <AppShell breadcrumbs={["PRAX", "Community chat"]}>
      <h1 className="text-2xl font-bold tracking-tight">Community chat</h1>
      <p className="mt-1 mb-6 text-xs text-text-muted">
        Share what you built. Get useful feedback.
      </p>
      {error && (
        <Notice tone="danger">
          {error}
          <Button variant="text" onClick={() => void refresh()}>
            Retry
          </Button>
        </Notice>
      )}
      {!data ? (
        !error && <Skeleton className="h-72" label="Loading community messages" />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-border p-4">
              <div>
                <h2 className="text-sm font-bold">
                  <span className="text-primary">#</span> general
                </h2>
                <p className="text-[11px] text-text-muted">
                  Shared community channel · Refreshes every 15 seconds
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setRules(true)}>
                Community rules
              </Button>
            </div>
            {data.messages
              .filter((m) => m.pinned)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-2 border-b border-lavender-border bg-lavender px-4 py-3 text-xs text-lavender-text"
                >
                  <Icon name="pin" className="shrink-0" />
                  <p className="min-w-0 break-words">
                    <span className="font-semibold">Pinned · </span>
                    {m.content}
                  </p>
                </div>
              ))}
            <div
              aria-label="Community messages"
              className="flex max-h-[55dvh] min-h-64 flex-col gap-5 overflow-y-auto p-4 sm:p-5"
            >
              {data.messages.map((m) => (
                <article
                  key={m.id}
                  aria-label={`Message by ${m.author}`}
                  className="flex items-start gap-3"
                >
                  <Link
                    href={memberProfileHref(m.authorId)}
                    aria-label={`View profile of ${m.author}`}
                  >
                    <Avatar name={m.author} size="sm" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-xs font-bold">
                        <Link
                          href={memberProfileHref(m.authorId)}
                          className="hover:text-primary hover:underline"
                        >
                          {m.author}
                        </Link>
                      </h3>
                      <time dateTime={m.createdAt} className="text-[10px] text-text-muted">
                        {new Date(m.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                      {m.edited && <span className="text-[10px] text-text-muted">Edited</span>}
                      {m.pinned && (
                        <Badge size="sm" variant="lavender">
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-text-secondary">
                      {m.content}
                    </p>
                    {!!m.attachments?.length && <ChatAttachments files={m.attachments} />}
                  </div>
                  <Button
                    variant="text"
                    iconOnly
                    aria-label={`Message actions for ${m.author}`}
                    onClick={() => {
                      setSelected(m);
                      setDraft(m.content);
                      setMode("actions");
                    }}
                  >
                    <Icon name="more" />
                  </Button>
                </article>
              ))}
              {!data.messages.length && (
                <EmptyState
                  title="Start the conversation"
                  description="Share what you are building."
                />
              )}
            </div>
            <ChatComposer
              saving={saving}
              onSend={(content, attachmentIds) =>
                mutate({
                  resource: "messages",
                  operation: "create",
                  data: { content, attachmentIds },
                })
              }
            />
          </Card>
          <Card className="space-y-3 p-5">
            <h2 className="text-sm font-bold">A shared room for builders</h2>
            <p className="text-xs text-text-muted">
              Use the three-dot control beside a message to view its actions. You can edit or remove
              your own messages. Admins can remove messages and pin announcements.
            </p>
            <p className="text-xs text-text-muted">Chat never changes your rank.</p>
          </Card>
        </div>
      )}
      <Modal
        isOpen={rules}
        onClose={() => setRules(false)}
        title="Community rules"
        footer={<Button onClick={() => setRules(false)}>Got it</Button>}
      >
        <ol className="list-decimal space-y-3 pl-5">
          <li>Share work and give constructive feedback.</li>
          <li>Respect people. Disagree with ideas, not identities.</li>
          <li>No spam or unsolicited promotions.</li>
          <li>Admins can remove inappropriate messages.</li>
        </ol>
      </Modal>
      <Modal
        isOpen={!!selected}
        onClose={close}
        title={
          mode === "edit"
            ? "Edit message"
            : mode === "delete"
              ? "Delete message?"
              : "Message actions"
        }
        footer={
          mode === "actions" ? undefined : (
            <>
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button
                variant={mode === "delete" ? "danger" : "primary"}
                isLoading={saving}
                disabled={mode === "edit" && !draft.trim() && !selected?.attachments?.length}
                onClick={() => void act(mode === "delete" ? "delete" : "update")}
              >
                {mode === "delete" ? "Delete message" : "Save message"}
              </Button>
            </>
          )
        }
      >
        {error && <Notice tone="danger">{error}</Notice>}
        {mode === "actions" ? (
          <div className="space-y-3">
            <p className="break-words text-text-muted">{selected?.content}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={!own} onClick={() => setMode("edit")}>
                Edit
              </Button>
              <Button variant="danger" disabled={!own && !admin} onClick={() => setMode("delete")}>
                Delete
              </Button>
              <Button
                variant="secondary"
                disabled={!admin}
                isLoading={saving}
                onClick={() => void act("pin")}
              >
                {selected?.pinned ? "Unpin" : "Pin"}
              </Button>
            </div>
            <p className="text-[11px] text-text-muted">
              Edit your own messages. Pinning is reserved for admins.
            </p>
          </div>
        ) : mode === "edit" ? (
          <Textarea
            label="Message"
            maxLength={500}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        ) : (
          <p>This permanently removes this message from the community channel.</p>
        )}
      </Modal>
    </AppShell>
  );
}
