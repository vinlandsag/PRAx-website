import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/auth/types";
import { decideSubmission, listReviewQueue, parseReviewQueueQuery } from "./service";

const admin: SessionUser = {
  id: "admin-1",
  name: "Synthetic Admin",
  email: "admin@example.test",
  role: "ADMIN",
  status: "APPROVED",
};

describe("review queue query", () => {
  it("defaults to submitted rows and bounded pagination", () => {
    expect(parseReviewQueueQuery(new URLSearchParams())).toMatchObject({
      ok: true,
      value: { status: "SUBMITTED", limit: 20, offset: 0 },
    });
    expect(parseReviewQueueQuery(new URLSearchParams("status=all&limit=5"))).toMatchObject({
      ok: true,
      value: { status: "ALL", limit: 5 },
    });
  });

  it.each(["status=APPROVED", "status=SUBMITTED&status=UNDER_REVIEW", "limit=1000"]) (
    "rejects malformed or unsupported filters: %s",
    (query) => expect(parseReviewQueueQuery(new URLSearchParams(query)).ok).toBe(false)
  );
});

describe("admin review transitions", () => {
  it("lists only reviewable rows and preserves the submission response shape", async () => {
    const submittedAt = new Date("2026-11-01T00:00:00.000Z");
    const row = {
      id: "submission-1",
      taskId: "task-1",
      userId: "member-1",
      proofUrl: "https://example.test/proof",
      note: "Synthetic proof",
      codeSnippet: null,
      checklist: [],
      status: "SUBMITTED",
      pointsAwarded: null,
      rubricVersion: null,
      feedback: null,
      reviewedById: null,
      reviewedAt: null,
      submittedAt,
      createdAt: submittedAt,
      updatedAt: submittedAt,
      task: { id: "task-1", title: "Task", category: "Build", pointsMax: 20 },
      author: { id: "member-1", name: "Synthetic Member", email: "member@example.test" },
    };
    const count = vi.fn().mockResolvedValue(1);
    const findMany = vi.fn().mockResolvedValue([row]);
    const prisma = {
      submission: { count, findMany },
      $transaction: vi.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
    } as unknown as PrismaClient;
    const query = parseReviewQueueQuery(new URLSearchParams());
    if (!query.ok) throw new Error("Test query should be valid.");

    const result = await listReviewQueue(prisma, query.value);

    expect(result.submissions[0]).toMatchObject({
      id: row.id,
      status: "SUBMITTED",
      authorEmail: row.author.email,
      taskTitle: row.task.title,
    });
    expect(result.pagination).toEqual({ limit: 20, offset: 0, total: 1, hasMore: false });
    expect(findMany.mock.calls[0][0].where).toEqual({ status: "SUBMITTED" });
  });

  it("requires constructive feedback and attributes the decision to the session admin", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const row = {
      id: "submission-1",
      taskId: "task-1",
      userId: "member-1",
      proofUrl: "https://example.test/proof",
      note: "Synthetic proof",
      codeSnippet: null,
      checklist: [],
      status: "REJECTED",
      pointsAwarded: null,
      rubricVersion: null,
      feedback: "Please add more detail.",
      reviewedById: admin.id,
      reviewedAt: new Date("2026-11-01T00:00:00.000Z"),
      submittedAt: new Date("2026-11-01T00:00:00.000Z"),
      createdAt: new Date("2026-11-01T00:00:00.000Z"),
      updatedAt: new Date("2026-11-01T00:00:00.000Z"),
      task: { id: "task-1", title: "Task", category: "Build", pointsMax: 20 },
      author: { id: "member-1", name: "Synthetic Member", email: "member@example.test" },
    };
    const findUnique = vi.fn().mockResolvedValue(row);
    const findReviewer = vi
      .fn()
      .mockResolvedValue({ name: admin.name, role: "ADMIN", status: "APPROVED" });
    const tx = { submission: { updateMany, findUnique }, user: { findUnique: findReviewer } };
    const prisma = {
      $transaction: vi.fn((callback: (transaction: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaClient;

    const invalid = await decideSubmission(prisma, row.id, admin, "REJECTED", "  ");
    expect(invalid.ok).toBe(false);
    expect(updateMany).not.toHaveBeenCalled();

    const result = await decideSubmission(
      prisma,
      row.id,
      admin,
      "REJECTED",
      " Please add more detail. "
    );
    expect(result.ok).toBe(true);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: row.id, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      data: expect.objectContaining({
        status: "REJECTED",
        feedback: "Please add more detail.",
        reviewedById: admin.id,
        reviewedAt: expect.any(Date),
      }),
    });

    findReviewer.mockResolvedValue({ name: admin.name, role: "ADMIN", status: "SUSPENDED" });
    const inactiveAdmin = await decideSubmission(
      prisma,
      row.id,
      admin,
      "REJECTED",
      "Please add more detail."
    );
    expect(inactiveAdmin.ok).toBe(false);
    expect(updateMany).toHaveBeenCalledTimes(1);
  });
});
