import { describe, it, expect } from "vitest";
import { apiError, errors } from "@/lib/errors";

describe("apiError()", () => {
  it("returns a response with the correct status code", async () => {
    const res = apiError("NOT_FOUND", "Resource not found.", 404);
    expect(res.status).toBe(404);
  });

  it("returns the standard error envelope", async () => {
    const res = apiError("FORBIDDEN", "No access.", 403);
    const body = await res.json();
    expect(body).toEqual({
      error: { code: "FORBIDDEN", message: "No access.", status: 403 },
    });
  });
});

describe("errors convenience helpers", () => {
  it("errors.unauthenticated() → 401", async () => {
    const res = errors.unauthenticated();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("errors.forbidden() → 403", async () => {
    const res = errors.forbidden();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("errors.notFound() → 404 with default resource name", async () => {
    const res = errors.notFound();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toContain("not found");
  });

  it("errors.notFound() → 404 with custom resource name", async () => {
    const res = errors.notFound("User");
    const body = await res.json();
    expect(body.error.message).toBe("User not found.");
  });

  it("errors.accountPending() → 403 ACCOUNT_PENDING", async () => {
    const res = errors.accountPending();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("ACCOUNT_PENDING");
  });

  it("errors.internal() → 500", async () => {
    const res = errors.internal();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});
