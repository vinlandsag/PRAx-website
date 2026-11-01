import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";
import { env } from "./src/lib/env";

loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env.directDatabaseUrl },
});
