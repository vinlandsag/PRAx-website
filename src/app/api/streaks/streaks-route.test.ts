import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({ getPrismaClient: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({ getPrismaClient: mocks.getPrismaClient }));

const member: SessionUser = {
  id: "signed-in-member",
  name: "Synthetic Member",
  email: "member@example.test",
  role: "MEMBER",
  status: "APPROVED",
};

function request(url = "http://localhost/api/streaks") {
  return new Request(url, {
    headers: { cookie: `prax_session=${signSession(member)}` },
  });
}

describe("GET /api/streaks", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", "test-only-secret-with-more-than-32-characters");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("requires an authenticated session", async () => {
    const response = await GET(new Request("http://localhost/api/streaks"));
    expect(response.status).toBe(401);
  });

  it("returns only the persisted signed-in member's streak data", async () => {
    const account = { ...member, createdAt: new Date(), updatedAt: new Date() };
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(account) },
      streak: { findUnique: vi.fn().mockResolvedValue({ current: 3, longest: 6 }) },
      streakDay: {
        findMany: vi.fn().mockResolvedValue([{ activityDate: new Date("2026-10-31T00:00:00Z") }]),
      },
    };
    mocks.getPrismaClient.mockReturnValue(prisma);

    const response = await GET(request("http://localhost/api/streaks?userId=forged-user"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      current: 3,
      longest: 6,
      activeDays: ["2026-10-31"],
    });
    expect(prisma.streak.findUnique).toHaveBeenCalledWith({
      where: { userId: "signed-in-member" },
    });
    expect(prisma.streakDay.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: "signed-in-member" }) })
    );
  });
});
