import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, paginationMeta, parsePagination } from "./pagination";

describe("parsePagination", () => {
  it("uses stable defaults", () => {
    expect(parsePagination(new URLSearchParams())).toEqual({
      ok: true,
      value: { limit: DEFAULT_PAGE_SIZE, offset: 0 },
    });
  });

  it("accepts bounded integer limit and offset", () => {
    expect(parsePagination(new URLSearchParams("limit=50&offset=100"))).toEqual({
      ok: true,
      value: { limit: 50, offset: 100 },
    });
    expect(MAX_PAGE_SIZE).toBe(100);
  });

  it.each([
    "limit=0",
    "limit=101",
    "limit=1.5",
    "limit=0x10",
    "limit=1&limit=2",
    "offset=",
    "offset=-1",
    "offset=1.2",
  ])("rejects invalid pagination query %s", (query) => {
    const result = parsePagination(new URLSearchParams(query));
    expect(result.ok).toBe(false);
  });

  it("reports stable pagination metadata", () => {
    expect(paginationMeta({ limit: 20, offset: 20 }, 45)).toEqual({
      limit: 20,
      offset: 20,
      total: 45,
      hasMore: true,
    });
  });
});
