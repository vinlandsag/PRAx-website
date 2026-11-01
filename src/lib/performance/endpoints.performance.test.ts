import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/auth/types";
import { getPrismaClient } from "@/lib/db/prisma";
import { signSession } from "@/lib/auth/session";
import { GET as getTasks } from "@/app/api/tasks/route";
import { GET as getTask } from "@/app/api/tasks/[id]/route";
import { GET as getSubmissions } from "@/app/api/submissions/route";
import { GET as getLeaderboard } from "@/app/api/leaderboard/route";
import { GET as getStreaks } from "@/app/api/streaks/route";

const enabled = process.env.PERF_BENCHMARK === "1";

function localEnvFile(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(join(process.cwd(), ".env.local"), "utf8")
        .split(/\r?\n/)
        .flatMap((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return [];
          const separator = trimmed.indexOf("=");
          return [[
            trimmed.slice(0, separator).trim(),
            trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, ""),
          ]];
        })
    );
  } catch {
    return {};
  }
}

const fileEnv = enabled ? localEnvFile() : {};
const testDatabaseUrl = process.env.TEST_DATABASE_URL || fileEnv.TEST_DATABASE_URL;
if (enabled && !testDatabaseUrl) {
  throw new Error("PERF_BENCHMARK requires TEST_DATABASE_URL in the environment or .env.local.");
}

function supabaseProjectRef(connectionString: string | undefined): string | null {
  if (!connectionString) return null;
  try {
    const url = new URL(connectionString);
    const direct = url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i)?.[1];
    if (direct) return direct;
    return decodeURIComponent(url.username).match(/^postgres\.([a-z0-9]+)$/i)?.[1] ?? null;
  } catch {
    return null;
  }
}

if (enabled) {
  const testRef = supabaseProjectRef(testDatabaseUrl);
  const appRef = supabaseProjectRef(process.env.DATABASE_URL || fileEnv.DATABASE_URL);
  const migrationRef = supabaseProjectRef(process.env.DIRECT_URL || fileEnv.DIRECT_URL);
  if (!testRef || !appRef || !migrationRef || testRef === appRef || testRef === migrationRef) {
    throw new Error(
      "Benchmark stopped: TEST_DATABASE_URL must identify a different Supabase project from DATABASE_URL and DIRECT_URL."
    );
  }
}

const suite = enabled ? describe : describe.skip;
const USER_COUNT = 500;
const TASK_COUNT = 2_500;
const SUBMISSION_COUNT = 10_000;
const WARMUP_RUNS = Number(process.env.PERF_WARMUP_RUNS ?? 5);
const MEASURED_RUNS = Number(process.env.PERF_MEASURED_RUNS ?? 30);
const prefix = `perf-${randomUUID().replaceAll("-", "")}`;
const memberIds = Array.from({ length: USER_COUNT }, (_, index) => `${prefix}-member-${index}`);
const adminId = `${prefix}-admin`;
const taskIds = Array.from({ length: TASK_COUNT }, (_, index) => `${prefix}-task-${index}`);
const submissionIds = Array.from(
  { length: SUBMISSION_COUNT },
  (_, index) => `${prefix}-submission-${index}`
);
const db = enabled && testDatabaseUrl
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString: testDatabaseUrl }) })
  : null;

const member: SessionUser = {
  id: memberIds[0],
  name: "Synthetic Performance Member",
  email: `${memberIds[0]}@example.test`,
  role: "MEMBER",
  status: "APPROVED",
};

async function createBatches<T>(rows: T[], create: (batch: T[]) => Promise<unknown>) {
  for (let offset = 0; offset < rows.length; offset += 500) {
    await create(rows.slice(offset, offset + 500));
  }
}

async function seed() {
  const now = new Date();
  await createBatches(
    [
      {
        id: adminId,
        email: `${adminId}@example.test`,
        name: "Synthetic Performance Admin",
        role: "ADMIN" as const,
        status: "APPROVED" as const,
      },
      ...memberIds.map((id, index) => ({
        id,
        email: `${id}@example.test`,
        name: index === 0 ? member.name : `Synthetic Member ${index}`,
        role: "MEMBER" as const,
        status: "APPROVED" as const,
      })),
    ],
    (data) => db!.user.createMany({ data })
  );
  console.info("PERFORMANCE_SEEDED users", USER_COUNT + 1);
  await createBatches(
    taskIds.map((id, index) => ({
      id,
      title: `Synthetic performance task ${index}`,
      description: `Synthetic benchmark catalog entry ${index} with a bounded description.`,
      category: `Category ${index % 10}`,
      pointsMax: 100,
      checklist: ["Synthetic criterion"],
      lifecycle: "PUBLISHED" as const,
      createdById: adminId,
      createdAt: new Date(now.getTime() - index * 60_000),
      publishedAt: new Date(now.getTime() - index * 60_000),
    })),
    (data) => db!.task.createMany({ data })
  );
  console.info("PERFORMANCE_SEEDED tasks", TASK_COUNT);

  const submissions = submissionIds.map((id, index) => {
    const userIndex = index < 500 ? 0 : 1 + ((index - 500) % (USER_COUNT - 1));
    return {
      id,
      taskId: taskIds[index % TASK_COUNT],
      userId: memberIds[userIndex],
      proofUrl: "https://example.test/synthetic-proof",
      note: `Synthetic approved submission ${index}`,
      status: "APPROVED" as const,
      pointsAwarded: index % 101,
      rubricVersion: "performance-v1",
      reviewedById: adminId,
      reviewedAt: new Date(now.getTime() - (index % 60) * 86_400_000),
      submittedAt: new Date(now.getTime() - (index % 60) * 86_400_000),
    };
  });
  await createBatches(submissions, (data) => db!.submission.createMany({ data }));
  console.info("PERFORMANCE_SEEDED submissions", SUBMISSION_COUNT);
  await createBatches(
    submissions.map((submission, index) => ({
      id: `${prefix}-award-${index}`,
      userId: submission.userId,
      submissionId: submission.id,
      reviewedById: adminId,
      amount: index % 101,
      maxPoints: 100,
      rubricVersion: "performance-v1",
      idempotencyKey: `${prefix}-idempotency-${index}`,
      createdAt: now,
    })),
    (data) => db!.pointTransaction.createMany({ data })
  );
  console.info("PERFORMANCE_SEEDED pointTransactions", SUBMISSION_COUNT);

  await db!.streak.create({
    data: { userId: member.id, current: 42, longest: 42, lastApprovedAt: now },
  });
  const activeDays = Array.from({ length: 42 }, (_, index) => {
    const activityDate = new Date(now);
    activityDate.setUTCDate(activityDate.getUTCDate() - (41 - index));
    return {
      userId: member.id,
      activityDate: new Date(
        Date.UTC(activityDate.getUTCFullYear(), activityDate.getUTCMonth(), activityDate.getUTCDate())
      ),
      lastApprovedAt: now,
    };
  });
  await db!.streakDay.createMany({ data: activeDays });
}

