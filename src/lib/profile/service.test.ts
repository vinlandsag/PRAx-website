import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { loadOwnProfileStats, parseProfilePatch, toOwnProfile } from "./service";

describe("profile service", () => {
  it("validates and normalizes editable profile fields", () => {
    expect(
      parseProfilePatch({
        name: "  Milan  ",
        handle: " @milan_builds ",
        bio: "  Builder  ",
        skills: [" TypeScript ", "Design"],
        portfolioUrl: " https://example.test/work ",
      })
    ).toEqual({
      ok: true,
      value: {
        name: "Milan",
        handle: "@milan_builds",
        bio: "Builder",
        skills: ["TypeScript", "Design"],
        portfolioUrl: "https://example.test/work",
      },
    });
  });

  it("allows optional fields to be cleared and rejects unknown or malformed values", async () => {
    expect(parseProfilePatch({ bio: "", portfolioUrl: "" })).toEqual({
      ok: true,
      value: { bio: "", portfolioUrl: "" },
    });
    const invalid = [
      { userId: "other-user" },
      { name: " " },
      { handle: "@a" },
      { skills: ["   "] },
      { avatarUrl: "https://user:password@example.test/avatar.png" },
      { githubUrl: "data:image/png;base64,xxx" },
    ];
    for (const value of invalid) {
      expect(parseProfilePatch(value).ok).toBe(false);
    }
  });

  it("returns a stable fallback handle without exposing account details", () => {
    const profile = toOwnProfile({
      id: "some-database-id",
      name: "Milan",
      handle: null,
      bio: "",
      skills: [],
      currentProject: "",
      portfolioUrl: "",
      githubUrl: "",
      linkedinUrl: "",
      avatarUrl: "",
    });
    expect(profile.handle).toMatch(/^@u_[a-f0-9]{32}$/);
    expect(profile).not.toHaveProperty("id");
    expect(profile).not.toHaveProperty("email");
  });

  it("derives displayed points, rank, streak, and approved-task count from persisted services", async () => {
    const userId = "member-1";
    const current = { kind: "CURRENT", id: userId, name: "Member", points: "320", rank: 2, streak: 6 };
    const queryRaw = vi
      .fn()
      .mockResolvedValueOnce([{ total: 1 }])
      .mockResolvedValueOnce([current])
      .mockResolvedValueOnce([{ total: 1 }])
      .mockResolvedValueOnce([{ ...current, points: "85", rank: 3 }]);
    const prisma = {
      $queryRaw: queryRaw,
      $transaction: vi.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
      streak: { findUnique: vi.fn().mockResolvedValue({ current: 6 }) },
      submission: { count: vi.fn().mockResolvedValue(9) },
    };

    await expect(loadOwnProfileStats(prisma as unknown as PrismaClient, userId)).resolves.toEqual({
      totalPoints: 320,
      weeklyRank: 3,
      dayStreak: 6,
      tasksApproved: 9,
    });
  });
});
