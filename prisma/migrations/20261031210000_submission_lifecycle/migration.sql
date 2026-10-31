-- Preserve submission history while supporting withdrawal and resubmission.
ALTER TYPE "SubmissionStatus" ADD VALUE 'WITHDRAWN';

-- A member may have only one attempt that is currently editable or under review
-- for a task. Rejected, revision-requested, approved, and withdrawn attempts are
-- retained as history and do not block a later attempt.
CREATE UNIQUE INDEX "Submission_one_active_attempt_per_user_task_idx"
ON "Submission" ("userId", "taskId")
WHERE "status" IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW');