async function cleanup() {
  if (!db) return;
  await db.pointTransaction.deleteMany({ where: { id: { startsWith: prefix } } });
  await db.streakDay.deleteMany({ where: { userId: { startsWith: prefix } } });
  await db.streak.deleteMany({ where: { userId: { startsWith: prefix } } });
  await db.submission.deleteMany({ where: { id: { startsWith: prefix } } });
  await db.task.deleteMany({ where: { id: { startsWith: prefix } } });
  await db.user.deleteMany({ where: { id: { startsWith: prefix } } });
}

function request(path: string) {
  return new Request(`http://localhost${path}`, {
    headers: { cookie: `prax_session=${signSession(member)}` },
  });
}

function percentile(sorted: number[], fraction: number) {
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

async function measure(name: string, action: () => Promise<Response>) {
  console.info("PERFORMANCE_START", name);
  for (let run = 0; run < WARMUP_RUNS; run++) {
    const response = await action();
    if (response.status !== 200) throw new Error(`${name} benchmark warmup returned ${response.status}.`);
  }
  const durations: number[] = [];
  for (let run = 0; run < MEASURED_RUNS; run++) {
    const started = performance.now();
    const response = await action();
    const elapsed = performance.now() - started;
    if (response.status !== 200) throw new Error(`${name} benchmark returned ${response.status}.`);
    durations.push(elapsed);
  }
  durations.sort((a, b) => a - b);
  const result = {
    endpoint: name,
    runs: MEASURED_RUNS,
    p50Ms: Number(percentile(durations, 0.5).toFixed(1)),
    p95Ms: Number(percentile(durations, 0.95).toFixed(1)),
    maxMs: Number(durations.at(-1)!.toFixed(1)),
  };
  console.info("PERFORMANCE_RESULT", JSON.stringify(result));
  return result;
}

suite("opt-in isolated endpoint performance benchmark", () => {
  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", testDatabaseUrl!);
    vi.stubEnv("SESSION_SECRET", randomBytes(48).toString("hex"));
    await db!.$connect();
    console.info("PERFORMANCE_DATABASE_CONNECTED");
    await seed();
  }, 300_000);

  afterAll(async () => {
    try {
      await cleanup();
    } finally {
      await db?.$disconnect();
      await getPrismaClient()?.$disconnect();
      vi.unstubAllEnvs();
    }
  }, 120_000);

  it("reports route-handler p50/p95 timings for the documented synthetic dataset", async () => {
    const routeRows = [
      await measure("GET /api/tasks?limit=20", () => getTasks(request("/api/tasks?limit=20"))),
      await measure("GET /api/tasks?search=synthetic&limit=20", () =>
        getTasks(request("/api/tasks?search=synthetic&limit=20"))
      ),
      await measure("GET /api/tasks/:id", () =>
        getTask(request(`/api/tasks/${taskIds[0]}`), { params: Promise.resolve({ id: taskIds[0] }) })
      ),
      await measure("GET /api/submissions?limit=20", () =>
        getSubmissions(request("/api/submissions?limit=20"))
      ),
      await measure("GET /api/leaderboard?period=weekly", () =>
        getLeaderboard(request("/api/leaderboard?period=weekly&limit=20"))
      ),
      await measure("GET /api/leaderboard?period=alltime", () =>
        getLeaderboard(request("/api/leaderboard?period=alltime&limit=20"))
      ),
      await measure("GET /api/streaks", () => getStreaks(request("/api/streaks"))),
    ];
    const host = new URL(testDatabaseUrl!).hostname;
    const region = host.match(/^aws-\d+-(.+)\.pooler\.supabase\.com$/)?.[1] ?? "not identified";
    console.info(
      "PERFORMANCE_BENCHMARK",
      JSON.stringify({
        environment: "Vitest route-handler invocation with remote Supabase PostgreSQL; excludes HTTP/TLS transport",
        databaseRegion: region,
        dataset: {
          users: USER_COUNT + 1,
          tasks: TASK_COUNT,
          submissions: SUBMISSION_COUNT,
          pointTransactions: SUBMISSION_COUNT,
          streakDays: 42,
        },
        warmups: WARMUP_RUNS,
        results: routeRows,
        profile: "not measured; GET /api/workspace remains a 503 stub",
      })
    );
    expect(routeRows).toHaveLength(7);
  }, 600_000);
});
