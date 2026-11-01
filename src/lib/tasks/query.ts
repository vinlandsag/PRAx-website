import { apiError } from "@/lib/errors";
import { parsePagination, type Pagination } from "@/lib/api/pagination";
import type { UserRole } from "@/lib/auth/types";
import type { SubmissionStatus } from "@/lib/db/submissions";

export type MemberTaskStatus = "all" | "open" | "submitted" | "approved" | "rejected";
export type AdminTaskStatus = "all" | "draft" | "published" | "archived";
export type TaskSort = "newest" | "points";

export interface TaskListQuery extends Pagination {
  status: MemberTaskStatus | AdminTaskStatus;
  sort: TaskSort;
  category: string | null;
  search: string | null;
}

export type TaskListQueryResult =
  { ok: true; value: TaskListQuery } | { ok: false; response: Response };

const invalid = () => ({
  ok: false as const,
  response: apiError("VALIDATION_ERROR", "Task query parameters are invalid.", 400),
});

export function parseTaskListQuery(params: URLSearchParams, role: UserRole): TaskListQueryResult {
  const single = (key: string) => {
    const values = params.getAll(key);
    return values.length <= 1
      ? { valid: true, value: values[0] }
      : { valid: false, value: undefined };
  };
  const statusParam = single("status");
  const sortParam = single("sort");
  const categoryParam = single("category");
  const searchParam = single("search");
  if (!statusParam.valid || !sortParam.valid || !categoryParam.valid || !searchParam.valid)
    return invalid();

  const status = (statusParam.value ?? "all").toLowerCase();
  const allowedStatuses =
    role === "ADMIN"
      ? ["all", "draft", "published", "archived"]
      : ["all", "open", "submitted", "approved", "rejected"];
  const sort = (sortParam.value ?? "newest").toLowerCase();
  const category = categoryParam.value?.trim() ?? "";
  const search = searchParam.value?.trim() ?? "";
  if (
    !allowedStatuses.includes(status) ||
    (sort !== "newest" && sort !== "points") ||
    category.length > 64 ||
    search.length > 120
  )
    return invalid();

  const pagination = parsePagination(params);
  if (!pagination.ok) return { ok: false, response: pagination.response };

  return {
    ok: true,
    value: {
      ...pagination.value,
      status: status as MemberTaskStatus | AdminTaskStatus,
      sort: sort as TaskSort,
      category: category || null,
      search: search || null,
    },
  };
}

export function memberTaskStatus(
  status: SubmissionStatus | null
): Exclude<MemberTaskStatus, "all"> {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "SUBMITTED":
    case "UNDER_REVIEW":
    case "REVISION_REQUESTED":
      return "submitted";
    case "DRAFT":
    case "WITHDRAWN":
    default:
      return "open";
  }
}
