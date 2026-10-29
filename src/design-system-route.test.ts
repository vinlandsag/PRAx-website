import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";
afterEach(() => vi.unstubAllEnvs());
describe("development review route boundary", () => {
  it.each(["/design-system", "/design-system/"])("allows %s only in development", (path) => {
    vi.stubEnv("NODE_ENV", "development");
    expect(proxy(new NextRequest(`http://localhost${path}`)).status).toBe(200);
    vi.stubEnv("NODE_ENV", "production");
    expect(proxy(new NextRequest(`http://localhost${path}`)).status).toBe(404);
    vi.stubEnv("NODE_ENV", "test");
    expect(proxy(new NextRequest(`http://localhost${path}`)).status).toBe(404);
  });
  it("permits the local font and artwork without opening protected routes", () => {
    expect(proxy(new NextRequest("http://localhost/fonts/InterVariable.woff2")).status).toBe(200);
    expect(proxy(new NextRequest("http://localhost/artwork/task-sql.png")).status).toBe(200);
    expect(proxy(new NextRequest("http://localhost/dashboard")).status).toBe(307);
  });
});
