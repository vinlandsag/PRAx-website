import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";

// WRITTEN BUT NOT RUN in the environment where it was authored: it needs a separate, migrated
// TEST_DATABASE_URL that includes migration 20261101190000_personal_space_and_chat. It proves the
// Personal Space privacy rules against a real PostgreSQL database through the real route handlers.
const dbState = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("@/lib/db/prisma", () => ({ getPrismaClient: () => dbState.client }));

import { GET, PATCH } from "@/app/api/space/route";

const connectionString = process.env.TEST_DATABASE_URL;
const suite = describe.skipIf(!connectionString);
const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  : null;
const sessionSecret = "synthetic-space-integration-secret-over-32-characters";
const userIds: string[] = [];

type Person = { session: SessionUser; id: string };
async function createPerson(
  role: "MEMBER" | "ADMIN",
  dbStatus: "APPROVED" | "SUSPENDED" | "PENDING_APPROVAL" = "APPROVED"
): Promise<Person> {
  const suffix = randomUUID();
  const row = await prisma!.user.create({
    data: {
      id: `space-${role.toLowerCase()}-${suffix}`,
      email: `space-${role.toLowerCase()}-${suffix}@example.test`,
      name: `Space ${role} ${suffix.slice(0, 8)}`,
      role,
      status: dbStatus,
    },
  });
  userIds.push(row.id);
  // The cookie always claims APPROVED, so a non-approved database status models a stale session.
  return {
    id: row.id,
    session: { id: row.id, email: row.email, name: row.name, role: row.role, status: "APPROVED" },
  };
}

