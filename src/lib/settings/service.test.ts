import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  defaultSettings,
  loadUserSettings,
  parseSettingsPatch,
  saveUserSettings,
  toSettings,
} from "./service";

describe("settings service", () => {
  it("parses settings allowlists and valid values", () => {
    expect(parseSettingsPatch({ theme: "dark", chatNotifications: true })).toEqual({
      ok: true,
      value: { theme: "dark", chatNotifications: true },
    });
    for (const input of [
      { theme: "system" },
      { showPortfolio: 1 },
      { userId: "another-user", theme: "dark" },
      { role: "ADMIN" },
      {},
    ]) {
      expect(parseSettingsPatch(input).ok).toBe(false);
    }
  });

  it("maps persisted enum values and falls back to established UI defaults", () => {
    expect(toSettings(null)).toEqual(defaultSettings);
    expect(
      toSettings({
        theme: "DARK",
        reviewNotifications: false,
        streakReminder: false,
        chatNotifications: true,
        showPortfolio: false,
      })
    ).toEqual({
      theme: "dark",
      reviewNotifications: false,
      streakReminder: false,
      chatNotifications: true,
      showPortfolio: false,
    });
  });

  it("loads and upserts only the specified member preferences", async () => {
    const stored = {
      theme: "LIGHT" as const,
      reviewNotifications: false,
      streakReminder: true,
      chatNotifications: true,
      showPortfolio: false,
    };
    const findUnique = vi.fn().mockResolvedValue(null);
    const upsert = vi.fn().mockResolvedValue(stored);
    const prisma = {
      userPreferences: { findUnique, upsert },
    } as unknown as PrismaClient;
    await expect(loadUserSettings(prisma, "owner-1")).resolves.toEqual(defaultSettings);
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "owner-1" } })
    );
    await expect(saveUserSettings(prisma, "owner-1", { chatNotifications: true })).resolves.toEqual(
      {
        theme: "light",
        reviewNotifications: false,
        streakReminder: true,
        chatNotifications: true,
        showPortfolio: false,
      }
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "owner-1" },
        update: { chatNotifications: true },
        create: expect.objectContaining({
          userId: "owner-1",
          theme: "LIGHT",
          chatNotifications: true,
        }),
      })
    );
  });
});
