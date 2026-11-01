export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  pointsMax: number;
  deadline: string;
  dueAt?: string;
  createdAt?: string;
  checklist?: string[];
  status: "Open" | "Pending" | "Approved" | "Rejected";
  lifecycle?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  statusNote?: string;
  thumbnailType: "code" | "terminal" | "bars" | "doc";
}
