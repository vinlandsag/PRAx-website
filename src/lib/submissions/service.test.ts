import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/auth/types";
import {
  getSubmission,
  listOwnSubmissions,
  parseSubmissionInput,
  parseSubmissionQuery,
} from "./service";

const valid = {
  taskId: "task-123",
  proofUrl: "https://example.test/proof",
  note: "I completed the task and included the requested result.",
};

describe("submission request validation", () => {
  it("accepts the current frontend submit contract", () => {
    expect(parseSubmissionInput(valid)).toEqual({ ok: true, value: valid });
  });

  it.each([
    { ...valid, userId: "forged-user" },
    { ...valid, status: "APPROVED" },
    { ...valid, pointsAwarded: 100 },
    { ...valid, proofUrl: "javascript:alert(1)" },
    { ...valid, proofUrl: "data:text/html,unsafe" },
    { ...valid, proofUrl: "https://user:secret@example.test/proof" },
    { ...valid, proofUrl: "https://example.test/" + "x".repeat(2050) },
    { ...valid, note: " " },
    { ...valid, note: "x".repeat(8001) },
    { ...valid, taskId: " " },
  ])("rejects forged or invalid submit fields", (input) => {
    expect(parseSubmissionInput(input).ok).toBe(false);
  });

  it("accepts a bounded partial edit and rejects fields outside the edit contract", () => {
    expect(parseSubmissionInput({ note: "Updated explanation." }, true)).toEqual({
      ok: true,
      value: { note: "Updated explanation." },
    });
    expect(parseSubmissionInput({ status: "APPROVED" }, true).ok).toBe(false);
    expect(parseSubmissionInput({}, true).ok).toBe(false);
  });
});

describe("submission object access", () => {
  it("scopes member detail lookup to both the submission ID and owner ID", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const prisma = { submission: { findFirst } } as unknown as PrismaClient;
    const member: SessionUser = {
      id: "member-1",
      email: "member@example.test",
      name: "Synthetic Member",
      role: "MEMBER",
      status: "APPROVED",
    };

    const result = await getSubmission(prisma, "submission-1", member, true);
    expect(result).toMatchObject({ ok: false, response: { status: 404 } });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "submission-1", userId: "member-1" },
      })
    );
  });
});

describe("own submission query validation", () => {
  it("defaults to all statuses with bounded pagination", () => {
    expect(parseSubmissionQuery(new URLSearchParams())).toEqual({
      ok: true,
      value: { status: "ALL", limit: 20, offset: 0 },
    });
  });

  it("accepts each stored review state, including withdrawn", () => {
    expect(parseSubmissionQuery(new URLSearchParams("status=under_review&limit=5"))).toMatchObject({
      ok: true,
      value: { status: "UNDER_REVIEW", limit: 5 },
    });
    expect(parseSubmissionQuery(new URLSearchParams("status=withdrawn")).ok).toBe(true);
  });

  it.each(["status=forged", "status=SUBMITTED&status=REJECTED", "limit=1000", "offset=-1"])(
    "rejects invalid query %s",
    (query) => {
      expect(parseSubmissionQuery(new URLSearchParams(query)).ok).toBe(false);
    }
  );
});

describe("own submission query shaping", () => {
  it("does not load the unused reviewer relation for the member history list", async () => {
    const submittedAt = new Date("2026-10-31T10:00:00Z");
    const record = {
      id: "submission-1",
      taskId: "task-1",
      userId: "member-1",
      proofUrl: "https://example.test/proof",
      note: "Completed the task.",
      codeSnippet: null,
      checklist: [],
      status: "APPROVED",
      pointsAwarded: 10,
      rubricVersion: "v1",
      feedback: null,
      reviewedById: "admin-1",
      reviewedAt: submittedAt,
      submittedAt,
      createdAt: submittedAt,
      updatedAt: submittedAt,
      task: { id: "task-1", title: "Task", category: "Build", pointsMax: 20 },
      author: { id: "member-1", name: "Synthetic Member", email: "member@example.test" },
    };
    const count = vi.fn().mockResolvedValue(1);
    const findMany = vi.fn().mockResolvedValue([record]);
    const prisma = {
      submission: { count, findMany },
      $transaction: vi.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
    } as unknown as PrismaClient;
    const session: SessionUser = {
      id: "member-1",
      email: "member@example.test",
      name: "Synthetic Member",
      role: "MEMBER",
      status: "APPROVED",
    };

    const result = await listOwnSubmissions(prisma, session, {
      status: "ALL",
      limit: 20,
      offset: 0,
    });

    expect(result.submissions[0]).toMatchObject({
      id: record.id,
      authorEmail: session.email,
      reviewedById: "admin-1",
    });
    const query = findMany.mock.calls[0][0];
    expect(query.include).toEqual({
      task: { select: { id: true, title: true, category: true, pointsMax: true } },
      author: { select: { id: true, name: true, email: true } },
    });
    expect(query.include).not.toHaveProperty("reviewer");
  });
});
