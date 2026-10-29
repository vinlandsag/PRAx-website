import { randomUUID } from "node:crypto";
import { WorkspaceError } from "./error";
import type { ChatAttachment } from "./types";
import {
  attachmentError,
  attachmentSpec,
  MAX_ATTACHMENTS,
  MAX_MESSAGE_BYTES,
} from "./attachment-policy";

interface StoredAttachment {
  meta: ChatAttachment;
  bytes: Uint8Array;
  ownerId: string;
  messageId?: string;
  createdAt: number;
}
function signature(bytes: Uint8Array, extension: string) {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value),
    ascii = (start: number, end: number) => new TextDecoder().decode(bytes.slice(start, end));
  if (extension === "png") return starts(137, 80, 78, 71, 13, 10, 26, 10);
  if (extension === "jpg" || extension === "jpeg") return starts(255, 216, 255);
  if (extension === "gif") return ["GIF87a", "GIF89a"].includes(ascii(0, 6));
  if (extension === "webp") return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  if (extension === "mp4" || extension === "mov")
    return (
      ascii(4, 8) === "ftyp" &&
      [
        "isom",
        "iso2",
        "avc1",
        "mp41",
        "mp42",
        "M4V ",
        "qt  ",
        "MSNV",
        "dash",
        "3gp4",
        "3gp5",
      ].includes(ascii(8, 12))
    );
  if (extension === "webm") return starts(26, 69, 223, 163) && ascii(0, 4096).includes("webm");
  if (extension === "ogv") return ascii(0, 4) === "OggS";
  if (extension === "pdf") return ascii(0, 5) === "%PDF-";
  if (["zip", "docx", "xlsx", "pptx"].includes(extension))
    return starts(80, 75, 3, 4) || (extension === "zip" && starts(80, 75, 5, 6));
  if (extension === "mp3")
    return ascii(0, 3) === "ID3" || (bytes[0] === 255 && (bytes[1] & 224) === 224);
  if (extension === "wav") return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE";
  try {
    return !new TextDecoder("utf-8", { fatal: true }).decode(bytes).includes("\0");
  } catch {
    return false;
  }
}
class AttachmentStore {
  private files = new Map<string, StoredAttachment>();
  private sweep() {
    for (const [id, file] of this.files)
      if (!file.messageId && Date.now() - file.createdAt > 30 * 60_000) this.files.delete(id);
  }
  put(ownerId: string, name: string, bytes: Uint8Array) {
    this.sweep();
    name =
      name
        .split(/[\\/]/)
        .pop()
        ?.replace(/[\x00-\x1f\x7f]/g, "")
        .slice(0, 160) || "file";
    const problem = attachmentError({ name, size: bytes.byteLength }),
      spec = attachmentSpec(name);
    if (problem || !spec) throw new WorkspaceError(problem || "Unsupported file.");
    if (!signature(bytes, spec.extension))
      throw new WorkspaceError("The file contents do not match its format. Choose a valid file.");
    let total = 0,
      own = 0;
    for (const file of this.files.values()) {
      total += file.bytes.byteLength;
      if (file.ownerId === ownerId) own += file.bytes.byteLength;
    }
    if (total + bytes.byteLength > 128 * 1024 * 1024 || own + bytes.byteLength > 60 * 1024 * 1024)
      throw new WorkspaceError(
        "Temporary upload storage is full. Remove unused files or try later.",
        429
      );
    const id = randomUUID(),
      meta: ChatAttachment = {
        id,
        name,
        size: bytes.byteLength,
        mimeType: spec.mime,
        kind: spec.kind,
        url: `/api/chat/attachments/${id}`,
      };
    this.files.set(id, { meta, bytes: new Uint8Array(bytes), ownerId, createdAt: Date.now() });
    return { ...meta };
  }
  claim(ids: unknown, ownerId: string, messageId: string): ChatAttachment[] {
    this.sweep();
    if (
      !Array.isArray(ids) ||
      ids.length > MAX_ATTACHMENTS ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => typeof id !== "string")
    )
      throw new WorkspaceError("Choose up to 3 different attachments.");
    const files = ids.map((id) => {
      const file = this.files.get(id);
      if (!file || file.ownerId !== ownerId || file.messageId)
        throw new WorkspaceError("Attachment unavailable. Select it again.", 403);
      return file;
    });
    if (files.reduce((sum, file) => sum + file.bytes.byteLength, 0) > MAX_MESSAGE_BYTES)
      throw new WorkspaceError("Keep attachments under 30 MB per message.");
    files.forEach((file) => {
      file.messageId = messageId;
    });
    return files.map((file) => ({ ...file.meta }));
  }
  get(id: string, viewerId: string) {
    this.sweep();
    const file = this.files.get(id);
    if (!file || (!file.messageId && file.ownerId !== viewerId))
      throw new WorkspaceError("Attachment not found.", 404);
    return file;
  }
  removePending(id: string, ownerId: string) {
    const file = this.files.get(id);
    if (!file || file.ownerId !== ownerId) throw new WorkspaceError("Attachment not found.", 404);
    if (file.messageId)
      throw new WorkspaceError("Remove the message to delete its attachments.", 409);
    this.files.delete(id);
  }
  removeMessage(messageId: string) {
    for (const [id, file] of this.files) if (file.messageId === messageId) this.files.delete(id);
  }
  reset() {
    this.files.clear();
  }
}
const root = globalThis as typeof globalThis & { praxChatAttachments?: AttachmentStore };
export const attachmentStore = (root.praxChatAttachments ??= new AttachmentStore());
