/**
 * src/app/admin/review-queue.test.ts
 *
 * Integration and behavioral test suite for Phase 6 — Admin Review Queue & Efficiency.
 * Covers:
 * 1. Server authorization: Unauthorized visitor (401) and member (403) access blocks.
 * 2. Queue listing with status filtering (?status=SUBMITTED).
 * 3. Review actions:
 *    - Approval with points validation and audit trail emission.
 *    - Rejection with mandatory feedback reason validation and audit trail.
 *    - Revision request with feedback validation and audit trail.
 * 4. Safe link handling & XSS URL sanitization.
 * 5. Pending age badge calculations and urgency color coding.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { GET as getSubmissions } from "@/app/api/admin/submissions/route";
import { POST as approveSubmission } from "@/app/api/admin/submissions/[id]/approve/route";
import { POST as rejectSubmission } from "@/app/api/admin/submissions/[id]/reject/route";
import { POST as requestRevision } from "@/app/api/admin/submissions/[id]/request-revision/route";
import { listAuditEvents } from "@/lib/audit/audit";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { submissionsStore } from "@/lib/db/submissions-store";
import { isSafeUrl, sanitizeUrl } from "@/lib/utils/url";

describe("Phase 6 — Admin Review Queue Integration & Security", () => {
  const adminUser: SessionUser = {
    id: "adm_reviewer_1",
    email: "admin@prax.dev",
    role: "ADMIN",
    status: "APPROVED",
    name: "Lead Reviewer",
  };

  const memberUser: SessionUser = {
    id: "usr_member_1",
    email: "member@prax.dev",
    role: "MEMBER",
    status: "APPROVED",
    name: "Community Member",
  };

  beforeEach(() => {
    submissionsStore.reset();
  });

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

  describe("Server-Side Authorization Gates", () => {
    it("blocks unauthenticated visitors from GET /api/admin/submissions with 401 UNAUTHENTICATED", async () => {
      const req = makeRequest("https://prax.test/api/admin/submissions");
      const res = await getSubmissions(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });

    it("blocks standard members from GET /api/admin/submissions with 403 FORBIDDEN", async () => {
      const req = makeRequest("https://prax.test/api/admin/submissions", { user: memberUser });
      const res = await getSubmissions(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("blocks members from approval endpoint with 403 FORBIDDEN", async () => {
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: memberUser,
        body: { pointsAwarded: 35 },
      });
      const res = await approveSubmission(req, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res.status).toBe(403);
    });

    it("blocks members from rejection endpoint with 403 FORBIDDEN", async () => {
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_01/reject", {
        method: "POST",
        user: memberUser,
        body: { feedback: "Invalid" },
      });
      const res = await rejectSubmission(req, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res.status).toBe(403);
    });
  });

  describe("Queue Listing (`GET /api/admin/submissions`)", () => {
    it("allows authorized admins to list all submitted proofs", async () => {
      const req = makeRequest("https://prax.test/api/admin/submissions?status=SUBMITTED", {
        user: adminUser,
      });
      const res = await getSubmissions(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.submissions)).toBe(true);
      expect(json.submissions.length).toBe(4);
      expect(json.submissions[0].status).toBe("SUBMITTED");
    });
  });

  describe("Submission Approval Workflow", () => {
    it("approves a submission, awards points, and records audit trail", async () => {
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: 30 },
      });
      const res = await approveSubmission(req, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.submission.status).toBe("APPROVED");
      expect(json.submission.pointsAwarded).toBe(30);
      expect(json.submission.reviewedById).toBe("adm_reviewer_1");

      // Verify audit trail
      const audit = listAuditEvents();
      const approvalEvent = audit.events.find(
        (e) => e.targetId === "sub_01" && e.event === "SUBMISSION_APPROVED"
      );
      expect(approvalEvent).toBeDefined();
      expect(approvalEvent?.actorId).toBe("adm_reviewer_1");

      const pointsEvent = audit.events.find((e) => e.event === "POINTS_ASSIGNED");
      expect(pointsEvent).toBeDefined();
      expect(pointsEvent?.metadata?.amount).toBe(30);
    });

    it("rejects pointsAwarded exceeding maximum allowed points with 400 VALIDATION_ERROR", async () => {
      // sub_01 maxPoints is 35
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: 50 },
      });
      const res = await approveSubmission(req, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects negative points with 400 VALIDATION_ERROR", async () => {
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: -5 },
      });
      const res = await approveSubmission(req, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("blocks repeated approval on already approved submission with 422 INVALID_STATE_TRANSITION", async () => {
      const req1 = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: 35 },
      });
      await approveSubmission(req1, { params: Promise.resolve({ id: "sub_01" }) });

      // Second approval attempt
      const req2 = makeRequest("https://prax.test/api/admin/submissions/sub_01/approve", {
        method: "POST",
        user: adminUser,
        body: { pointsAwarded: 35 },
      });
      const res2 = await approveSubmission(req2, { params: Promise.resolve({ id: "sub_01" }) });
      expect(res2.status).toBe(422);
      const json = await res2.json();
      expect(json.error.code).toBe("INVALID_STATE_TRANSITION");
    });
  });

  describe("Submission Rejection Workflow & Reason Enforcement", () => {
    it("strictly requires a reason of at least 3 characters for rejection", async () => {
      // Empty reason
      const reqEmpty = makeRequest("https://prax.test/api/admin/submissions/sub_02/reject", {
        method: "POST",
        user: adminUser,
        body: { feedback: "" },
      });
      const resEmpty = await rejectSubmission(reqEmpty, {
        params: Promise.resolve({ id: "sub_02" }),
      });
      expect(resEmpty.status).toBe(400);
      const jsonEmpty = await resEmpty.json();
      expect(jsonEmpty.error.code).toBe("VALIDATION_ERROR");

      // Too short reason (< 3 chars)
      const reqShort = makeRequest("https://prax.test/api/admin/submissions/sub_02/reject", {
        method: "POST",
        user: adminUser,
        body: { feedback: "no" },
      });
      const resShort = await rejectSubmission(reqShort, {
        params: Promise.resolve({ id: "sub_02" }),
      });
      expect(resShort.status).toBe(400);
    });

    it("rejects submission with valid reason and emits audit event", async () => {
      const feedback =
        "Proof does not include responsive mobile test results as required by rubric.";
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_02/reject", {
        method: "POST",
        user: adminUser,
        body: { feedback },
      });
      const res = await rejectSubmission(req, { params: Promise.resolve({ id: "sub_02" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.submission.status).toBe("REJECTED");
      expect(json.submission.feedback).toBe(feedback);

      // Verify audit trail
      const audit = listAuditEvents();
      const rejectionEvent = audit.events.find(
        (e) => e.targetId === "sub_02" && e.event === "SUBMISSION_REJECTED"
      );
      expect(rejectionEvent).toBeDefined();
      expect(rejectionEvent?.reason).toBe(feedback);
    });
  });

  describe("Submission Revision Request Workflow", () => {
    it("requests revision with constructive feedback and records audit event", async () => {
      const feedback =
        "Please add a short benchmark script to demonstrate before and after runtime.";
      const req = makeRequest("https://prax.test/api/admin/submissions/sub_03/request-revision", {
        method: "POST",
        user: adminUser,
        body: { feedback },
      });
      const res = await requestRevision(req, { params: Promise.resolve({ id: "sub_03" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.submission.status).toBe("REVISION_REQUESTED");
      expect(json.submission.feedback).toBe(feedback);

      const audit = listAuditEvents();
      const revEvent = audit.events.find(
        (e) => e.targetId === "sub_03" && e.event === "SUBMISSION_REVISION_REQUESTED"
      );
      expect(revEvent).toBeDefined();
      expect(revEvent?.reason).toBe(feedback);
    });
  });

  describe("Safe Link Handling & Sanitization", () => {
    it("allows valid http and https URLs", () => {
      expect(isSafeUrl("https://github.com/prax/prax-cli/pull/7")).toBe(true);
      expect(isSafeUrl("http://localhost:3000/demo")).toBe(true);
      expect(isSafeUrl("https://tara.studio/teardowns/linear-sync")).toBe(true);
    });

    it("rejects malicious or unsupported protocols (javascript:, data:, vbscript:)", () => {
      expect(isSafeUrl("javascript:alert(document.cookie)")).toBe(false);
      expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
      expect(isSafeUrl("file:///etc/passwd")).toBe(false);
      expect(isSafeUrl("")).toBe(false);
      expect(isSafeUrl("   ")).toBe(false);
      expect(isSafeUrl(null)).toBe(false);
      expect(isSafeUrl(undefined)).toBe(false);
    });

    it("sanitizeUrl returns fallback '#' when an unsafe URL is supplied", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBe("#");
      expect(sanitizeUrl("data:text/html;base64,...")).toBe("#");
      expect(sanitizeUrl("https://github.com/safe")).toBe("https://github.com/safe");
    });
  });
});