function call(person: Person | null, body?: unknown) {
  const headers = new Headers();
  if (person) headers.set("cookie", `prax_session=${signSession(person.session)}`);
  if (body !== undefined) {
    headers.set("content-type", "application/json");
    headers.set("origin", "http://localhost");
  }
  return new Request("http://localhost/api/space", {
    method: body === undefined ? "GET" : "PATCH",
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
const read = (person: Person) => GET(call(person));
const write = (person: Person, body: unknown) => PATCH(call(person, body));

async function createdIds(person: Person) {
  const space = await (await read(person)).json();
  return {
    todo: space.todos[0]?.id as string,
    note: space.notes[0]?.id as string,
    goal: space.goals[0]?.id as string,
  };
}

suite("Personal Space PostgreSQL integration (privacy and constraints)", () => {
  beforeAll(async () => {
    vi.stubEnv("SESSION_SECRET", sessionSecret);
    dbState.client = prisma;
    await prisma!.$connect();
    const tables = await prisma!.$queryRaw<Array<{ todo: string | null }>>`
      SELECT to_regclass('public."Todo"')::text AS todo`;
    if (!tables[0]?.todo)
      throw new Error(
        "Apply migration 20261101190000_personal_space_and_chat to TEST_DATABASE_URL before running this suite."
      );
  });

  afterEach(async () => {
    const ids = userIds.splice(0);
    // Tasks reference their creator with RESTRICT; everything else cascades from the user.
    await prisma!.task.deleteMany({ where: { createdById: { in: ids } } });
    await prisma!.user.deleteMany({ where: { id: { in: ids } } });
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await prisma!.$disconnect();
  });

  it("keeps a member's plans invisible and untouchable to other members and to admins", async () => {
    const [owner, other, admin] = await Promise.all([
      createPerson("MEMBER"),
      createPerson("MEMBER"),
      createPerson("ADMIN"),
    ]);
    for (const [resource, data] of [
      ["todos", { title: "Owner todo" }],
      ["notes", { title: "Owner note", content: "private words" }],
      ["goals", { title: "Owner goal", progress: 30 }],
    ] as const)
      expect((await write(owner, { resource, operation: "create", data })).status).toBe(200);
    const mine = await createdIds(owner);

    // Other members and admins read none of it.
    for (const viewer of [other, admin]) {
      const space = await (await read(viewer)).json();
      expect(space).toEqual({ todos: [], notes: [], goals: [] });
    }

    // Other members and admins cannot change or delete it, and every attempt looks like "not found".
    for (const intruder of [other, admin]) {
      for (const [resource, id] of [
        ["todos", mine.todo],
        ["notes", mine.note],
        ["goals", mine.goal],
      ] as const) {
        const update = await write(intruder, {
          resource,
          operation: "update",
          id,
          data: { title: "hijacked" },
        });
        const removal = await write(intruder, { resource, operation: "delete", id });
        expect(update.status).toBe(404);
        expect(removal.status).toBe(404);
      }
    }

    // The owner's rows are exactly as created.
    const [todo, note, goal] = await Promise.all([
      prisma!.todo.findUnique({ where: { id: mine.todo } }),
      prisma!.note.findUnique({ where: { id: mine.note } }),
      prisma!.goal.findUnique({ where: { id: mine.goal } }),
    ]);
    expect(todo).toMatchObject({ title: "Owner todo", userId: owner.id });
    expect(note).toMatchObject({ title: "Owner note", content: "private words", userId: owner.id });
    expect(goal).toMatchObject({ title: "Owner goal", progress: 30, userId: owner.id });
    const again = await (await read(owner)).json();
    expect(again.todos).toHaveLength(1);
    expect(again.notes).toHaveLength(1);
    expect(again.goals).toHaveLength(1);
  });

  it("ignores client-supplied owner ids", async () => {
    const [owner, other] = await Promise.all([createPerson("MEMBER"), createPerson("MEMBER")]);
    const forged = await write(owner, {
      resource: "notes",
      operation: "create",
      userId: other.id,
      data: { title: "forged owner" },
    });
    expect(forged.status).toBe(400);
    const viaData = await write(owner, {
      resource: "notes",
      operation: "create",
      data: { title: "forged owner", userId: other.id },
    });
    expect(viaData.status).toBe(400);
    expect(await prisma!.note.count({ where: { userId: { in: [owner.id, other.id] } } })).toBe(0);
    const query = await GET(
      new Request(`http://localhost/api/space?userId=${other.id}`, {
        headers: { cookie: `prax_session=${signSession(owner.session)}` },
      })
    );
    expect((await query.json()).notes).toEqual([]);
  });

  it.each([["SUSPENDED"], ["PENDING_APPROVAL"]] as const)(
    "refuses a stale session whose database account is %s",
    async (status) => {
      const stale = await createPerson("MEMBER", status);
      expect((await read(stale)).status).toBe(403);
      const attempt = await write(stale, {
        resource: "notes",
        operation: "create",
        data: { title: "should not exist" },
      });
      expect(attempt.status).toBe(403);
      expect(await prisma!.note.count({ where: { userId: stale.id } })).toBe(0);
    }
  );

  it("refuses an anonymous caller", async () => {
    expect((await GET(call(null))).status).toBe(401);
    expect(
      (await PATCH(call(null, { resource: "notes", operation: "create", data: { title: "x" } })))
        .status
    ).toBe(401);
  });

  it("enforces the 100-item cap per collection", async () => {
    const owner = await createPerson("MEMBER");
    await prisma!.note.createMany({
      data: Array.from({ length: 100 }, (_, i) => ({ userId: owner.id, title: `note ${i}` })),
    });
    const refused = await write(owner, {
      resource: "notes",
      operation: "create",
      data: { title: "one too many" },
    });
    expect(refused.status).toBe(400);
    expect(await prisma!.note.count({ where: { userId: owner.id } })).toBe(100);
    const space = await (await read(owner)).json();
    await write(owner, { resource: "notes", operation: "delete", id: space.notes[0].id });
    const accepted = await write(owner, {
      resource: "notes",
      operation: "create",
      data: { title: "fits now" },
    });
    expect(accepted.status).toBe(200);
    expect(await prisma!.note.count({ where: { userId: owner.id } })).toBe(100);
  });

  it("links only published tasks and hides the link once the task is no longer published", async () => {
    const [owner, admin] = await Promise.all([createPerson("MEMBER"), createPerson("ADMIN")]);
    const [published, draft] = await Promise.all(
      (["PUBLISHED", "DRAFT"] as const).map((lifecycle) =>
        prisma!.task.create({
          data: {
            title: `Space task ${lifecycle} ${randomUUID().slice(0, 8)}`,
            description: "Synthetic task for link tests.",
            category: "Space-test",
            pointsMax: 10,
            lifecycle,
            createdById: admin.id,
            publishedAt: lifecycle === "PUBLISHED" ? new Date() : null,
          },
        })
      )
    );
    const refused = await write(owner, {
      resource: "todos",
      operation: "create",
      data: { title: "draft link", taskId: draft.id },
    });
    expect(refused.status).toBe(400);
    const unknown = await write(owner, {
      resource: "todos",
      operation: "create",
      data: { title: "unknown link", taskId: "no-such-task" },
    });
    expect(unknown.status).toBe(400);

    const created = await write(owner, {
      resource: "todos",
      operation: "create",
      data: { title: "linked", taskId: published.id },
    });
    expect(created.status).toBe(200);
    const [linked] = (await created.json()).todos;
    expect(linked).toMatchObject({ taskId: published.id, taskTitle: published.title });

    await prisma!.task.update({ where: { id: published.id }, data: { lifecycle: "ARCHIVED" } });
    const [hidden] = (await (await read(owner)).json()).todos;
    expect(hidden).toMatchObject({ taskId: null, taskTitle: null });
    expect((await prisma!.todo.findUnique({ where: { id: linked.id } }))?.taskId).toBe(
      published.id
    );
  });

  it("clears the link (SET NULL) when a task is deleted and removes everything when the user is deleted", async () => {
    const [owner, admin] = await Promise.all([createPerson("MEMBER"), createPerson("ADMIN")]);
    const task = await prisma!.task.create({
      data: {
        title: `Doomed ${randomUUID().slice(0, 8)}`,
        description: "Synthetic.",
        category: "Space-test",
        pointsMax: 5,
        lifecycle: "PUBLISHED",
        publishedAt: new Date(),
        createdById: admin.id,
      },
    });
    await write(owner, {
      resource: "todos",
      operation: "create",
      data: { title: "t", taskId: task.id },
    });
    await write(owner, { resource: "notes", operation: "create", data: { title: "n" } });
    await write(owner, { resource: "goals", operation: "create", data: { title: "g" } });
    const { todo } = await createdIds(owner);

    await prisma!.task.delete({ where: { id: task.id } });
    expect((await prisma!.todo.findUnique({ where: { id: todo } }))?.taskId).toBeNull();

    await prisma!.user.delete({ where: { id: owner.id } });
    userIds.splice(userIds.indexOf(owner.id), 1);
    const left = await Promise.all([
      prisma!.todo.count({ where: { userId: owner.id } }),
      prisma!.note.count({ where: { userId: owner.id } }),
      prisma!.goal.count({ where: { userId: owner.id } }),
    ]);
    expect(left).toEqual([0, 0, 0]);
  });

  it("enforces goal progress 0..100 in the database itself", async () => {
    const owner = await createPerson("MEMBER");
    for (const progress of [0, 100])
      await expect(
        prisma!.goal.create({ data: { userId: owner.id, title: `ok ${progress}`, progress } })
      ).resolves.toMatchObject({ progress });
    for (const progress of [101, -1])
      await expect(
        prisma!.goal.create({ data: { userId: owner.id, title: `bad ${progress}`, progress } })
      ).rejects.toBeDefined();
  });

  it("keeps due dates as plain calendar dates and undated to-dos undated", async () => {
    const owner = await createPerson("MEMBER");
    await write(owner, {
      resource: "todos",
      operation: "create",
      data: { title: "dated", dueDate: "2026-11-05" },
    });
    await write(owner, {
      resource: "todos",
      operation: "create",
      data: { title: "undated", dueDate: "" },
    });
    const { todos } = await (await read(owner)).json();
    const byTitle = Object.fromEntries(
      todos.map((t: { title: string; dueDate: string }) => [t.title, t.dueDate])
    );
    expect(byTitle).toEqual({ dated: "2026-11-05", undated: "" });
  });

  it("updates part of an item and bumps its modification time", async () => {
    const owner = await createPerson("MEMBER");
    await write(owner, {
      resource: "notes",
      operation: "create",
      data: { title: "draft", content: "v1" },
    });
    const { note } = await createdIds(owner);
    const before = await prisma!.note.findUniqueOrThrow({ where: { id: note } });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const response = await write(owner, {
      resource: "notes",
      operation: "update",
      id: note,
      data: { content: "v2" },
    });
    expect(response.status).toBe(200);
    const after = await prisma!.note.findUniqueOrThrow({ where: { id: note } });
    expect(after).toMatchObject({ title: "draft", content: "v2" });
    expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
  });
});
