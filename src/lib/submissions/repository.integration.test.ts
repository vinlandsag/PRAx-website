import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/auth/types";
import {
  createSubmission,
  getSubmission,
  listOwnSubmissions,
  updateOwnSubmission,
  withdrawOwnSubmission,
} from "./service";

const connectionString = process.env.TEST_DATABASE_URL;
const suite = describe.skipIf(!connectionString);
const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  : null;
const ownerIds: string[] = [];
const taskIds: string[] = [];

suite("submission repository PostgreSQL integration", () => {
  beforeAll(async () => {
    await prisma!.$connect();
  });

  afterEach(async () => {
    await prisma!.submission.deleteMany({
      where: { OR: [{ userId: { in: ownerIds } }, { taskId: { in: taskIds } }] },
    });
    await prisma!.task.deleteMany({ where: { id: { in: taskIds } } });
    await prisma!.user.deleteMany({ where: { id: { in: ownerIds } } });
    ownerIds.length = 0;
    taskIds.length = 0;
  });

  afterAll(async () => {
    await prisma!.$disconnect();
  });

  async function fixture() {
    const suffix = crypto.randomUUID();
    const user = await prisma!.user.create({
      data: {
        id: `submission-test-${suffix}`,
        email: `submission-test-${suffix}@example.test`,
        name: "Synthetic Submission Member",
        role: "MEMBER",
        status: "APPROVED",
      },
    });
    ownerIds.push(user.id);
    const task = await prisma!.task.create({
      data: {
        title: "Synthetic submission task",
        description: "Integration-test task.",
        category: "Testing",
        pointsMax: 25,
        checklist: [],
        lifecycle: "PUBLISHED",
        createdById: user.id,
        publishedAt: new Date(),
      },
    });
    taskIds.push(task.id);
    const session: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };
    const input = {
      taskId: task.id,
      proofUrl: "https://example.test/synthetic-proof",
      note: "Synthetic work submitted for an integration test.",
    };
    return { session, task, input };
  }

  async function historicalAttempt(
    userId: string,
    taskId: string,
    status: "REJECTED" | "REVISION_REQUESTED" | "UNDER_REVIEW"
  ) {
    return prisma!.submission.create({
      data: {
        userId,
        taskId,
        proofUrl: "https://example.test/old-proof",
        note: "Previous reviewed attempt.",
        status,
        feedback: status === "UNDER_REVIEW" ? null : "Please improve this result.",
        ...(status === "UNDER_REVIEW" ? {} : { reviewedAt: new Date() }),
      },
    });
  }

  it("creates one submitted attempt and rejects a duplicate active attempt", async () => {
    const { session, input } = await fixture();
    const created = await createSubmission(prisma!, session, input);
    expect(created).toMatchObject({
      ok: true,
      submission: { status: "SUBMITTED", userId: session.id },
    });
    const duplicate = await createSubmission(prisma!, session, input);
    expect(duplicate).toMatchObject({
      ok: false,
      response: { status: 409 },
    });
  });

  it("uses the database constraint to reject concurrent duplicate submissions", async () => {
    const { session, input } = await fixture();
    const results = await Promise.all([
      createSubmission(prisma!, session, input),
      createSubmission(prisma!, session, input),
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok).map((result) => result.response.status)).toEqual([
      409,
    ]);
    expect(
      await prisma!.submission.count({ where: { userId: session.id, taskId: input.taskId } })
    ).toBe(1);
  });

  it("allows owner edits and withdrawal before review, hides foreign ownership, and preserves the attempt", async () => {
    const { session, input } = await fixture();
    const created = await createSubmission(prisma!, session, input);
    if (!created.ok) throw new Error("Synthetic submission should be created.");

    const changed = await updateOwnSubmission(prisma!, created.submission.id, session.id, {
      note: "Updated synthetic explanation.",
    });
    expect(changed).toMatchObject({
      ok: true,
      submission: { note: "Updated synthetic explanation.", status: "SUBMITTED" },
    });

    const foreign = await withdrawOwnSubmission(prisma!, created.submission.id, "another-user");
    expect(foreign).toMatchObject({ ok: false, response: { status: 404 } });
    const withdrawn = await withdrawOwnSubmission(prisma!, created.submission.id, session.id);
    expect(withdrawn).toMatchObject({ ok: true, submission: { status: "WITHDRAWN" } });
    expect(await prisma!.submission.count({ where: { id: created.submission.id } })).toBe(1);

    const retry = await createSubmission(prisma!, session, input);
    expect(retry).toMatchObject({ ok: true, submission: { status: "SUBMITTED" } });
  });

  it("blocks edits and withdrawal once a reviewer has started review", async () => {
    const { session, input } = await fixture();
    const created = await createSubmission(prisma!, session, input);
    if (!created.ok) throw new Error("Synthetic submission should be created.");
    await prisma!.submission.update({
      where: { id: created.submission.id },
      data: { status: "UNDER_REVIEW" },
    });

    const changed = await updateOwnSubmission(prisma!, created.submission.id, session.id, {
      note: "Attempt to alter a reviewed submission.",
    });
    expect(changed).toMatchObject({ ok: false, response: { status: 409 } });
    const withdrawn = await withdrawOwnSubmission(prisma!, created.submission.id, session.id);
    expect(withdrawn).toMatchObject({ ok: false, response: { status: 409 } });
  });

  it.each(["REJECTED", "REVISION_REQUESTED"] as const)(
    "allows a new attempt after %s and retains the previous review",
    async (status) => {
      const { session, input } = await fixture();
      const prior = await historicalAttempt(session.id, input.taskId, status);
      const retry = await createSubmission(prisma!, session, input);
      expect(retry).toMatchObject({ ok: true, submission: { status: "SUBMITTED" } });
      if (!retry.ok) return;
      expect(retry.submission.id).not.toBe(prior.id);
      expect(await prisma!.submission.findUnique({ where: { id: prior.id } })).toMatchObject({
        status,
        feedback: "Please improve this result.",
      });
    }
  );

  it("lists only the signed-in member's attempts with status and pagination metadata", async () => {
    const { session, input } = await fixture();
    const created = await createSubmission(prisma!, session, input);
    if (!created.ok) throw new Error("Synthetic submission should be created.");
    const result = await listOwnSubmissions(prisma!, session, {
      status: "SUBMITTED",
      limit: 10,
      offset: 0,
    });
    expect(result.submissions.map((item) => item.id)).toEqual([created.submission.id]);
    expect(result.pagination).toEqual({ limit: 10, offset: 0, total: 1, hasMore: false });
  });

  it("hides a submission detail from a different member even with its direct ID", async () => {
    const { session, input } = await fixture();
    const created = await createSubmission(prisma!, session, input);
    if (!created.ok) throw new Error("Synthetic submission should be created.");
    const other = await prisma!.user.create({
      data: {
        id: `submission-foreign-${crypto.randomUUID()}`,
        email: `submission-foreign-${crypto.randomUUID()}@example.test`,
        name: "Synthetic Other Member",
        role: "MEMBER",
        status: "APPROVED",
      },
    });
    ownerIds.push(other.id);
    const foreignSession: SessionUser = {
      id: other.id,
      email: other.email,
      name: other.name,
      role: other.role,
      status: other.status,
    };

    expect(await getSubmission(prisma!, created.submission.id, foreignSession, true)).toMatchObject(
      {
        ok: false,
        response: { status: 404 },
      }
    );
  });
});
