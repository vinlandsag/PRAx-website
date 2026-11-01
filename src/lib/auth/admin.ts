import type { PrismaClient } from "@/generated/prisma/client";
import { authorize } from "./guard";
import type { SessionUser } from "./types";
import { requirePersistedAccount } from "@/lib/tasks/service";
import { errors } from "@/lib/errors";

export type PersistedAdminResult =
  | { ok: true; admin: SessionUser }
  | { ok: false; response: Response };

export async function requirePersistedAdmin(
  request: Request,
  prisma: PrismaClient
): Promise<PersistedAdminResult> {
  const guard = authorize(request, { requiredRole: "ADMIN" });
  if (!guard.authorized) return { ok: false, response: guard.errorResponse };
  const account = await requirePersistedAccount(prisma, guard.user);
  if (!account.ok) return account;
  if (account.account.role !== "ADMIN") return { ok: false, response: errors.forbidden() };
  return { ok: true, admin: { ...guard.user, ...account.account } };
}
