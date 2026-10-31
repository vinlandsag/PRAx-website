import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({ getPrismaClient: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({ getPrismaClient: mocks.getPrismaClient }));

const member: SessionUser = {
  id: "synthetic-member",
  name: "Synthetic Member",
  email: "member@example.test",
  role: "MEMBER",
  status: "APPROVED",
};

function request(url = "http://localhost/api/leaderboard") {
  return new Request(url, {
    headers: { cookie: `prax_session=${signSession(member)}` },
  });
}

describe("GET /api/leaderboard", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", "test-only-secret-with-more-than-32-characters");
    mocks.getPrismaClient.mockReturnValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("requires an authenticated session", async () => {
    const response = await GET(new Request("http://localhost/api/leaderboard"));
    expect(response.status).toBe(401);
  });

  it.each([
    "period=daily",
    "period=weekly&period=alltime",
    "limit=0",
    "offset=100001",
    "limit=5&limit=10",
  ])("rejects invalid query parameters (%s) before querying persistence", async (query) => {
    const response = await GET(request(`http://localhost/api/leaderboard?${query}`));
    expect(response.status).toBe(400);
    expect(mocks.getPrismaClient).not.toHaveBeenCalled();
  });

  it("returns the standard unavailable response when no database is configured", async () => {
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
