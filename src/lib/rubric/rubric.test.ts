/**
 * src/lib/rubric/rubric.test.ts
 *
 * Test suite for Phase 7 — Rubric Engine & Points Boundary.
 * Covers:
 * 1. Criteria validation and version bump logic.
 * 2. GET/PUT /api/rubric authorization gates (visitor 401, member 403, admin 200).
 * 3. Point assignment server validation: bounds [0, maxPoints], rejects negative, float, over-max, and non-numeric.
 * 4. Transaction boundary with Person 3: idempotency, duplicate prevention, and failure/rollback.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { POST as approveSubmission } from "@/app/api/admin/submissions/[id]/approve/route";
import { GET as getRubric, PUT as updateRubricEndpoint } from "@/app/api/rubric/route";
import { listAuditEvents } from "@/lib/audit/audit";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { submissionsStore } from "@/lib/db/submissions-store";
import { pointsBoundary } from "@/lib/points/points-boundary";
import { rubricStore } from "@/lib/rubric/rubric-store";

const adminUser: SessionUser = {
  id: "adm_rubric_lead",
  email: "admin@prax.test",
  name: "Lead Admin",
  role: "ADMIN",
  status: "APPROVED",
};

const memberUser: SessionUser = {
  id: "usr_member_1",
  email: "member@prax.test",
  name: "Dev Member",
  role: "MEMBER",
  status: "APPROVED",
};

function makeRequest(
  url: string,
  options: {
    method?: string;
    user?: SessionUser;
    body?: Record<string, unknown>;
  } = {}
): Request {
  const headers: Record<string, string> = {};
  if (options.user) {
    const token = signSession(options.user);
    headers["cookie"] = `prax_session=${token}`;
  }
  if (options.body) {
    headers["content-type"] = "application/json";
  }

  return new Request(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

describe("Phase 7 — Rubric Engine & Points Boundary", () => {
  beforeEach(() => {
    rubricStore.reset();
    pointsBoundary.reset();
    submissionsStore.reset();
  });

  describe("Rubric Criteria Validation & Versioning", () => {
    it("validates initial rubric starts at v1 with 4 criteria totaling 40 points", () => {
      const rubric = rubricStore.getActiveRubric();
      expect(rubric.version).toBe("v1");
      expect(rubric.criteria.length).toBe(4);
      expect(rubric.totalMaxPoints).toBe(40);
    });

    it("rejects invalid criteria payloads (empty array, missing fields, invalid points)", () => {
      expect(rubricStore.validateCriteria([]).valid).toBe(false);
      expect(rubricStore.validateCriteria(null).valid).toBe(false);

      // Missing title
      expect(
        rubricStore.validateCriteria([
          { id: "c1", title: "", description: "Valid desc long enough", maxPoints: 10 },
        ]).valid
      ).toBe(false);

      // Short description
      expect(
        rubricStore.validateCriteria([
          { id: "c1", title: "Valid Title", description: "shrt", maxPoints: 10 },
        ]).valid
      ).toBe(false);

      // Negative or float points
      expect(
        rubricStore.validateCriteria([
          { id: "c1", title: "Valid Title", description: "Valid description", maxPoints: -5 },
        ]).valid
      ).toBe(false);
      expect(
        rubricStore.validateCriteria([
          { id: "c1", title: "Valid Title", description: "Valid description", maxPoints: 12.5 },
        ]).valid
      ).toBe(false);

      // Duplicate IDs
      expect(
        rubricStore.validateCriteria([
          { id: "c1", title: "Title One", description: "Valid description", maxPoints: 10 },
          { id: "c1", title: "Title Two", description: "Valid description", maxPoints: 5 },
        ]).valid
      ).toBe(false);
    });

    it("increments version and stores immutable history upon update", () => {
      const updated = rubricStore.updateRubric(
        [
          {
            id: "c1",
            num: "01",
            title: "Testing",
            description: "Comprehensive tests",
            maxPoints: 20,
          },
          { id: "c2", num: "02", title: "Design", description: "Consistent tokens", maxPoints: 15 },
        ],
        "adm_rubric_lead"
      );

      expect(updated.version).toBe("v2");
      expect(updated.totalMaxPoints).toBe(35);
      expect(updated.criteria.length).toBe(2);

      const history = rubricStore.getVersionHistory();
      expect(history.length).toBe(2);
      expect(history[0].version).toBe("v1");
      expect(history[1].version).toBe("v2");
    });
  });

  describe("Rubric API Authorization Gates (`/api/rubric`)", () => {
    it("blocks unauthenticated visitors from GET /api/rubric with 401 UNAUTHENTICATED", async () => {
      const req = makeRequest("https://prax.test/api/rubric");
      const res = await getRubric(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });

    it("allows approved members to view the published rubric (GET /api/rubric)", async () => {
      const req = makeRequest("https://prax.test/api/rubric", { user: memberUser });
      const res = await getRubric(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.rubric.version).toBe("v1");
      expect(json.rubric.criteria.length).toBe(4);
    });

    it("blocks non-admin members from updating rubric (PUT /api/rubric) with 403 FORBIDDEN", async () => {
      const req = makeRequest("https://prax.test/api/rubric", {
        method: "PUT",
        user: memberUser,
        body: {
          criteria: [
            { id: "c1", title: "Tampered", description: "Tampered description", maxPoints: 10 },
          ],
        },
      });
      const res = await updateRubricEndpoint(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("allows admins to update rubric, emits RUBRIC_UPDATED audit event", async () => {
      const req = makeRequest("https://prax.test/api/rubric", {
        method: "PUT",
        user: adminUser,
        body: {
          criteria: [
            {
              id: "c1",
              num: "01",
              title: "Correctness",
              description: "Correct implementation",
              maxPoints: 20,
            },
            {
              id: "c2",
              num: "02",
              title: "Performance",
              description: "Benchmarks attached",
              maxPoints: 10,
            },
          ],
        },
      });
      const res = await updateRubricEndpoint(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.rubric.version).toBe("v2");
      expect(json.rubric.totalMaxPoints).toBe(30);

      // Verify audit log
      const audit = listAuditEvents();
      const rubricEvent = audit.events.find((e) => e.event === "RUBRIC_UPDATED");
      expect(rubricEvent).toBeDefined();
      expect(rubricEvent?.priorState).toBe("v1");
      expect(rubricEvent?.newState).toBe("v2");
    });
  });

  describe("Point Assignment Server Validation & Boundaries", () => {
    it("approves valid boundary score of 0 points", async () => {
      // sub_01 maxPoints is 35
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: 0 },
      });
      const res = await approveSubmission(req, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.submission.status).toBe("APPROVED");
      expect(json.submission.pointsAwarded).toBe(0);
    });

    it("approves valid boundary score of exactly maxPoints", async () => {
      // sub_01 maxPoints is 35
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: 35 },
      });
      const res = await approveSubmission(req, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.submission.status).toBe("APPROVED");
      expect(json.submission.pointsAwarded).toBe(35);
    });

    it("rejects pointsAwarded exceeding task maximum with 400 VALIDATION_ERROR", async () => {
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: 36 },
      });
      const res = await approveSubmission(req, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("cannot exceed task maximum");
    });

    it("rejects negative points with 400 VALIDATION_ERROR", async () => {
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: -1 },
      });
      const res = await approveSubmission(req, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("cannot be negative");
    });

    it("rejects fractional/decimal points with 400 VALIDATION_ERROR", async () => {
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: 15.5 },
      });
      const res = await approveSubmission(req, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("Fractional points are not allowed");
    });

    it("rejects non-numeric strings and malformed values with 400 VALIDATION_ERROR", async () => {
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: "thirty" as unknown as number },
      });
      const res = await approveSubmission(req, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Person 3 Transaction Boundary & Idempotency", () => {
    it("dispatches approved score to boundary and records rubric version", async () => {
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: 25 },
      });
      const res = await approveSubmission(req, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.submission.pointsAwarded).toBe(25);
      expect(json.submission.rubricVersion).toBe("v1");
      expect(json.transactionId).toBeDefined();

      // Check boundary transaction register
      const txn = pointsBoundary.getTransaction("pts_sub_01_v1");
      expect(txn).toBeDefined();
      expect(txn?.pointsAwarded).toBe(25);
      expect(txn?.userId).toBe("usr_arjun");
    });

    it("handles duplicate approval requests idempotently without double-awarding points", async () => {
      const req1 = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: 30 },
      });
      const res1 = await approveSubmission(req1, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res1.status).toBe(200);

      // Duplicate approval call
      const req2 = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: 30 },
      });
      const res2 = await approveSubmission(req2, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res2.status).toBe(422);
      const json2 = await res2.json();
      expect(json2.error.code).toBe("INVALID_STATE_TRANSITION");

      // Verify points were recorded only once in the boundary
      const boundaryRecord = pointsBoundary.getTransaction("pts_sub_01_v1");
      expect(boundaryRecord?.pointsAwarded).toBe(30);

      // Verify points boundary directly detects duplicate idempotency key
      const duplicateBoundaryCall = await pointsBoundary.dispatchApprovedPoints({
        submissionId: "sub_01",
        userId: "usr_arjun",
        pointsAwarded: 30,
        maxPoints: 35,
        rubricVersion: "v1",
        reviewedById: adminUser.id,
        taskTitle: "Task",
        idempotencyKey: "pts_sub_01_v1",
      });
      expect(duplicateBoundaryCall.alreadyProcessed).toBe(true);
    });

    it("rolls back submission approval if Person 3 points boundary encounters failure", async () => {
      pointsBoundary.setSimulateFailure(true);

      const req = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: 20 },
      });
      const res = await approveSubmission(req, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error.code).toBe("INTERNAL_ERROR");

      // Verify submission status remained SUBMITTED (rolled back)
      const sub = await submissionsStore.findSubmissionById("sub_01");
      expect(sub?.status).toBe("SUBMITTED");
      expect(sub?.pointsAwarded).toBeUndefined();
    });
  });
});
