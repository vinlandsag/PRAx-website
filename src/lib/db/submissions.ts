export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUESTED"
  | "WITHDRAWN";

export interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  category: string;
  maxPoints: number;
  userId: string;
  authorName: string;
  authorEmail: string;
  proofUrl: string;
  note: string;
  codeSnippet?: string;
  checklist?: string[];
  status: SubmissionStatus;
  pointsAwarded?: number;
  rubricVersion?: string;
  transactionId?: string;
  feedback?: string;
  reviewedById?: string;
  reviewedAt?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}
