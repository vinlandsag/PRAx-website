import { afterEach, describe, expect, it, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";

const mocks = vi.hoisted(() => ({
  getPrismaClient: vi.fn(),
  requirePersistedAccount: vi.fn(),
  getLeaderboard: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({ getPrismaClient: mocks.getPrismaClient }));
vi.mock("@/lib/tasks/service", () => ({ requirePersistedAccount: mocks.requirePersistedAccount }));
vi.mock("@/lib/points/service", () => ({ getLeaderboard: mocks.getLeaderboard }));

import { GET } from "./route";

const member: SessionUser = {
  id: "dashboard-member",
  name: "Dashboard Member",
  email: "dashboard@example.test",
  role: "MEMBER",
  status: "APPROVED",
};
const secret = "synthetic-dashboard-route-secret-over-32-characters";

function request(user?: SessionUser) {
  const headers = new Headers();
  if (user) headers.set("cookie", `prax_session=${signSession(user)}`);
  return new Request("http://localhost/api/dashboard", { headers });
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("GET /api/dashboard", () => {
  it("requires an authenticated session", async () => {
    vi.stubEnv("SESSION_SECRET", secret);
    expect((await GET(request())).status).toBe(401);
    expect(mocks.getPrismaClient).not.toHaveBeenCalled();
  });

  it("returns the signed-in member's persisted score, rank, streak, approvals and activity", async () => {
    vi.stubEnv("SESSION_SECRET", secret);
    const userId = member.id;
    const activityDate = new Date("2026-11-01T12:00:00.000Z");
    const prisma = {
      pointTransaction: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 31 } }) },
      submission: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi
          .fn()
          .mockResolvedValue([
            { id: "approved-1", reviewedAt: activityDate, task: { title: "Build a feature" } },
          ]),
      },
      streak: { findUnique: vi.fn().mockResolvedValue({ current: 4 }) },
    };
    mocks.getPrismaClient.mockReturnValue(prisma);
    mocks.requirePersistedAccount.mockResolvedValue({ ok: true, account: member });
    mocks.getLeaderboard.mockResolvedValue({ currentUser: { rank: 3 } });

    const response = await GET(request(member));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      totalPoints: 31,
      weeklyRank: 3,
      dayStreak: 4,
      tasksApproved: 2,
      activity: [
        {
          id: "approved-1",
          title: "Approved: Build a feature",
          createdAt: activityDate.toISOString(),
        },
      ],
    });
    expect(prisma.pointTransaction.aggregate).toHaveBeenCalledWith({
      where: { userId, submission: { status: "APPROVED" } },
      _sum: { amount: true },
    });
    expect(prisma.submission.count).toHaveBeenCalledWith({
      where: { userId, status: "APPROVED" },
    });
    expect(prisma.streak.findUnique).toHaveBeenCalledWith({
      where: { userId },
      select: { current: true },
    });
    expect(mocks.getLeaderboard).toHaveBeenCalledWith(prisma, userId, {
      period: "weekly",
      limit: 1,
      offset: 0,
    });
  });

  it("returns empty/zero metrics when the member has no approved work yet", async () => {
    vi.stubEnv("SESSION_SECRET", secret);
    const prisma = {
      pointTransaction: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }) },
      submission: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      streak: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    mocks.getPrismaClient.mockReturnValue(prisma);
    mocks.requirePersistedAccount.mockResolvedValue({ ok: true, account: member });
    mocks.getLeaderboard.mockResolvedValue({ currentUser: null });

    const response = await GET(request(member));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      totalPoints: 0,
      weeklyRank: null,
      dayStreak: 0,
      tasksApproved: 0,
      activity: [],
    });
  });

  it("does not return data for a user that no longer has an approved persisted account", async () => {
    vi.stubEnv("SESSION_SECRET", secret);
    mocks.getPrismaClient.mockReturnValue({});
    mocks.requirePersistedAccount.mockResolvedValue({
      ok: false,
      response: Response.json({ error: { code: "ACCOUNT_NOT_ACTIVE" } }, { status: 403 }),
    });

    expect((await GET(request(member))).status).toBe(403);
    expect(mocks.getLeaderboard).not.toHaveBeenCalled();
  });
});
