-- Persist settings against the existing account identity. Defaults preserve
-- the current Settings UI defaults for users who have not saved preferences.
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK');

CREATE TABLE "UserPreferences" (
  "userId" TEXT NOT NULL,
  "theme" "ThemePreference" NOT NULL DEFAULT 'LIGHT',
  "reviewNotifications" BOOLEAN NOT NULL DEFAULT true,
  "streakReminder" BOOLEAN NOT NULL DEFAULT true,
  "chatNotifications" BOOLEAN NOT NULL DEFAULT false,
  "showPortfolio" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "UserPreferences_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "UserPreferences" ENABLE ROW LEVEL SECURITY;
