import { describe, expect, it } from "vitest";
import { readJsonObject } from "./request";

function request(
  body: string,
  headers: Record<string, string> = { "content-type": "application/json" }
) {
  return new Request("http://localhost/api/example", { method: "POST", headers, body });
}

describe("readJsonObject", () => {
  it("returns JSON objects from bounded JSON requests", async () => {
    const result = await readJsonObject(request('{"name":"synthetic"}'));
    expect(result).toEqual({ ok: true, value: { name: "synthetic" } });
  });

  it.each(["[]", "null", "not-json", ""])(
    "rejects non-object or malformed JSON: %s",
    async (body) => {
      const result = await readJsonObject(request(body));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(400);
        expect(await result.response.json()).toEqual({
          error: { code: "VALIDATION_ERROR", message: "Provide a valid JSON object.", status: 400 },
        });
      }
    }
  );

  it("rejects unsupported content type and declared oversize bodies", async () => {
    expect((await readJsonObject(request("{}", { "content-type": "text/plain" }))).ok).toBe(false);
    expect(
      (
        await readJsonObject(
          request("{}", { "content-type": "application/json", "content-length": "5000" }),
          { maxBytes: 100 }
        )
      ).ok
    ).toBe(false);
  });

  it("enforces the byte limit when Content-Length is absent or understated", async () => {
    const result = await readJsonObject(request('{"content":"long"}'), { maxBytes: 8 });
    expect(result.ok).toBe(false);
  });
});
