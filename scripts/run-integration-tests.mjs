import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const root = fileURLToPath(new URL("..", import.meta.url));

function readLocalEnv() {
  try {
    const entries = readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/);
    return Object.fromEntries(
      entries.flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return [];
        const entry = trimmed.startsWith("export ") ? trimmed.slice(7) : trimmed;
        const separator = entry.indexOf("=");
        if (separator < 1) return [];
        let value = entry.slice(separator + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [[entry.slice(0, separator).trim(), value]];
      })
    );
  } catch {
    return {};
  }
}

function databaseIdentity(connectionString) {
  try {
    const url = new URL(connectionString);
    const supabaseRef =
      url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i)?.[1] ??
      decodeURIComponent(url.username).match(/^postgres\.([a-z0-9]+)$/i)?.[1];
    return supabaseRef ? `supabase:${supabaseRef}` : `${url.hostname.toLowerCase()}${url.pathname}`;
  } catch {
    return null;
  }
}

const localEnv = readLocalEnv();
const env = { ...localEnv, ...process.env };
const testIdentity = databaseIdentity(env.TEST_DATABASE_URL ?? "");
const appIdentity = databaseIdentity(env.DATABASE_URL ?? "");
const migrationIdentity = databaseIdentity(env.DIRECT_URL ?? "");

if (
  !testIdentity ||
  !appIdentity ||
  !migrationIdentity ||
  testIdentity === appIdentity ||
  testIdentity === migrationIdentity
) {
  process.stderr.write(
    "Integration tests stopped: set TEST_DATABASE_URL, DATABASE_URL and DIRECT_URL, and ensure the test database is separate from both application database URLs.\n"
  );
  process.exit(1);
}

const database = new Client({ connectionString: env.TEST_DATABASE_URL, connectionTimeoutMillis: 5000 });
try {
  await database.connect();
  const preflight = await database.query(`
    SELECT 1 AS connected,
      to_regclass('public."User"') AS users_table,
      to_regclass('public."Task"') AS tasks_table,
      to_regclass('public."Submission"') AS submissions_table,
      to_regclass('public."_prisma_migrations"') AS migrations_table
  `);
  const tables = preflight.rows[0];
  if (!tables?.connected || !tables.users_table || !tables.tasks_table || !tables.submissions_table || !tables.migrations_table) {
    process.stderr.write("Integration tests stopped: the separate test database is not fully migrated.\n");
    process.exit(1);
  }
} catch {
  process.stderr.write("Integration tests stopped: the separate test database is unreachable. No tests ran.\n");
  process.exit(1);
} finally {
  await database.end().catch(() => undefined);
}

const testFiles = [
  "src/app/api/auth/auth-flow.integration.test.ts",
  "src/lib/tasks/repository.integration.test.ts",
  "src/lib/submissions/repository.integration.test.ts",
  "src/lib/points/service.integration.test.ts",
  "src/lib/streaks/service.integration.test.ts",
  "src/app/api/review-flow.integration.test.ts",
];
const result = spawnSync(
  process.execPath,
  [join(root, "node_modules/vitest/vitest.mjs"), "run", ...testFiles, "--testTimeout=600000"],
  { cwd: root, env, stdio: "inherit" }
);

if (result.error) {
  process.stderr.write("Could not start the integration test runner.\n");
  process.exit(1);
}
process.exit(result.status ?? 1);
