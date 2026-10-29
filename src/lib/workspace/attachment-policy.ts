export const MAX_ATTACHMENTS = 3;
export const MAX_MESSAGE_BYTES = 30 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const image = { max: 5 * 1024 * 1024, kind: "image" as const };
const video = { max: MAX_UPLOAD_BYTES, kind: "video" as const };
const file = { max: 10 * 1024 * 1024, kind: "file" as const };
const formats = {
  png: { ...image, mime: "image/png" },
  jpg: { ...image, mime: "image/jpeg" },
  jpeg: { ...image, mime: "image/jpeg" },
  gif: { ...image, mime: "image/gif" },
  webp: { ...image, mime: "image/webp" },
  mp4: { ...video, mime: "video/mp4" },
  mov: { ...video, mime: "video/quicktime" },
  webm: { ...video, mime: "video/webm" },
  ogv: { ...video, mime: "video/ogg" },
  pdf: { ...file, mime: "application/pdf" },
  txt: { ...file, mime: "text/plain" },
  csv: { ...file, mime: "text/csv" },
  md: { ...file, mime: "text/plain" },
  json: { ...file, mime: "text/plain" },
  zip: { ...file, mime: "application/zip" },
  docx: {
    ...file,
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  xlsx: { ...file, mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  pptx: {
    ...file,
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  mp3: { ...file, mime: "audio/mpeg" },
  wav: { ...file, mime: "audio/wav" },
};
export const ATTACHMENT_ACCEPT = Object.keys(formats)
  .map((ext) => `.${ext}`)
  .join(",");
export function attachmentSpec(name: string) {
  const extension = name.toLowerCase().split(".").pop() ?? "";
  return Object.hasOwn(formats, extension)
    ? { ...formats[extension as keyof typeof formats], extension }
    : null;
}
export function attachmentError(file: { name: string; size: number }) {
  const spec = attachmentSpec(file.name);
  if (!spec) return "Choose an image, video, PDF, text, ZIP, Office document or audio file.";
  if (!file.size) return "Empty files cannot be sent.";
  if (file.size > spec.max)
    return `${file.name} is too large. Limit: ${spec.max / 1024 / 1024} MB.`;
  return "";
}
export function formatFileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.ceil(size / 1024))} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`;
}
