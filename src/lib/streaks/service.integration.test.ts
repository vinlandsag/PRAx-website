import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.TEST_DATABASE_URL;
const suite = describe.skipIf(!connectionString);
const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  : null;
const userIds: string[] = [];
const taskIds: string[] = [];
const submissionIds: string[] = [];

suite("streak engine PostgreSQL integration", () => {
  beforeAll(async () => {
    await prisma!.$connect();
  });

  afterEach(async () => {
    await prisma!.pointTransaction.deleteMany({
      where: { OR: [{ userId: { in: userIds } }, { reviewedById: { in: userIds } }] },
    });
    await prisma!.streakDay.deleteMany({ where: { userId: { in: userIds } } });
    await prisma!.streak.deleteMany({ where: { userId: { in: userIds } } });
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

  async function fixture() {
    const suffix = crypto.randomUUID();
    const member = await prisma!.user.create({
      data: {
        id: `streak-member-${suffix}`,
        email: `streak-member-${suffix}@example.test`,
        name: "Synthetic Streak Member",
        role: "MEMBER",
        status: "APPROVED",
      },
    });
    userIds.push(member.id);
    const reviewer = await prisma!.user.create({
      data: {
        id: `streak-admin-${suffix}`,
        email: `streak-admin-${suffix}@example.test`,
        name: "Synthetic Streak Reviewer",
        role: "ADMIN",
        status: "APPROVED",
      },
    });
    userIds.push(reviewer.id);
    const task = await prisma!.task.create({
      data: {
        title: "Synthetic streak task",
        description: "Integration-test task.",
        category: "Testing",
        pointsMax: 10,
        checklist: [],
        createdById: reviewer.id,
      },
    });
    taskIds.push(task.id);
    return { member, reviewer, task };
  }

  async function approvedSubmission(
    ids: Awaited<ReturnType<typeof fixture>>,
    reviewedAt: Date,
    status: "APPROVED" | "SUBMITTED" | "REJECTED" = "APPROVED"
  ) {
    const submission = await prisma!.submission.create({
      data: {
        taskId: ids.task.id,
        userId: ids.member.id,
        proofUrl: "https://example.test/streak-proof",
        note: "Synthetic streak approval.",
        status,
        reviewedAt: status === "SUBMITTED" ? null : reviewedAt,
        reviewedById: status === "SUBMITTED" ? null : ids.reviewer.id,
      },
    });
    submissionIds.push(submission.id);
    return submission;
  }

  async function record(submissionId: string) {
    const rows = await prisma!.$queryRaw<Array<{ recorded: boolean }>>`
      SELECT public.record_approved_submission_streak(${submissionId}) AS recorded
    `;
    return rows[0]?.recorded;
  }

  it("uses IST calendar dates and keeps one marker per user/day", async () => {
    const ids = await fixture();
    const base = new Date();
    const ist = new Date(base.getTime() + 330 * 60 * 1000);
    ist.setUTCHours(0, 0, 0, 0);
    ist.setUTCDate(ist.getUTCDate() - 1);
    const dateText = ist.toISOString().slice(0, 10);
    const boundary = new Date(`${dateText}T18:30:00.000Z`);
    const beforeBoundary = new Date(boundary.getTime() - 1_000);
    const afterBoundary = new Date(boundary.getTime());
    const before = await approvedSubmission(ids, beforeBoundary);
    const after = await approvedSubmission(ids, afterBoundary);

    expect(await record(before.id)).toBe(true);
    expect(await record(after.id)).toBe(true);
    const days = await prisma!.streakDay.findMany({
      where: { userId: ids.member.id },
      orderBy: { activityDate: "asc" },
    });
    expect(days.map((row) => row.activityDate.toISOString().slice(0, 10))).toEqual([
      dateText,
      new Date(boundary.getTime() + 330 * 60 * 1000).toISOString().slice(0, 10),
    ]);
  });

  it("counts consecutive approved days and resets after a full missed day", async () => {
    const ids = await fixture();
    const today = new Date(Date.now() + 330 * 60 * 1000);
    today.setUTCHours(12, 0, 0, 0);
    const dayAtISTNoon = (daysAgo: number) => {
      const instant = new Date(today);
      instant.setUTCDate(instant.getUTCDate() - daysAgo);
      return new Date(instant.getTime() - 330 * 60 * 1000);
    };
    const yesterday = await approvedSubmission(ids, dayAtISTNoon(1));
    const todaySubmission = await approvedSubmission(ids, dayAtISTNoon(0));
    await record(yesterday.id);
    await record(todaySubmission.id);
    expect(await prisma!.streak.findUnique({ where: { userId: ids.member.id } })).toMatchObject({
      current: 2,
      longest: 2,
    });

    const missedDayFixture = await fixture();
    const old = await approvedSubmission(missedDayFixture, dayAtISTNoon(2));
    await record(old.id);
    expect(
      await prisma!.streak.findUnique({ where: { userId: missedDayFixture.member.id } })
    ).toMatchObject({
      current: 0,
      longest: 1,
    });
  });

  it("ignores unapproved submissions and serializes concurrent same-day retries", async () => {
    const ids = await fixture();
    const now = new Date();
    const submitted = await approvedSubmission(ids, now, "SUBMITTED");
    expect(await record(submitted.id)).toBe(false);
    const rejected = await approvedSubmission(ids, now, "REJECTED");
    expect(await record(rejected.id)).toBe(false);
    expect(await prisma!.streakDay.count({ where: { userId: ids.member.id } })).toBe(0);

    const approved = await approvedSubmission(ids, now);
    const otherApproved = await approvedSubmission(ids, now);
    const retries = [
      ...Array.from({ length: 4 }, () => record(approved.id)),
      ...Array.from({ length: 4 }, () => record(otherApproved.id)),
    ];
    expect(await Promise.all(retries)).toEqual(Array(8).fill(true));
    expect(await prisma!.streakDay.count({ where: { userId: ids.member.id } })).toBe(1);
    expect(await prisma!.streak.findUnique({ where: { userId: ids.member.id } })).toMatchObject({
      current: 1,
      longest: 1,
    });
  });
});
