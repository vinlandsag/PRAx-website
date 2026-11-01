import { describe, expect, it } from "vitest";
import { memberTaskStatus, parseTaskListQuery } from "./query";

describe("task list query validation and status mapping", () => {
  it("defaults to newest/all with bounded pagination", () => {
    expect(parseTaskListQuery(new URLSearchParams(), "MEMBER")).toEqual({
      ok: true,
      value: { status: "all", sort: "newest", category: null, search: null, limit: 20, offset: 0 },
    });
  });

  it("accepts member filters and admin lifecycle filters", () => {
    expect(
      parseTaskListQuery(new URLSearchParams("status=submitted&sort=points"), "MEMBER")
    ).toMatchObject({
      ok: true,
      value: { status: "submitted", sort: "points" },
    });
    expect(parseTaskListQuery(new URLSearchParams("status=archived"), "ADMIN").ok).toBe(true);
    expect(parseTaskListQuery(new URLSearchParams("status=archived"), "MEMBER").ok).toBe(false);
  });

  it.each([
    "status=all&status=open",
    "sort=deadline",
    "limit=101",
    "offset=-1",
    "search=" + "x".repeat(121),
  ])("rejects invalid task query: %s", (query) => {
    expect(parseTaskListQuery(new URLSearchParams(query), "MEMBER").ok).toBe(false);
  });

  it.each([
    ["DRAFT", "open"],
    ["SUBMITTED", "submitted"],
    ["UNDER_REVIEW", "submitted"],
    ["REVISION_REQUESTED", "submitted"],
    ["APPROVED", "approved"],
    ["REJECTED", "rejected"],
    ["WITHDRAWN", "open"],
  ] as const)("maps latest submission status %s to %s", (status, expected) => {
    expect(memberTaskStatus(status)).toBe(expected);
  });
  it("treats no submission as open", () => expect(memberTaskStatus(null)).toBe("open"));
});
