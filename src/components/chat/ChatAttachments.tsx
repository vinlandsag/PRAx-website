"use client";
import { useState } from "react";
import { Icon } from "@/components/ui";
import type { ChatAttachment } from "@/lib/workspace/types";
import { formatFileSize } from "@/lib/workspace/attachment-policy";

function Attachment({ file }: { file: ChatAttachment }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="mt-2 max-w-sm rounded-md border border-border bg-background p-2">
      {!failed && file.kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element -- Authenticated and local blob previews use the native image element.
        <img
          src={file.url}
          alt={file.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="max-h-56 max-w-full rounded-sm object-contain"
        />
      )}
      {!failed && file.kind === "video" && (
        <video
          controls
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
          className="max-h-64 w-full rounded-sm"
          aria-label={file.name}
        >
          <source src={file.url} type={file.mimeType} />
          Your browser cannot play this video.
        </video>
      )}
      {failed && (
        <p className="mb-2 text-[11px] text-text-muted">
          Preview unavailable. You can download the file below.
        </p>
      )}
      <a
        href={`${file.url}?download=1`}
        download={file.name}
        className="mt-2 flex items-start gap-2 text-xs font-semibold text-primary hover:underline"
      >
        <Icon name="file" className="shrink-0" />
        <span className="min-w-0 break-words">
          {file.name}
          <span className="mt-1 block text-[10px] font-normal text-text-muted">
            {formatFileSize(file.size)} · Download
          </span>
        </span>
      </a>
    </div>
  );
}
export function ChatAttachments({ files }: { files: ChatAttachment[] }) {
  return (
    <div aria-label="Message attachments">
      {files.map((file) => (
        <Attachment key={file.id} file={file} />
      ))}
    </div>
  );
}
