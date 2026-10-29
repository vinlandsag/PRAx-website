"use client";
import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { Button, Icon, Input, Notice } from "@/components/ui";
import {
  ATTACHMENT_ACCEPT,
  attachmentError,
  attachmentSpec,
  formatFileSize,
  MAX_ATTACHMENTS,
  MAX_MESSAGE_BYTES,
} from "@/lib/workspace/attachment-policy";

interface DraftFile {
  key: number;
  file: File;
  preview: string;
  uploadedId?: string;
}
export function ChatComposer({
  saving,
  onSend,
}: {
  saving: boolean;
  onSend: (content: string, attachmentIds: string[]) => Promise<boolean>;
}) {
  const [message, setMessage] = useState(""),
    [files, setFiles] = useState<DraftFile[]>([]),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(""),
    [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null),
    sequence = useRef(0),
    current = useRef<DraftFile[]>([]);
  const busy = saving || uploading;
  const replace = (next: DraftFile[]) => {
    current.current = next;
    setFiles(next);
  };
  useEffect(
    () => () => {
      for (const item of current.current) {
        if (item.preview) URL.revokeObjectURL(item.preview);
        if (item.uploadedId)
          void fetch(`/api/chat/attachments/${item.uploadedId}`, { method: "DELETE" }).catch(
            () => {}
          );
      }
    },
    []
  );
  const choose = (selected: File[]) => {
    setError("");
    if (busy) return;
    if (files.length + selected.length > MAX_ATTACHMENTS) {
      setError("Attach up to 3 files per message.");
      return;
    }
    for (const file of selected) {
      const issue = attachmentError(file);
      if (issue) {
        setError(issue);
        return;
      }
    }
    if (
      [...files.map((item) => item.file), ...selected].reduce(
        (total, file) => total + file.size,
        0
      ) > MAX_MESSAGE_BYTES
    ) {
      setError("Keep attachments under 30 MB per message.");
      return;
    }
    replace([
      ...files,
      ...selected.map((file) => ({
        key: ++sequence.current,
        file,
        preview: attachmentSpec(file.name)?.kind !== "file" ? URL.createObjectURL(file) : "",
      })),
    ]);
  };
  const select = (event: ChangeEvent<HTMLInputElement>) => {
    choose(Array.from(event.target.files ?? []));
    event.target.value = "";
  };
  const remove = (key: number) => {
    const item = files.find((file) => file.key === key);
    if (item?.preview) URL.revokeObjectURL(item.preview);
    if (item?.uploadedId)
      void fetch(`/api/chat/attachments/${item.uploadedId}`, { method: "DELETE" }).catch(() => {});
    replace(files.filter((file) => file.key !== key));
    setError("");
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || (!message.trim() && !files.length)) return;
    setUploading(true);
    setError("");
    try {
      const ids: string[] = [];
      for (const item of current.current) {
        let id = item.uploadedId;
        if (!id) {
          const body = new FormData();
          body.set("file", item.file);
          const response = await fetch("/api/chat/attachments", { method: "POST", body });
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.error?.message || `Could not upload ${item.file.name}.`);
          id = result.attachment.id as string;
          replace(
            current.current.map((file) =>
              file.key === item.key ? { ...file, uploadedId: id } : file
            )
          );
        }
        ids.push(id);
      }
      if (await onSend(message, ids)) {
        current.current.forEach((file) => {
          if (file.preview) URL.revokeObjectURL(file.preview);
        });
        replace([]);
        setMessage("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send attachments. Try again.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <form
      onSubmit={send}
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        choose(Array.from(event.dataTransfer.files));
      }}
      className={`space-y-3 border-t border-border p-4 ${dragging ? "bg-lavender" : "bg-surface"}`}
    >
      {error && <Notice tone="danger">{error}</Notice>}
      {files.length > 0 && (
        <ul aria-label="Selected attachments" className="space-y-2">
          {files.map((item) => (
            <li
              key={item.key}
              className="flex items-center gap-3 rounded-md border border-border bg-background p-2"
            >
              {item.preview && attachmentSpec(item.file.name)?.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- Authenticated and local blob previews use the native image element.
                <img
                  src={item.preview}
                  alt={`Preview of ${item.file.name}`}
                  className="h-12 w-16 rounded-sm object-contain"
                />
              ) : item.preview ? (
                <video
                  src={item.preview}
                  aria-label={`Preview of ${item.file.name}`}
                  controls
                  preload="metadata"
                  className="h-16 w-24 rounded-sm"
                />
              ) : (
                <Icon name="file" size={24} />
              )}
              <div className="min-w-0 flex-1">
                <p className="break-words text-xs font-semibold">{item.file.name}</p>
                <p className="text-[11px] text-text-muted">{formatFileSize(item.file.size)}</p>
              </div>
              <Button
                variant="text"
                iconOnly
                disabled={busy}
                aria-label={`Remove ${item.file.name}`}
                onClick={() => remove(item.key)}
              >
                <Icon name="close" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Input
        label="Message #general"
        value={message}
        disabled={busy}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={500}
        helperText={`${message.length}/500 characters`}
        placeholder="Share an update…"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          ref={input}
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPT}
          aria-label="Select chat attachments"
          hidden
          disabled={busy}
          onChange={select}
        />
        <Button
          variant="secondary"
          disabled={busy || files.length >= MAX_ATTACHMENTS}
          leftIcon={<Icon name="attachment" />}
          onClick={() => input.current?.click()}
        >
          Attach files
        </Button>
        <Button
          type="submit"
          disabled={busy || (!message.trim() && !files.length)}
          isLoading={busy}
        >
          {uploading ? "Sending…" : "Send"}
        </Button>
      </div>
      <p className="text-[10px] leading-relaxed text-text-muted">
        Drop files here or attach up to 3. Images: 5 MB · Videos: 25 MB · Other files: 10 MB ·
        Total: 30 MB.
      </p>
    </form>
  );
}
