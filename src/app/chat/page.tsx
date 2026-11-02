"use client";
import { useState } from "react";
import Link from "next/link";
import { memberProfileHref } from "@/lib/workspace/members";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatAttachments } from "@/components/chat/ChatAttachments";
import { ChatReactions } from "@/components/chat/ChatReactions";
import { ChatRulesDialog } from "@/components/chat/ChatRulesDialog";
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
import { useChat } from "@/lib/workspace/use-chat";
import type { ChatMessage } from "@/lib/workspace/types";

export default function ChatPage() {
  const chat = useChat();
  const [manualRules, setManualRules] = useState(false),
    [dismissedFor, setDismissedFor] = useState<number | null>(null),
    [selected, setSelected] = useState<ChatMessage | null>(null),
    [mode, setMode] = useState<"actions" | "edit" | "delete">("actions"),
    [draft, setDraft] = useState("");
  // The message as last received, so actions follow edits and pins that arrive while the dialog is open.
  const live = selected ? (chat.messages.find((m) => m.id === selected.id) ?? selected) : null;
  const own = !!live && live.authorId === chat.viewer?.id,
    admin = chat.viewer?.role === "ADMIN";
  const rulesOpen =
    manualRules || (chat.loaded && !chat.rulesAccepted && dismissedFor !== chat.rulesPrompt);
  const closeRules = () => {
    setManualRules(false);
    setDismissedFor(chat.rulesPrompt);
  };
  const acceptRules = async () => {
    if (await chat.acceptRules()) setManualRules(false);
  };
  const close = () => setSelected(null);
  const act = async (operation: "update" | "delete" | "pin") => {
    if (!live) return;
    const done =
      operation === "update"
        ? await chat.edit(live.id, draft)
        : operation === "delete"
          ? await chat.remove(live.id)
          : await chat.pin(live.id, !live.pinned);
    if (done) close();
  };
  return (
    <AppShell breadcrumbs={["PRAX", "Community chat"]}>
      <h1 className="text-2xl font-bold tracking-tight">Community chat</h1>
      <p className="mt-1 mb-6 text-xs text-text-muted">
        Share what you built. Get useful feedback.
      </p>
      {chat.error && !chat.loaded && (
        <Notice tone="danger">
          {chat.error}
          <Button variant="text" className="min-h-11" onClick={() => void chat.refresh()}>
            Retry
          </Button>
        </Notice>
      )}
      {!chat.loaded ? (
        !chat.error && <Skeleton className="h-72" label="Loading community messages" />
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
              <Button
                variant="secondary"
                size="sm"
                className="min-h-11"
                onClick={() => setManualRules(true)}
              >
                Community rules
              </Button>
            </div>
            {chat.connectionLost && (
              <div className="border-b border-border p-3">
                <Notice tone="warning">
                  Reconnecting… Showing the last messages we received. New messages will appear when
                  the connection returns.
                </Notice>
              </div>
            )}
            {chat.pinned.map((m) => (
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
              {chat.hasMore && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-11 self-center"
                  isLoading={chat.loadingOlder}
                  onClick={() => void chat.loadOlder()}
                >
                  Load older messages
                </Button>
              )}
              {chat.messages.map((m) => (
                <article
                  key={m.id}
                  aria-label={`Message by ${m.author}`}
                  className="flex items-start gap-3"
                >
                  <Link
                    href={memberProfileHref(m.authorId)}
                    aria-label={`View profile of ${m.author}`}
                  >
                    <Avatar name={m.author} src={m.authorAvatarUrl || undefined} size="sm" />
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
                    <ChatReactions
                      author={m.author}
                      reactions={m.reactions}
                      disabled={chat.reacting}
                      onToggle={(emoji) => void chat.react(m.id, emoji)}
                    />
                  </div>
                  <Button
                    variant="text"
                    iconOnly
                    className="min-h-11 min-w-11"
                    aria-label={`Message actions for ${m.author}`}
                    onClick={() => {
                      chat.clearActionError();
                      setSelected(m);
                      setDraft(m.content);
                      setMode("actions");
                    }}
                  >
                    <Icon name="more" />
                  </Button>
                </article>
              ))}
              {!chat.messages.length && (
                <EmptyState
                  title="Start the conversation"
                  description="Share what you are building."
                />
              )}
            </div>
            {!chat.rulesAccepted && (
              <div className="border-t border-border p-3">
                <Notice tone="info">
                  Accept the community rules to post.
                  <Button variant="text" className="min-h-11" onClick={() => setManualRules(true)}>
                    Review rules
                  </Button>
                </Notice>
              </div>
            )}
            {chat.actionError && !selected && !rulesOpen && (
              <div className="border-t border-border p-3">
                <Notice tone="danger">{chat.actionError}</Notice>
              </div>
            )}
            <ChatComposer saving={chat.saving} onSend={(content, ids) => chat.send(content, ids)} />
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
      <ChatRulesDialog
        isOpen={rulesOpen}
        requireAccept={chat.loaded && !chat.rulesAccepted}
        saving={chat.saving}
        error={chat.actionError}
        onAccept={() => void acceptRules()}
        onClose={closeRules}
      />
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
              <Button variant="secondary" className="min-h-11" onClick={close}>
                Cancel
              </Button>
              <Button
                variant={mode === "delete" ? "danger" : "primary"}
                className="min-h-11"
                isLoading={chat.saving}
                disabled={mode === "edit" && !draft.trim() && !live?.attachments?.length}
                onClick={() => void act(mode === "delete" ? "delete" : "update")}
              >
                {mode === "delete" ? "Delete message" : "Save message"}
              </Button>
            </>
          )
        }
      >
        {chat.actionError && <Notice tone="danger">{chat.actionError}</Notice>}
        {mode === "actions" ? (
          <div className="space-y-3">
            <p className="break-words text-text-muted">{live?.content}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="min-h-11"
                disabled={!own}
                onClick={() => setMode("edit")}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                className="min-h-11"
                disabled={!own && !admin}
                onClick={() => setMode("delete")}
              >
                Delete
              </Button>
              <Button
                variant="secondary"
                className="min-h-11"
                disabled={!admin}
                isLoading={chat.saving}
                onClick={() => void act("pin")}
              >
                {live?.pinned ? "Unpin" : "Pin"}
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
          <p>This removes the message from the community channel for everyone.</p>
        )}
      </Modal>
    </AppShell>
  );
}
