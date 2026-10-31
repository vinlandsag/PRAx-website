import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as me } from "@/app/api/users/me/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as workspace } from "@/app/api/workspace/route";
import { verifySession, signSession } from "./session";
import { resetRateLimits, RATE_LIMIT_POLICIES } from "./rate-limit";
import { proxy } from "@/proxy";
const credentials = { email: "member@prax.build", password: "MemberPass123!" };
function request(
  data: unknown = credentials,
  url = "http://localhost:3000/api/auth/login",
  headers: Record<string, string> = {}
) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
}
function cookieOf(response: Response) {
  return response.headers.get("set-cookie")?.split(";")[0] || "";
}
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("SESSION_SECRET", "test-only-development-member-key-more-than-32-chars");
  resetRateLimits();
});
afterEach(() => {
  vi.unstubAllEnvs();
  resetRateLimits();
});
describe("preserved local development test account", () => {
  it("signs in with the original credentials and passes the protected page guard", async () => {
    const response = await login(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const user = (await response.json()).user;
    expect(user).toEqual({
      id: "usr_member_01",
      email: "member@prax.build",
      name: "Arjun Varma",
      role: "MEMBER",
      status: "APPROVED",
    });
    const cookie = cookieOf(response);
    expect(Boolean(response.headers.get("set-cookie")?.includes("HttpOnly"))).toBe(true);
    const token = cookie.slice(cookie.indexOf("=") + 1);
    expect(verifySession(token)?.user.id).toBe("usr_member_01");
    expect(verifySession(token)?.developmentOnly).toBe(true);
    expect(
      proxy(new NextRequest("http://localhost:3000/dashboard", { headers: { cookie } })).status
    ).toBe(200);
  });
  it("resolves the fixture's authenticated current-user lookup", async () => {
    const response = await login(request());
    const result = await me(
      new Request("http://localhost:3000/api/users/me", { headers: { cookie: cookieOf(response) } })
    );
    expect(result.status).toBe(200);
    expect((await result.json()).user.email).toBe(credentials.email);
  });
  it("normalizes email and supports the numeric loopback host", async () => {
    expect(
      (
        await login(
          request(
            { ...credentials, email: " MEMBER@PRAX.BUILD " },
            "http://127.0.0.1:3000/api/auth/login"
          )
        )
      ).status
    ).toBe(200);
  });
  it("rejects a wrong password without issuing a session", async () => {
    const response = await login(request({ ...credentials, password: "incorrect-password" }));
    expect(response.status).toBe(401);
    expect(response.headers.has("set-cookie")).toBe(false);
  });
  it.each(["production", "test"])("does not accept fixture credentials in %s", async (mode) => {
    vi.stubEnv("NODE_ENV", mode);
    const response = await login(request());
    expect(response.status).toBe(503);
    expect(response.headers.has("set-cookie")).toBe(false);
  });
  it("does not expose the fixture on a nonlocal host", async () => {
    const response = await login(request(credentials, "http://prax.example/api/auth/login"));
    expect(response.status).toBe(503);
    expect(response.headers.has("set-cookie")).toBe(false);
  });
  it("checks the Host header and rejects foreign Origin writes", async () => {
    expect(
      (
        await login(
          request(credentials, "http://localhost:3000/api/auth/login", { host: "prax.example" })
        )
      ).status
    ).toBe(503);
    expect(
      (
        await login(
          request(credentials, "http://localhost:3000/api/auth/login", {
            origin: "https://external.example",
          })
        )
      ).status
    ).toBe(403);
  });
  it("requires a private signing key instead of restoring the default development secret", async () => {
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("NEXTAUTH_SECRET", "");
    const response = await login(request());
    expect(response.status).toBe(503);
    expect(response.headers.has("set-cookie")).toBe(false);
  });
  it("does not restore real-user login, mock workspace data or production fixture lookup", async () => {
    expect(
      (await login(request({ email: "someone@example.test", password: "test-only-password" })))
        .status
    ).toBe(503);
    const response = await login(request());
    const cookie = cookieOf(response);
    expect(
      (await workspace(new Request("http://localhost:3000/api/workspace", { headers: { cookie } })))
        .status
    ).toBe(503);
    vi.stubEnv("NODE_ENV", "production");
    expect(
      (await me(new Request("http://localhost:3000/api/users/me", { headers: { cookie } }))).status
    ).toBe(401);
  });
  it("rejects missing, forged and non-fixture current-user sessions", async () => {
    expect((await me(new Request("http://localhost:3000/api/users/me"))).status).toBe(401);
    expect(
      (
        await me(
          new Request("http://localhost:3000/api/users/me", {
            headers: { cookie: "prax_session=forged.invalid" },
          })
        )
      ).status
    ).toBe(401);
    const token = signSession({
      id: "another",
      email: "another@example.test",
      name: "Other",
      role: "MEMBER",
      status: "APPROVED",
    });
    expect(
      (
        await me(
          new Request("http://localhost:3000/api/users/me", {
            headers: { cookie: "prax_session=" + token },
          })
        )
      ).status
    ).toBe(503);
  });
  it("rejects a development-issued session in production even with the same private key", async () => {
    const response = await login(request());
    const cookie = cookieOf(response);
    const token = cookie.slice(cookie.indexOf("=") + 1);
    vi.stubEnv("NODE_ENV", "production");
    expect(verifySession(token)).toBeNull();
    expect(
      proxy(new NextRequest("http://localhost:3000/dashboard", { headers: { cookie } })).status
    ).toBe(307);
    expect(
      (await me(new Request("http://localhost:3000/api/users/me", { headers: { cookie } }))).status
    ).toBe(401);
  });
  it("rate limits repeated login attempts", async () => {
    for (let i = 0; i < RATE_LIMIT_POLICIES.login.limit; i++)
      await login(request({ ...credentials, password: "incorrect-password" }));
    expect((await login(request())).status).toBe(429);
  });
  it("validates malformed credentials and retains logout", async () => {
    expect((await login(request({ email: credentials.email, password: 1 }))).status).toBe(400);
    const signedOut = await logout();
    expect(signedOut.status).toBe(200);
    expect(Boolean(signedOut.headers.get("set-cookie")?.includes("Max-Age=0"))).toBe(true);
  });
});
