import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { dispatchApprovedPoints, getLeaderboard } from "./service";
import type { PointsTransactionPayload } from "./types";

const connectionString = process.env.TEST_DATABASE_URL;
const suite = describe.skipIf(!connectionString);
const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  : null;
const userIds: string[] = [];
const taskIds: string[] = [];
const submissionIds: string[] = [];

suite("points engine PostgreSQL integration", () => {
  beforeAll(async () => {
    await prisma!.$connect();
  });

  afterEach(async () => {
    await prisma!.pointTransaction.deleteMany({
      where: { OR: [{ userId: { in: userIds } }, { reviewedById: { in: userIds } }] },
    });
    await prisma!.submission.deleteMany({
      where: { OR: [{ id: { in: submissionIds } }, { userId: { in: userIds } }] },
    });
    await prisma!.task.deleteMany({ where: { id: { in: taskIds } } });
    await prisma!.user.deleteMany({ where: { id: { in: userIds } } });
    userIds.length = 0;
    taskIds.length = 0;
    submissionIds.length = 0;
  });

  afterAll(async () => {
    await prisma!.$disconnect();
  });

  async function fixture(
    status: "SUBMITTED" | "UNDER_REVIEW" = "UNDER_REVIEW",
    name = "Synthetic Points Member",
    memberPrefix = "points-member"
  ) {
    const suffix = crypto.randomUUID();
    const member = await prisma!.user.create({
      data: {
        id: `${memberPrefix}-${suffix}`,
        email: `points-member-${suffix}@example.test`,
        name,
        role: "MEMBER",
        status: "APPROVED",
      },
    });
    const admin = await prisma!.user.create({
      data: {
        id: `points-admin-${suffix}`,
        email: `points-admin-${suffix}@example.test`,
        name: "Synthetic Points Admin",
        role: "ADMIN",
        status: "APPROVED",
      },
    });
    userIds.push(member.id, admin.id);
    const task = await prisma!.task.create({
      data: {
        title: "Synthetic points task",
        description: "Integration test only.",
        category: "Testing",
        pointsMax: 25,
        checklist: [],
        lifecycle: "PUBLISHED",
        createdById: admin.id,
        publishedAt: new Date(),
      },
    });
    taskIds.push(task.id);
    const submission = await prisma!.submission.create({
      data: {
        taskId: task.id,
        userId: member.id,
        proofUrl: "https://example.test/synthetic-proof",
        note: "Synthetic points submission.",
        status,
      },
    });
    submissionIds.push(submission.id);
    return { member, admin, task, submission };
  }

  function payload(submissionId: string, reviewerId: string, score = 12): PointsTransactionPayload {
    return {
      submissionId,
      pointsAwarded: score,
      rubricVersion: "v-test",
      reviewedById: reviewerId,
      idempotencyKey: `pts_${submissionId}_v-test`,
    };
  }

  it.each([-1, 26, 1.5, Number.MAX_SAFE_INTEGER])(
    "rejects invalid score %s without approval",
    async (score) => {
      const { admin, submission } = await fixture();
      const result = await dispatchApprovedPoints(prisma!, payload(submission.id, admin.id, score));
      expect(result.success).toBe(false);
      expect(await prisma!.submission.findUnique({ where: { id: submission.id } })).toMatchObject({
        status: "UNDER_REVIEW",
        pointsAwarded: null,
      });
      expect(await prisma!.pointTransaction.count({ where: { submissionId: submission.id } })).toBe(
        0
      );
    }
  );

  it("rejects a reviewer who is not an approved admin", async () => {
    const { member, submission } = await fixture();
    const result = await dispatchApprovedPoints(prisma!, payload(submission.id, member.id));
    expect(result).toMatchObject({ success: false, error: "REVIEWER_NOT_AUTHORIZED" });
    expect(await prisma!.submission.findUnique({ where: { id: submission.id } })).toMatchObject({
      status: "UNDER_REVIEW",
    });
  });

  it("records zero and maximum scores, with all approval data in the same transaction", async () => {
    const zeroFixture = await fixture();
    const zero = await dispatchApprovedPoints(
      prisma!,
      payload(zeroFixture.submission.id, zeroFixture.admin.id, 0)
    );
    expect(zero).toMatchObject({ success: true, pointsAwarded: 0, alreadyProcessed: false });
    expect(
      await prisma!.submission.findUnique({ where: { id: zeroFixture.submission.id } })
    ).toMatchObject({
      status: "APPROVED",
      pointsAwarded: 0,
      reviewedById: zeroFixture.admin.id,
    });

    const maxFixture = await fixture("SUBMITTED");
    const maximum = await dispatchApprovedPoints(
      prisma!,
      payload(maxFixture.submission.id, maxFixture.admin.id, maxFixture.task.pointsMax)
    );
    expect(maximum).toMatchObject({ success: true, pointsAwarded: 25 });
  });

  it("makes exact retries and concurrent duplicate awards idempotent", async () => {
    const { admin, submission } = await fixture();
    const request = payload(submission.id, admin.id);
    const results = await Promise.all([
      dispatchApprovedPoints(prisma!, request),
      dispatchApprovedPoints(prisma!, request),
    ]);
    expect(results.every((result) => result.success)).toBe(true);
    expect(results.filter((result) => !result.alreadyProcessed)).toHaveLength(1);
    expect(await prisma!.pointTransaction.count({ where: { submissionId: submission.id } })).toBe(
      1
    );
    expect(await dispatchApprovedPoints(prisma!, request)).toMatchObject({
      success: true,
      alreadyProcessed: true,
    });
  });

  it("rejects a conflicting idempotency key before changing submission state", async () => {
    const { admin, task, submission } = await fixture();
    const otherFixture = await fixture();
    const another = otherFixture.submission;
    const collisionKey = `pts_${submission.id}_v-test`;
    await prisma!.pointTransaction.create({
      data: {
        submissionId: another.id,
        userId: another.userId,
        reviewedById: admin.id,
        amount: 1,
        maxPoints: task.pointsMax,
        rubricVersion: "v-test",
        idempotencyKey: collisionKey,
      },
    });

    const result = await dispatchApprovedPoints(prisma!, payload(submission.id, admin.id));
    expect(result).toMatchObject({ success: false, error: "IDEMPOTENCY_CONFLICT" });
    expect(await prisma!.submission.findUnique({ where: { id: submission.id } })).toMatchObject({
      status: "UNDER_REVIEW",
      pointsAwarded: null,
    });
    expect(await prisma!.pointTransaction.count({ where: { submissionId: submission.id } })).toBe(
      0
    );
  });

  it("rejects an altered retry after an award", async () => {
    const { admin, submission } = await fixture();
    await dispatchApprovedPoints(prisma!, payload(submission.id, admin.id, 12));
    expect(
      await dispatchApprovedPoints(prisma!, payload(submission.id, admin.id, 11))
    ).toMatchObject({
      success: false,
      error: "IDEMPOTENCY_CONFLICT",
    });
    expect(await prisma!.pointTransaction.count({ where: { submissionId: submission.id } })).toBe(
      1
    );
  });

  it("derives weekly and all-time totals from the immutable points ledger", async () => {
    const current = await fixture();
    const older = await fixture();
    const now = new Date("2026-11-04T12:00:00.000Z");
    await prisma!.submission.update({
      where: { id: current.submission.id },
      data: { status: "APPROVED" },
    });
    await prisma!.submission.update({
      where: { id: older.submission.id },
      data: { userId: current.member.id, status: "APPROVED" },
    });
    await prisma!.pointTransaction.createMany({
      data: [
        {
          submissionId: current.submission.id,
          userId: current.member.id,
          reviewedById: current.admin.id,
          amount: 20,
          maxPoints: current.task.pointsMax,
          rubricVersion: "v-ledger-test",
          idempotencyKey: `pts_${current.submission.id}_v-ledger-test`,
          createdAt: new Date("2026-11-01T18:30:00.000Z"),
        },
        {
          submissionId: older.submission.id,
          userId: current.member.id,
          reviewedById: older.admin.id,
          amount: 10,
          maxPoints: older.task.pointsMax,
          rubricVersion: "v-ledger-test",
          idempotencyKey: `pts_${older.submission.id}_v-ledger-test`,
          createdAt: new Date("2026-11-01T18:29:59.999Z"),
        },
      ],
    });

    const weekly = await getLeaderboard(
      prisma!,
      current.member.id,
      { period: "weekly", limit: 20, offset: 0 },
      now
    );
    const alltime = await getLeaderboard(
      prisma!,
      current.member.id,
      { period: "alltime", limit: 20, offset: 0 },
      now
    );
    expect(weekly.entries.find((entry) => entry.id === current.member.id)?.points).toBe(20);
    expect(alltime.entries.find((entry) => entry.id === current.member.id)?.points).toBe(30);
    expect(weekly.currentUser).toMatchObject({ id: current.member.id, points: 20, rank: 1 });
    expect(alltime.pagination.total).toBe(1);
  });

  it("uses deterministic tie order, paginates, and returns the caller's standing and row ahead", async () => {
    const alpha = await fixture("UNDER_REVIEW", "Alex Builder", "tie-a");
    const beta = await fixture("UNDER_REVIEW", "Alex Builder", "tie-b");
    for (const item of [alpha, beta]) {
      await prisma!.submission.update({
        where: { id: item.submission.id },
        data: { status: "APPROVED" },
      });
      await prisma!.pointTransaction.create({
        data: {
          submissionId: item.submission.id,
          userId: item.member.id,
          reviewedById: item.admin.id,
          amount: 15,
          maxPoints: item.task.pointsMax,
          rubricVersion: "v-tie",
          idempotencyKey: `pts_${item.submission.id}_v-tie`,
        },
      });
    }

    const firstPage = await getLeaderboard(prisma!, beta.member.id, {
      period: "alltime",
      limit: 1,
      offset: 0,
    });
    expect(firstPage.entries).toMatchObject([{ id: alpha.member.id, rank: 1, points: 15 }]);
    expect(firstPage.currentUser).toMatchObject({ id: beta.member.id, rank: 2, points: 15 });
    expect(firstPage.userAhead).toMatchObject({ id: alpha.member.id, rank: 1 });
    expect(firstPage.pagination).toMatchObject({ limit: 1, offset: 0, total: 2, hasMore: true });

    const secondPage = await getLeaderboard(prisma!, beta.member.id, {
      period: "alltime",
      limit: 1,
      offset: 1,
    });
    expect(secondPage.entries).toMatchObject([{ id: beta.member.id, rank: 2 }]);
    expect(secondPage.currentUser).toMatchObject({ id: beta.member.id, rank: 2 });
    expect(secondPage.pagination.hasMore).toBe(false);
  });

  it("excludes non-approved members and submissions and returns only public leaderboard fields", async () => {
    const valid = await fixture("UNDER_REVIEW", "Visible Member", "visible");
    const rejectedSubmission = await fixture("UNDER_REVIEW", "No Rejected Work", "rejected-work");
    const inactiveMember = await fixture("UNDER_REVIEW", "Inactive Member", "inactive");
    for (const submission of [
      valid.submission,
      rejectedSubmission.submission,
      inactiveMember.submission,
    ]) {
      await prisma!.submission.update({
        where: { id: submission.id },
        data: { status: submission === rejectedSubmission.submission ? "REJECTED" : "APPROVED" },
      });
    }
    await prisma!.user.update({
      where: { id: inactiveMember.member.id },
      data: { status: "REJECTED" },
    });
    for (const item of [valid, rejectedSubmission, inactiveMember]) {
      await prisma!.pointTransaction.create({
        data: {
          submissionId: item.submission.id,
          userId: item.member.id,
          reviewedById: item.admin.id,
          amount: 10,
          maxPoints: item.task.pointsMax,
          rubricVersion: "v-privacy",
          idempotencyKey: `pts_${item.submission.id}_v-privacy`,
        },
      });
    }

    const result = await getLeaderboard(prisma!, valid.member.id, {
      period: "alltime",
      limit: 20,
      offset: 0,
    });
    expect(result.entries.map((entry) => entry.id)).toEqual([valid.member.id]);
    expect(result.currentUser).toMatchObject({ id: valid.member.id, points: 10 });
    expect(Object.keys(result.entries[0]).sort()).toEqual([
      "id",
      "name",
      "points",
      "rank",
      "streak",
    ]);
  });
});
