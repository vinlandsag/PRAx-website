/**
 * src/lib/db/submissions-store.ts
 *
 * In-memory thread-safe store for Tasks and Submissions.
 * Conforms to MVP_SPEC.md §4 (Submission Review States) and API_CONTRACTS.md (IC-03).
 */

export type SubmissionStatus =
  "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";

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

const now = Date.now();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Initial pre-seeded submissions with realistic pending ages
const initialSubmissions: Submission[] = [
  {
    id: "sub_01",
    taskId: "task_sql_opt",
    taskTitle: "Optimise one slow SQL query",
    category: "Backend",
    maxPoints: 35,
    userId: "usr_arjun",
    authorName: "Arjun Varma",
    authorEmail: "arjun@studio.dev",
    proofUrl: "https://github.com/arjun/api/pull/42",
    note: "Cut p95 latency from 820ms to 90ms. Added composite index, eliminated N+1 calls, and attached EXPLAIN ANALYZE output.",
    codeSnippet: "EXPLAIN ANALYZE\nIndex Scan using user_feed_idx\nExecution Time: 90.15 ms",
    checklist: [
      "Measured runtime before and after",
      "Linked PR with query plan",
      "Explained indexing tradeoffs",
    ],
    status: "SUBMITTED",
    submittedAt: new Date(now - 3 * HOUR).toISOString(), // 3 hours ago
    createdAt: new Date(now - 4 * HOUR).toISOString(),
    updatedAt: new Date(now - 3 * HOUR).toISOString(),
  },
  {
    id: "sub_02",
    taskId: "task_landing",
    taskTitle: "Landing page challenge",
    category: "Frontend",
    maxPoints: 40,
    userId: "usr_meera",
    authorName: "Meera Shah",
    authorEmail: "meera@design.io",
    proofUrl: "https://github.com/meera/landing-demo",
    note: "Built with Next.js 16 and CSS Grid, fully tested with Playwright on desktop and mobile viewports.",
    codeSnippet: "PASS e2e/landing.spec.ts\n✓ responsive viewport check (320ms)",
    checklist: ["Clean mobile styles", "Accessible contrast ratio", "Live preview deployed"],
    status: "SUBMITTED",
    submittedAt: new Date(now - 16 * HOUR).toISOString(), // 16 hours ago (amber pending)
    createdAt: new Date(now - 18 * HOUR).toISOString(),
    updatedAt: new Date(now - 16 * HOUR).toISOString(),
  },
  {
    id: "sub_03",
    taskId: "task_cli",
    taskTitle: "CLI contribution",
    category: "Developer tools",
    maxPoints: 60,
    userId: "usr_rohan",
    authorName: "Rohan Das",
    authorEmail: "rohan@cli.dev",
    proofUrl: "https://github.com/rohan/prax-cli/pull/7",
    note: "Implemented JSON output mode and shell autocompletion flags for zsh and bash.",
    codeSnippet: "$ prax tasks --json | jq '.[0].id'\n\"task_01\"",
    checklist: ["Added unit tests", "Updated man page / help text"],
    status: "SUBMITTED",
    submittedAt: new Date(now - 36 * HOUR).toISOString(), // 1.5 days ago (urgent red pending)
    createdAt: new Date(now - 40 * HOUR).toISOString(),
    updatedAt: new Date(now - 36 * HOUR).toISOString(),
  },
  {
    id: "sub_04",
    taskId: "task_teardown",
    taskTitle: "Product teardown",
    category: "Writing",
    maxPoints: 30,
    userId: "usr_tara",
    authorName: "Tara Bose",
    authorEmail: "tara@studio.co",
    proofUrl: "https://tara.studio/teardowns/linear-sync",
    note: "2,000 words breaking down offline sync architecture, optimistic UI, and conflict resolution trade-offs.",
    codeSnippet: "Draft review: 2,140 words, 6 architectural diagrams included",
    checklist: ["Thorough analysis", "Clear visual diagrams", "Actionable lessons"],
    status: "SUBMITTED",
    submittedAt: new Date(now - 3 * DAY).toISOString(), // 3 days ago (critical pending)
    createdAt: new Date(now - 4 * DAY).toISOString(),
    updatedAt: new Date(now - 3 * DAY).toISOString(),
  },
];

class SubmissionsStore {
  private submissions: Map<string, Submission> = new Map();

  constructor() {
    this.reset();
  }

  public reset() {
    this.submissions.clear();
    for (const sub of initialSubmissions) {
      this.submissions.set(sub.id, { ...sub });
    }
  }

  public async listSubmissions(filter?: { status?: SubmissionStatus }): Promise<Submission[]> {
    const list = Array.from(this.submissions.values());
    if (filter?.status) {
      return list.filter((s) => s.status === filter.status);
    }
    return list;
  }

  public async findSubmissionById(id: string): Promise<Submission | null> {
    const sub = this.submissions.get(id);
    return sub ? { ...sub } : null;
  }

  public async createSubmission(
    data: Omit<Submission, "id" | "createdAt" | "updatedAt">
  ): Promise<Submission> {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const submission: Submission = {
      ...data,
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.submissions.set(id, submission);
    return { ...submission };
  }

  public async updateSubmission(
    id: string,
    updates: Partial<Omit<Submission, "id" | "createdAt">>
  ): Promise<Submission | null> {
    const existing = this.submissions.get(id);
    if (!existing) return null;

    const updated: Submission = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.submissions.set(id, updated);
    return { ...updated };
  }
}

export const submissionsStore = new SubmissionsStore();
