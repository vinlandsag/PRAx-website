import { apiError } from "@/lib/errors";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_PAGE_OFFSET = 100_000;

export interface Pagination {
  limit: number;
  offset: number;
}

export type PaginationResult = { ok: true; value: Pagination } | { ok: false; response: Response };

/** Parse the shared limit/offset query convention. Invalid or repeated values are rejected. */
export function parsePagination(params: URLSearchParams): PaginationResult {
  const invalid = () => ({
    ok: false as const,
    response: apiError("VALIDATION_ERROR", "Pagination parameters are invalid.", 400),
  });

  const rawLimit = params.getAll("limit");
  const rawOffset = params.getAll("offset");
  if (rawLimit.length > 1 || rawOffset.length > 1) return invalid();
  if (
    (rawLimit.length === 1 && !/^\d+$/.test(rawLimit[0])) ||
    (rawOffset.length === 1 && !/^\d+$/.test(rawOffset[0]))
  )
    return invalid();

  const limit = rawLimit.length ? Number(rawLimit[0]) : DEFAULT_PAGE_SIZE;
  const offset = rawOffset.length ? Number(rawOffset[0]) : 0;
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > MAX_PAGE_SIZE ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    offset > MAX_PAGE_OFFSET
  )
    return invalid();

  return { ok: true, value: { limit, offset } };
}

export function paginationMeta(pagination: Pagination, total: number) {
  return {
    ...pagination,
    total,
    hasMore: pagination.offset + pagination.limit < total,
  };
}
