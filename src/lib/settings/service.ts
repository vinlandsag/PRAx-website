import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { apiError } from "@/lib/errors";
import type { Settings } from "@/lib/workspace/types";

export const defaultSettings: Settings = {
  theme: "light",
  reviewNotifications: true,
  streakReminder: true,
  chatNotifications: false,
  showPortfolio: true,
};

const settingsSelect = {
  theme: true,
  reviewNotifications: true,
  streakReminder: true,
  chatNotifications: true,
  showPortfolio: true,
} satisfies Prisma.UserPreferencesSelect;

export type SettingsPatch = Partial<Settings>;

export function toSettings(
  row: {
    theme: "LIGHT" | "DARK";
    reviewNotifications: boolean;
    streakReminder: boolean;
    chatNotifications: boolean;
    showPortfolio: boolean;
  } | null
): Settings {
  if (!row) return { ...defaultSettings };
  return {
    theme: row.theme.toLowerCase() as Settings["theme"],
    reviewNotifications: row.reviewNotifications,
    streakReminder: row.streakReminder,
    chatNotifications: row.chatNotifications,
    showPortfolio: row.showPortfolio,
  };
}

export function parseSettingsPatch(
  input: Record<string, unknown>
): { ok: true; value: SettingsPatch } | { ok: false; response: Response } {
  const allowed = new Set([
    "theme",
    "reviewNotifications",
    "streakReminder",
    "chatNotifications",
    "showPortfolio",
  ]);
  if (!Object.keys(input).length || Object.keys(input).some((key) => !allowed.has(key)))
    return { ok: false, response: apiError("VALIDATION_ERROR", "Settings are invalid.", 400) };

  const value: SettingsPatch = {};
  if ("theme" in input) {
    if (input.theme !== "light" && input.theme !== "dark")
      return { ok: false, response: apiError("VALIDATION_ERROR", "Settings are invalid.", 400) };
    value.theme = input.theme;
  }
  for (const key of [
    "reviewNotifications",
    "streakReminder",
    "chatNotifications",
    "showPortfolio",
  ] as const) {
    if (key in input) {
      if (typeof input[key] !== "boolean")
        return { ok: false, response: apiError("VALIDATION_ERROR", "Settings are invalid.", 400) };
      value[key] = input[key];
    }
  }
  return { ok: true, value };
}

export async function loadUserSettings(prisma: PrismaClient, userId: string) {
  const row = await prisma.userPreferences.findUnique({
    where: { userId },
    select: settingsSelect,
  });
  return toSettings(row);
}

export async function saveUserSettings(prisma: PrismaClient, userId: string, patch: SettingsPatch) {
  const data: Prisma.UserPreferencesUpdateInput = {
    ...(patch.theme === undefined ? {} : { theme: patch.theme === "dark" ? "DARK" : "LIGHT" }),
    ...(patch.reviewNotifications === undefined
      ? {}
      : { reviewNotifications: patch.reviewNotifications }),
    ...(patch.streakReminder === undefined ? {} : { streakReminder: patch.streakReminder }),
    ...(patch.chatNotifications === undefined
      ? {}
      : { chatNotifications: patch.chatNotifications }),
    ...(patch.showPortfolio === undefined ? {} : { showPortfolio: patch.showPortfolio }),
  };
  const row = await prisma.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      theme: patch.theme === "dark" ? "DARK" : "LIGHT",
      reviewNotifications: patch.reviewNotifications ?? defaultSettings.reviewNotifications,
      streakReminder: patch.streakReminder ?? defaultSettings.streakReminder,
      chatNotifications: patch.chatNotifications ?? defaultSettings.chatNotifications,
      showPortfolio: patch.showPortfolio ?? defaultSettings.showPortfolio,
    },
    update: data,
    select: settingsSelect,
  });
  return toSettings(row);
}
