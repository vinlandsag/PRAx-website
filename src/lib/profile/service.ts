import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { apiError } from "@/lib/errors";
import { getLeaderboard } from "@/lib/points/service";
import { isSafeUrl } from "@/lib/utils/url";

export const ownProfileSelect = {
  id: true,
  name: true,
  handle: true,
  bio: true,
  skills: true,
  currentProject: true,
  portfolioUrl: true,
  githubUrl: true,
  linkedinUrl: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

type OwnProfileRecord = Prisma.UserGetPayload<{ select: typeof ownProfileSelect }>;

export interface OwnProfile {
  name: string;
  handle: string;
  bio: string;
  skills: string[];
  currentProject: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  avatarUrl: string;
}

export interface OwnProfileStats {
  totalPoints: number;
  weeklyRank: number | null;
  dayStreak: number;
  tasksApproved: number;
}

export type ProfilePatch = Partial<OwnProfile>;

export function toOwnProfile(user: OwnProfileRecord): OwnProfile {
  const stableFallbackHandle = `@u_${createHash("sha256").update(user.id).digest("hex").slice(0, 32)}`;
  return {
    name: user.name,
    handle: user.handle ?? stableFallbackHandle,
    bio: user.bio,
    skills: user.skills,
    currentProject: user.currentProject,
    portfolioUrl: user.portfolioUrl,
    githubUrl: user.githubUrl,
    linkedinUrl: user.linkedinUrl,
    avatarUrl: user.avatarUrl,
  };
}

const invalidProfile = () =>
  apiError("VALIDATION_ERROR", "Profile fields are invalid.", 400);

function parseProfileUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2048) return undefined;
  const url = value.trim();
  if (!url) return "";
  if (!isSafeUrl(url)) return undefined;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname || parsed.username || parsed.password) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

export function parseProfilePatch(input: Record<string, unknown>):
  | { ok: true; value: ProfilePatch }
  | { ok: false; response: Response } {
  const allowed = new Set([
    "name",
    "handle",
    "bio",
    "skills",
    "currentProject",
    "portfolioUrl",
    "githubUrl",
    "linkedinUrl",
    "avatarUrl",
  ]);
  if (!Object.keys(input).length || Object.keys(input).some((key) => !allowed.has(key)))
    return { ok: false, response: invalidProfile() };

  const value: ProfilePatch = {};
  if ("name" in input) {
    if (typeof input.name !== "string" || !input.name.trim() || input.name.trim().length > 100)
      return { ok: false, response: invalidProfile() };
    value.name = input.name.trim();
  }
  if ("handle" in input) {
    if (typeof input.handle !== "string" || !/^@[A-Za-z0-9_]{2,49}$/.test(input.handle.trim()))
      return { ok: false, response: invalidProfile() };
    value.handle = input.handle.trim();
  }
  if ("bio" in input) {
    if (typeof input.bio !== "string" || input.bio.length > 500)
      return { ok: false, response: invalidProfile() };
    value.bio = input.bio.trim();
  }
  if ("skills" in input) {
    if (
      !Array.isArray(input.skills) ||
      input.skills.length > 15 ||
      input.skills.some(
        (skill) => typeof skill !== "string" || !skill.trim() || skill.trim().length > 40
      )
    )
      return { ok: false, response: invalidProfile() };
    value.skills = input.skills.map((skill) => (skill as string).trim());
  }
  if ("currentProject" in input) {
    if (typeof input.currentProject !== "string" || input.currentProject.trim().length > 200)
      return { ok: false, response: invalidProfile() };
    value.currentProject = input.currentProject.trim();
  }
  for (const key of ["portfolioUrl", "githubUrl", "linkedinUrl", "avatarUrl"] as const) {
    if (key in input) {
      const parsed = parseProfileUrl(input[key]);
      if (parsed === undefined) return { ok: false, response: invalidProfile() };
      value[key] = parsed;
    }
  }
  return { ok: true, value };
}

export function isUniqueHandleConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function loadOwnProfile(prisma: PrismaClient, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: ownProfileSelect });
  return user ? toOwnProfile(user) : null;
}

export async function saveOwnProfile(prisma: PrismaClient, userId: string, patch: ProfilePatch) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: patch,
    select: ownProfileSelect,
  });
  return toOwnProfile(user);
}

export async function loadOwnProfileStats(
  prisma: PrismaClient,
  userId: string
): Promise<OwnProfileStats> {
  const [allTime, weekly, streak, tasksApproved] = await Promise.all([
    getLeaderboard(prisma, userId, { period: "alltime", limit: 1, offset: 0 }),
    getLeaderboard(prisma, userId, { period: "weekly", limit: 1, offset: 0 }),
    prisma.streak.findUnique({ where: { userId }, select: { current: true } }),
    prisma.submission.count({ where: { userId, status: "APPROVED" } }),
  ]);
  return {
    totalPoints: allTime.currentUser?.points ?? 0,
    weeklyRank: weekly.currentUser?.rank ?? null,
    dayStreak: streak?.current ?? 0,
    tasksApproved,
  };
}
