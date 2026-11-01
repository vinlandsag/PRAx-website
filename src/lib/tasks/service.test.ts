import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { parseTaskWriteInput, requirePersistedAccount, taskCreateData } from "./service";

const validTask = {
  title: "Build a demo",
  description: "Create and explain the demo.",
  category: "Engineering",
  pointsMax: 25,
  dueAt: "2026-12-31",
  checklist: ["Works", "Has explanation"],
};

describe("task write validation", () => {
  it("accepts the existing admin form contract and adds server-owned publication fields", () => {
    const parsed = parseTaskWriteInput(validTask, false);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const data = taskCreateData(parsed.value, "admin-from-session");
    expect(data).toMatchObject({
      title: validTask.title,
      pointsMax: 25,
      lifecycle: "PUBLISHED",
      createdById: "admin-from-session",
    });
    expect(data.dueAt?.toISOString()).toBe("2026-12-31T00:00:00.000Z");
  });

  it.each([
    { ...validTask, pointsMax: -1 },
    { ...validTask, pointsMax: 1.5 },
    { ...validTask, dueAt: "2026-02-30" },
    { ...validTask, lifecycle: "ARCHIVED" },
    { ...validTask, checklist: [""] },
    { ...validTask, title: " " },
  ])("rejects invalid or client-owned task fields", (input) => {
    expect(parseTaskWriteInput(input, false).ok).toBe(false);
  });

  it("accepts partial update payloads but rejects empty patches", () => {
    expect(parseTaskWriteInput({ pointsMax: 0 }, true)).toMatchObject({
      ok: true,
      value: { pointsMax: 0 },
    });
    expect(parseTaskWriteInput({}, true).ok).toBe(false);
  });
});

describe("persisted account revalidation", () => {
  it("selects only authorization/display fields and never loads passwordHash", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "approved-member",
      name: "Synthetic Member",
      role: "MEMBER",
      status: "APPROVED",
    });
    const prisma = { user: { findUnique } } as unknown as PrismaClient;
    const session = {
      id: "approved-member",
      name: "Synthetic Member",
      email: "synthetic@example.test",
      role: "MEMBER" as const,
      status: "APPROVED" as const,
    };

    expect(await requirePersistedAccount(prisma, session)).toMatchObject({
      ok: true,
      account: { id: session.id, name: session.name, role: session.role, status: session.status },
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: session.id },
      select: { id: true, name: true, role: true, status: true },
    });
  });

  it("rejects a session when the persisted account is no longer approved", async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "approved-member",
          name: "Synthetic Member",
          role: "MEMBER",
          status: "SUSPENDED",
        }),
      },
    } as unknown as PrismaClient;
    const session = {
      id: "approved-member",
      name: "Synthetic Member",
      email: "synthetic@example.test",
      role: "MEMBER" as const,
      status: "APPROVED" as const,
    };

    const result = await requirePersistedAccount(prisma, session);
    expect(result).toMatchObject({ ok: false, response: { status: 403 } });
  });
});
