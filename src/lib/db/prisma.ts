import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as typeof globalThis & { praxPrisma?: PrismaClient };

export function getPrismaClient(): PrismaClient | null {
  if (!env.databaseUrl) return null;
  if (!globalForPrisma.praxPrisma) {
    const adapter = new PrismaPg({ connectionString: env.databaseUrl });
    globalForPrisma.praxPrisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.praxPrisma;
}
