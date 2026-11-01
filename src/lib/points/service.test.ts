import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { dispatchApprovedPoints, parseLeaderboardQuery, startOfCurrentISTWeek } from "./service";

function pointsFixture(prior: Record<string, unknown> | null = null, taskMax = 25) {
  const tx = {
    submission: {
      findUnique: vi.fn().mockResolvedValue({
        id: "submission-1",
        userId: "persisted-member",
        status: "UNDER_REVIEW",
        task: { pointsMax: taskMax },
        author: { status: "APPROVED" },
      }),
    },
    pointTransaction: {
      findFirst: vi.fn().mockResolvedValue(prior),
      create: vi.fn().mockResolvedValue({ id: "point-log-1" }),
    },
    user: { findUnique: vi.fn().mockResolvedValue({ role: "ADMIN", status: "APPROVED" }) },
    $executeRaw: vi.fn().mockResolvedValue(1),
    $queryRaw: vi.fn().mockResolvedValue([{ recorded: true }]),
  };
  const prisma = {
    $transaction: vi.fn((callback: (transaction: typeof tx) => unknown) => callback(tx)),
  };
  return { tx, prisma: prisma as unknown as PrismaClient };
}

function awardPayload(pointsAwarded: number) {
  return {
    submissionId: "submission-1",
    pointsAwarded,
    rubricVersion: "v1",
    reviewedById: "persisted-admin",
    idempotencyKey: "pts_submission-1_v1",
  };
}

describe("points period helpers", () => {
  it("accepts only the UI's weekly and all-time periods", () => {
    expect(parseLeaderboardQuery(new URLSearchParams())).toMatchObject({
      ok: true,
      value: { period: "weekly", limit: 20, offset: 0 },
    });
    expect(
      parseLeaderboardQuery(new URLSearchParams("period=alltime&limit=5&offset=10"))
    ).toMatchObject({
      ok: true,
      value: { period: "alltime", limit: 5, offset: 10 },
    });
    for (const query of [
      "period=all-time",
      "period=daily",
      "period=weekly&period=alltime",
      "limit=0",
      "limit=101",
      "offset=-1",
      "offset=100001",
      "limit=10&limit=20",
    ]) {
      expect(parseLeaderboardQuery(new URLSearchParams(query)).ok).toBe(false);
    }
  });

  it("uses Monday at 00:00 IST, including when the UTC date is Sunday", () => {
    expect(startOfCurrentISTWeek(new Date("2026-11-01T18:30:00.000Z")).toISOString()).toBe(
      "2026-11-01T18:30:00.000Z"
    );
    expect(startOfCurrentISTWeek(new Date("2026-11-01T17:59:59.000Z")).toISOString()).toBe(
      "2026-10-25T18:30:00.000Z"
    );
  });
});

describe("points award validation", () => {
  it.each([-1, 26, 1.5, Number.MAX_SAFE_INTEGER])(
    "rejects a score outside 0..25: %s",
    async (score) => {
      const { tx, prisma } = pointsFixture();
      const result = await dispatchApprovedPoints(prisma, awardPayload(score));
      expect(result.success).toBe(false);
      expect(tx.$executeRaw).not.toHaveBeenCalled();
      expect(tx.pointTransaction.create).not.toHaveBeenCalled();
    }
  );

  it.each([0, 25])(
    "accepts valid inclusive score boundary %s and derives recipient",
    async (score) => {
      const { tx, prisma } = pointsFixture();
      expect(await dispatchApprovedPoints(prisma, awardPayload(score))).toMatchObject({
        success: true,
        pointsAwarded: score,
      });
      expect(tx.pointTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: "persisted-member", amount: score, maxPoints: 25 }),
        select: { id: true },
      });
      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    }
  );

  it("denies a reviewer who is not an approved admin before changing submission state", async () => {
    const { tx, prisma } = pointsFixture();
    tx.user.findUnique.mockResolvedValue({ role: "MEMBER", status: "APPROVED" });
    expect(await dispatchApprovedPoints(prisma, awardPayload(10))).toMatchObject({
      success: false,
      error: "REVIEWER_NOT_AUTHORIZED",
    });
    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(tx.pointTransaction.create).not.toHaveBeenCalled();
  });

  it("acknowledges an exact prior award and rejects changed retry values", async () => {
    const prior = {
      id: "point-log-1",
      submissionId: "submission-1",
      userId: "persisted-member",
      reviewedById: "persisted-admin",
      amount: 10,
      maxPoints: 25,
      rubricVersion: "v1",
      idempotencyKey: "pts_submission-1_v1",
    };
    const exact = pointsFixture(prior);
    expect(await dispatchApprovedPoints(exact.prisma, awardPayload(10))).toMatchObject({
      success: true,
      alreadyProcessed: true,
      transactionId: "point-log-1",
    });
    expect(exact.tx.$executeRaw).not.toHaveBeenCalled();

    const changed = pointsFixture(prior);
    expect(await dispatchApprovedPoints(changed.prisma, awardPayload(11))).toMatchObject({
      success: false,
      error: "IDEMPOTENCY_CONFLICT",
    });
    expect(changed.tx.$executeRaw).not.toHaveBeenCalled();
  });

  it("acknowledges an exact retry after the task maximum is edited", async () => {
    const prior = {
      id: "point-log-1",
      submissionId: "submission-1",
      userId: "persisted-member",
      reviewedById: "persisted-admin",
      amount: 10,
      maxPoints: 25,
      rubricVersion: "v1",
      idempotencyKey: "pts_submission-1_v1",
    };
    const { tx, prisma } = pointsFixture(prior, 24);
    expect(await dispatchApprovedPoints(prisma, awardPayload(10))).toMatchObject({
      success: true,
      alreadyProcessed: true,
    });
    expect(tx.$executeRaw).not.toHaveBeenCalled();
  });

  it("propagates a ledger write failure from inside the transaction", async () => {
    const { tx, prisma } = pointsFixture();
    tx.pointTransaction.create.mockRejectedValue(new Error("synthetic database failure"));
    await expect(dispatchApprovedPoints(prisma, awardPayload(10))).rejects.toThrow(
      "synthetic database failure"
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.pointTransaction.create).toHaveBeenCalledTimes(1);
  });

  it("propagates a streak refresh failure so approval and points roll back together", async () => {
    const { tx, prisma } = pointsFixture();
    tx.$queryRaw.mockRejectedValue(new Error("synthetic streak refresh failure"));
    await expect(dispatchApprovedPoints(prisma, awardPayload(0))).rejects.toThrow(
      "synthetic streak refresh failure"
    );
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.pointTransaction.create).toHaveBeenCalledTimes(1);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
