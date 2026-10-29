import { workspaceActor, sameOriginWrite, workspaceErrorResponse } from "@/lib/workspace/access";
import { attachmentStore } from "@/lib/workspace/attachment-store";
import { MAX_UPLOAD_BYTES } from "@/lib/workspace/attachment-policy";
import { WorkspaceError } from "@/lib/workspace/error";
import { errors } from "@/lib/errors";

export async function POST(request: Request) {
  const user = await workspaceActor(request);
  if (user instanceof Response) return user;
  if (!sameOriginWrite(request)) return errors.forbidden();
  try {
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
      throw new WorkspaceError("Select a file to upload.");
    const reader = request.body?.getReader();
    if (!reader) throw new WorkspaceError("Select a file to upload.");
    const chunks: ArrayBuffer[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_UPLOAD_BYTES + 65536) {
        await reader.cancel();
        throw new WorkspaceError("Upload exceeds the 25 MB limit.", 413);
      }
      chunks.push(new Uint8Array(value).buffer);
    }
    let form: FormData;
    try {
      // Blob.type lowercases its value, which would corrupt case-sensitive
      // WebKit multipart boundaries. Preserve the original header separately.
      form = await new Response(new Blob(chunks), {
        headers: { "Content-Type": request.headers.get("content-type")! },
      }).formData();
    } catch {
      throw new WorkspaceError("Invalid file upload. Select the file again.");
    }
    const fields = [...form.entries()];
    if (fields.length !== 1 || fields[0][0] !== "file" || !(fields[0][1] instanceof File))
      throw new WorkspaceError("Upload one file at a time.");
    const file = fields[0][1];
    return Response.json(
      {
        attachment: attachmentStore.put(
          user.id,
          file.name,
          new Uint8Array(await file.arrayBuffer())
        ),
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return workspaceErrorResponse(error);
  }
}
