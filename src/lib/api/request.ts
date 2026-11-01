import { apiError } from "@/lib/errors";

export type JsonObjectResult =
  { ok: true; value: Record<string, unknown> } | { ok: false; response: Response };

/** Read a bounded JSON object and return the shared API validation envelope on failure. */
export async function readJsonObject(
  request: Request,
  options: { maxBytes?: number; message?: string } = {}
): Promise<JsonObjectResult> {
  const maxBytes = options.maxBytes ?? 64 * 1024;
  const message = options.message ?? "Provide a valid JSON object.";
  const invalid = () => ({
    ok: false as const,
    response: apiError("VALIDATION_ERROR", message, 400),
  });

  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") return invalid();

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength) || Number(contentLength) > maxBytes) return invalid();
  }

  if (!request.body) return invalid();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return invalid();
      }
      chunks.push(value);
    }
  } catch {
    return invalid();
  } finally {
    reader.releaseLock();
  }

  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return invalid();
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return invalid();
  }
}
