import { afterEach, describe, expect, it, vi } from "vitest";
import { logApiFailure } from "./logger";

afterEach(() => vi.restoreAllMocks());

describe("logApiFailure", () => {
  it("emits only a fixed event and a safe opaque request id", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    logApiFailure("unexpected_error", "req_123");
    expect(error).toHaveBeenCalledWith(
      JSON.stringify({ level: "error", event: "unexpected_error", requestId: "req_123" })
    );
  });

  it("omits malformed request ids", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    logApiFailure("request_failed", "user@example.test\nprivate payload");
    expect(error).toHaveBeenCalledWith(JSON.stringify({ level: "error", event: "request_failed" }));
  });

  it("logs only safe failure stage and error code diagnostics", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    logApiFailure("unexpected_error", undefined, {
      stage: "database_transaction",
      code: "P2010",
    });
    expect(error).toHaveBeenCalledWith(
      JSON.stringify({
        level: "error",
        event: "unexpected_error",
        stage: "database_transaction",
        code: "P2010",
      })
    );
  });

  it("drops unsafe diagnostic text", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    logApiFailure("unexpected_error", undefined, {
      stage: "database transaction; password=private",
      code: "P2010 private text",
    });
    expect(error).toHaveBeenCalledWith(
      JSON.stringify({ level: "error", event: "unexpected_error" })
    );
  });
});
