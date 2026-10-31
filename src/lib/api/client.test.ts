import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiRequestError } from "./client";
import { signSession, verifySession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { normalizeInviteCode, validateInviteCode } from "@/lib/auth/invite";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("service client and retained security helpers", () => {
  it("preserves typed backend failures instead of treating them as saved", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: { code: "BACKEND_NOT_CONFIGURED", message: "Not connected" } },
            { status: 503 }
          )
        )
    );
    await expect(apiRequest("/api/workspace")).rejects.toMatchObject({
      status: 503,
      code: "BACKEND_NOT_CONFIGURED",
      message: "Not connected",
    });
  });
  it("reports unreadable upstream responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>error</html>", { status: 502 }))
    );
    await expect(apiRequest("/api/tasks")).rejects.toBeInstanceOf(ApiRequestError);
  });
  it("handles real empty successful responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    expect(await apiRequest("/api/notifications", { method: "PATCH" })).toBeUndefined();
  });
  it("cannot issue or accept sessions with a default development secret", () => {
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("NEXTAUTH_SECRET", "");
    expect(() =>
      signSession({
        id: "test",
        name: "Test",
        email: "test@example.test",
        role: "MEMBER",
        status: "APPROVED",
      })
    ).toThrow(/SESSION_SECRET/);
    expect(verifySession("payload.signature")).toBeNull();
  });
  it("retains salted password verification without seeded accounts", async () => {
    const first = await hashPassword("test-only-password");
    const second = await hashPassword("test-only-password");
    expect(first).not.toBe(second);
    expect(await verifyPassword("test-only-password", first)).toBe(true);
    expect(await verifyPassword("incorrect", first)).toBe(false);
  });
  it("rejects absent invites and normalizes supplied codes without generating a fake acceptance", () => {
    expect(normalizeInviteCode("  prax-xxxx-yyyy  ")).toBe("PRAX-XXXX-YYYY");
    expect(validateInviteCode(null).valid).toBe(false);
  });
});
