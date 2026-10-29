import { workspaceActor, sameOriginWrite, workspaceErrorResponse } from "@/lib/workspace/access";
import { attachmentStore } from "@/lib/workspace/attachment-store";
import { errors } from "@/lib/errors";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await workspaceActor(request);
  if (user instanceof Response) return user;
  try {
    const file = attachmentStore.get((await params).id, user.id),
      size = file.bytes.byteLength;
    const download =
      new URL(request.url).searchParams.get("download") === "1" || file.meta.kind === "file";
    const name = encodeURIComponent(file.meta.name).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    );
    const headers = new Headers({
      "Content-Type": file.meta.mimeType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="download"; filename*=UTF-8''${name}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
      "Cache-Control": "private, no-store",
      "Accept-Ranges": "bytes",
    });
    let start = 0,
      end = size - 1,
      status = 200;
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match && (match[1] || match[2])) {
        start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
        end = match[1] ? (match[2] ? Math.min(Number(match[2]), size - 1) : size - 1) : size - 1;
      } else start = -1;
      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start < 0 ||
        start >= size ||
        end < start
      ) {
        headers.set("Content-Range", `bytes */${size}`);
        return new Response(null, { status: 416, headers });
      }
      status = 206;
      headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    }
    headers.set("Content-Length", String(end - start + 1));
    return new Response(new Uint8Array(file.bytes.slice(start, end + 1)).buffer, {
      status,
      headers,
    });
  } catch (error) {
    return workspaceErrorResponse(error);
  }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await workspaceActor(request);
  if (user instanceof Response) return user;
  if (!sameOriginWrite(request)) return errors.forbidden();
  try {
    attachmentStore.removePending((await params).id, user.id);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return workspaceErrorResponse(error);
  }
}
