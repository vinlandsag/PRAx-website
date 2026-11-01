import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";

const dbState = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("@/lib/db/prisma", () => ({ getPrismaClient: () => dbState.client }));

import { GET as getTasks } from "@/app/api/tasks/route";
import { POST as submit } from "@/app/api/submissions/route";
import { GET as reviewQueue } from "@/app/api/admin/submissions/route";
import { POST as approve } from "@/app/api/admin/submissions/[id]/approve/route";
import { POST as reject } from "@/app/api/admin/submissions/[id]/reject/route";
import { POST as requestRevision } from "@/app/api/admin/submissions/[id]/request-revision/route";
import { GET as getLeaderboard } from "@/app/api/leaderboard/route";
import { GET as getStreaks } from "@/app/api/streaks/route";

const connectionString = process.env.TEST_DATABASE_URL;
const suite = describe.skipIf(!connectionString);
const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  : null;
const createdUserIds: string[] = [];
const createdTaskIds: string[] = [];

const sessionSecret = "synthetic-core-loop-session-secret-over-32-characters";

function request(
  path: string,
  options: { user?: SessionUser; method?: string; body?: unknown } = {}
) {
  const headers = new Headers();
  if (options.user) headers.set("cookie", `prax_session=${signSession(options.user)}`);
  if (options.body !== undefined) headers.set("content-type", "application/json");
  return new Request(`http://localhost${path}`, {
    method: options.method ?? "GET",
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
}

async function context() {
  const suffix = randomUUID();
  const member = await prisma!.user.create({
    data: {
      id: `loop-member-${suffix}`,
      email: `loop-member-${suffix}@example.test`,
      name: "Synthetic Loop Member",
      role: "MEMBER",
      status: "APPROVED",
    },
  });
  createdUserIds.push(member.id);
  const admin = await prisma!.user.create({
    data: {
      id: `loop-admin-${suffix}`,
      email: `loop-admin-${suffix}@example.test`,
      name: "Synthetic Loop Admin",
      role: "ADMIN",
      status: "APPROVED",
    },
  });
  createdUserIds.push(admin.id);
  const task = await prisma!.task.create({
    data: {
      title: `Core loop ${suffix}`,
      description: "Synthetic end-to-end task fixture.",
      category: `Loop-${suffix}`,
      pointsMax: 20,
      checklist: ["Complete the synthetic acceptance check."],
      lifecycle: "PUBLISHED",
      createdById: admin.id,
      publishedAt: new Date(),
    },
  });
  createdTaskIds.push(task.id);

  const memberSession: SessionUser = {
    id: member.id,
    email: member.email,
    name: member.name,
    role: member.role,
    status: member.status,
  };
  const adminSession: SessionUser = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    status: admin.status,
  };
  return { member, admin, task, memberSession, adminSession };
}

async function createSubmission(member: SessionUser, taskId: string) {
  return submit(
    request("/api/submissions", {
      user: member,
      method: "POST",
      body: {
        taskId,
        proofUrl: "https://example.test/synthetic-proof",
        note: "I completed the task and included the requested proof.",
      },
    })
  );
}

function approveRequest(admin: SessionUser, submissionId: string, pointsAwarded: number) {
  return approve(
    request(`/api/admin/submissions/${submissionId}/approve`, {
      user: admin,
      method: "POST",
      body: { pointsAwarded },
    }),
    { params: Promise.resolve({ id: submissionId }) }
  );
}

suite("task-to-points core loop PostgreSQL integration", () => {
  beforeAll(async () => {
    vi.stubEnv("SESSION_SECRET", sessionSecret);
    dbState.client = prisma;
    await prisma!.$connect();
  });

  afterEach(async () => {
    const userIds = createdUserIds.splice(0);
    const taskIds = createdTaskIds.splice(0);
    if (!userIds.length) return;
    await prisma!.streakDay.deleteMany({ where: { userId: { in: userIds } } });
    await prisma!.streak.deleteMany({ where: { userId: { in: userIds } } });
    await prisma!.pointTransaction.deleteMany({
      where: { OR: [{ userId: { in: userIds } }, { reviewedById: { in: userIds } }] },
    });
    await prisma!.submission.deleteMany({ where: { userId: { in: userIds } } });
    await prisma!.task.deleteMany({ where: { id: { in: taskIds } } });
    await prisma!.user.deleteMany({ where: { id: { in: userIds } } });
  });

  afterAll(async () => {
    await prisma!.$disconnect();
    vi.unstubAllEnvs();
    dbState.client = null;
  });

  it("browses, submits, approves once, and immediately updates leaderboard and IST streak", async () => {
    const { member, task, memberSession, adminSession } = await context();

    const browseResponse = await getTasks(
      request(`/api/tasks?category=${encodeURIComponent(task.category)}&status=open`, {
        user: memberSession,
      })
    );
    expect(browseResponse.status).toBe(200);
    expect((await browseResponse.json()).tasks.map((row: { id: string }) => row.id)).toContain(
      task.id
    );

    const submitResponse = await createSubmission(memberSession, task.id);
    expect(submitResponse.status).toBe(201);
    const { submission } = await submitResponse.json();
    expect(submission).toMatchObject({ userId: member.id, taskId: task.id, status: "SUBMITTED" });

    const queueResponse = await reviewQueue(
      request("/api/admin/submissions?status=SUBMITTED", { user: adminSession })
    );
    expect(queueResponse.status).toBe(200);
    expect((await queueResponse.json()).submissions.map((row: { id: string }) => row.id)).toContain(
      submission.id
    );

    const approvals = await Promise.all([
      approveRequest(adminSession, submission.id, 15),
      approveRequest(adminSession, submission.id, 15),
    ]);
    expect(approvals.map((response) => response.status)).toEqual([200, 200]);
    const approvalResults = await Promise.all(approvals.map((response) => response.json()));
    expect(approvalResults.filter((result) => !result.alreadyProcessed)).toHaveLength(1);
    expect(approvalResults.filter((result) => result.alreadyProcessed)).toHaveLength(1);
    expect(await prisma!.pointTransaction.count({ where: { submissionId: submission.id } })).toBe(1);
    expect(await prisma!.submission.findUnique({ where: { id: submission.id } })).toMatchObject({
      status: "APPROVED",
      pointsAwarded: 15,
      reviewedById: adminSession.id,
      rubricVersion: "mvp-default-v1",
    });

    const leaderboardResponse = await getLeaderboard(
      request("/api/leaderboard?period=alltime", { user: memberSession })
    );
    expect(leaderboardResponse.status).toBe(200);
    expect((await leaderboardResponse.json()).currentUser).toMatchObject({
      id: member.id,
      points: 15,
      rank: 1,
    });

    const streakResponse = await getStreaks(request("/api/streaks", { user: memberSession }));
    expect(streakResponse.status).toBe(200);
    const streak = await streakResponse.json();
    expect(streak.current).toBe(1);
    expect(streak.longest).toBe(1);
    expect(streak.activeDays).toHaveLength(1);
  });

  it("denies member review access and rejects invalid/forged award fields without mutation", async () => {
    const { task, memberSession, adminSession } = await context();
    const submitResponse = await createSubmission(memberSession, task.id);
    const { submission } = await submitResponse.json();

    expect((await reviewQueue(request("/api/admin/submissions", { user: memberSession }))).status)
      .toBe(403);
    expect((await approveRequest(memberSession, submission.id, 10)).status).toBe(403);
    expect((await approveRequest(adminSession, submission.id, 21)).status).toBe(400);

    const forgedReviewer = await approve(
      request(`/api/admin/submissions/${submission.id}/approve`, {
        user: adminSession,
        method: "POST",
        body: { pointsAwarded: 10, reviewedById: memberSession.id },
      }),
      { params: Promise.resolve({ id: submission.id }) }
    );
    expect(forgedReviewer.status).toBe(400);
    expect(await prisma!.submission.findUnique({ where: { id: submission.id } })).toMatchObject({
      status: "SUBMITTED",
      pointsAwarded: null,
      reviewedById: null,
    });
    expect(await prisma!.pointTransaction.count({ where: { submissionId: submission.id } })).toBe(0);
  });

  it("records rejection and revision without points and permits a fresh attempt", async () => {
    const { task, memberSession, adminSession } = await context();
    const firstResponse = await createSubmission(memberSession, task.id);
    const { submission: first } = await firstResponse.json();
    const rejected = await reject(
      request(`/api/admin/submissions/${first.id}/reject`, {
        user: adminSession,
        method: "POST",
        body: { feedback: "Please include a clearer proof link." },
      }),
      { params: Promise.resolve({ id: first.id }) }
    );
    expect(rejected.status).toBe(200);
    expect((await rejected.json()).submission.status).toBe("REJECTED");
    expect(await prisma!.pointTransaction.count({ where: { submissionId: first.id } })).toBe(0);

    const secondResponse = await createSubmission(memberSession, task.id);
    expect(secondResponse.status).toBe(201);
    const { submission: second } = await secondResponse.json();
    const revision = await requestRevision(
      request(`/api/admin/submissions/${second.id}/request-revision`, {
        user: adminSession,
        method: "POST",
        body: { feedback: "Please add one missing acceptance detail." },
      }),
      { params: Promise.resolve({ id: second.id }) }
    );
    expect(revision.status).toBe(200);
    expect((await revision.json()).submission.status).toBe("REVISION_REQUESTED");
    expect(await prisma!.pointTransaction.count({ where: { userId: memberSession.id } })).toBe(0);
    expect((await createSubmission(memberSession, task.id)).status).toBe(201);
  });
});
