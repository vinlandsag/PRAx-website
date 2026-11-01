import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { parseTaskListQuery } from "./query";
import { listTasks } from "./service";
import type { SessionUser } from "@/lib/auth/types";

const connectionString = process.env.TEST_DATABASE_URL;
const suite = describe.skipIf(!connectionString);
const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  : null;
const owners: string[] = [];

const day = (n: number) => new Date(Date.UTC(2026, 0, n));

suite("task repository PostgreSQL integration", () => {
  beforeAll(async () => {
    await prisma!.$connect();
  });

  afterEach(async () => {
    for (const ownerId of owners.splice(0)) {
      await prisma!.submission.deleteMany({ where: { userId: ownerId } });
      await prisma!.task.deleteMany({ where: { createdById: ownerId } });
      await prisma!.user.delete({ where: { id: ownerId } });
    }
  });

  afterAll(async () => {
    await prisma!.$disconnect();
  });

  async function dataset() {
    const suffix = crypto.randomUUID();
    const category = `Test-${suffix}`;
    const user = await prisma!.user.create({
      data: {
        id: `task-test-${suffix}`,
        email: `task-test-${suffix}@example.test`,
        name: "Synthetic Task Member",
        role: "MEMBER",
        status: "APPROVED",
      },
    });
    owners.push(user.id);
    const rows = [];
    for (const [name, pointsMax, createdAt, lifecycle] of [
      ["Open task", 10, day(1), "PUBLISHED"],
      ["Submitted task", 50, day(2), "PUBLISHED"],
      ["Approved task", 20, day(3), "PUBLISHED"],
      ["Rejected task", 30, day(4), "PUBLISHED"],
      ["Draft task", 100, day(5), "DRAFT"],
      ["Archived task", 100, day(6), "ARCHIVED"],
    ] as const) {
      rows.push(
        await prisma!.task.create({
          data: {
            title: name,
            description: `Synthetic ${name}`,
            category,
            pointsMax,
            checklist: ["Synthetic acceptance item"],
            lifecycle,
            createdById: user.id,
            createdAt,
            ...(lifecycle === "PUBLISHED" ? { publishedAt: createdAt } : {}),
          },
        })
      );
    }
    for (const [index, status] of (["UNDER_REVIEW", "APPROVED", "REJECTED"] as const).entries()) {
      await prisma!.submission.create({
        data: {
          taskId: rows[index + 1].id,
          userId: user.id,
          proofUrl: "https://example.test/proof",
          note: "Synthetic submission",
          status,
          submittedAt: day(index + 2),
        },
      });
    }
    const session: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    return { session, rows, category };
  }

  async function list(user: SessionUser, query: string, category?: string) {
    const params = new URLSearchParams(query);
    if (category) params.set("category", category);
    const parsed = parseTaskListQuery(params, user.role);
    if (!parsed.ok) throw new Error("The integration fixture query must be valid.");
    return listTasks(prisma!, user, parsed.value);
  }

  it("filters member task status from the latest submission and hides unpublished tasks", async () => {
    const { session, rows, category } = await dataset();
    expect((await list(session, "status=open", category)).tasks.map((task) => task.id)).toEqual([rows[0].id]);
    expect((await list(session, "status=submitted", category)).tasks.map((task) => task.id)).toEqual([
      rows[1].id,
    ]);
    expect((await list(session, "status=approved", category)).tasks.map((task) => task.id)).toEqual([
      rows[2].id,
    ]);
    expect((await list(session, "status=rejected", category)).tasks.map((task) => task.id)).toEqual([
      rows[3].id,
    ]);
  });

  it("sorts by newest/points and paginates with total metadata", async () => {
    const { session, rows, category } = await dataset();
    const newest = await list(session, "sort=newest&limit=2", category);
    expect(newest.tasks.map((task) => task.id)).toEqual([rows[3].id, rows[2].id]);
    expect(newest.pagination).toEqual({ limit: 2, offset: 0, total: 4, hasMore: true });

    const points = await list(session, "sort=points&limit=1&offset=1", category);
    expect(points.tasks.map((task) => task.id)).toEqual([rows[3].id]);
    expect(points.pagination).toEqual({ limit: 1, offset: 1, total: 4, hasMore: true });
  });

  it("returns a correctly paginated empty result", async () => {
    const { session } = await dataset();
    const result = await list(session, `category=NoSuchCategory-${crypto.randomUUID()}`);
    expect(result).toEqual({
      tasks: [],
      pagination: { limit: 20, offset: 0, total: 0, hasMore: false },
    });
  });

  it("allows admins to filter draft/published/archived lifecycle separately", async () => {
    const { session, rows, category } = await dataset();
    const admin = { ...session, id: "admin-in-test", role: "ADMIN" as const };
    const drafts = await list(admin, "status=draft", category);
    expect(drafts.tasks.map((task) => task.id)).toEqual([rows[4].id]);
    expect(drafts.tasks[0].lifecycle).toBe("DRAFT");
  });

  it("enforces important database constraints", async () => {
    const { session } = await dataset();
    await expect(
      prisma!.task.create({
        data: {
          title: "Invalid points",
          description: "Synthetic invalid row",
          category: "Testing",
          pointsMax: -1,
          createdById: session.id,
        },
      })
    ).rejects.toThrow();
    await expect(
      prisma!.inviteCode.create({
        data: { codeHash: crypto.randomUUID(), maxUses: 0, createdById: session.id },
      })
    ).rejects.toThrow();
  });
});
