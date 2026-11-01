-- Add editable profile fields to the existing User identity record.
-- Nullable handles preserve compatibility with existing accounts; the API
-- supplies a deterministic display handle until the member saves one.
ALTER TABLE "User"
  ADD COLUMN "handle" VARCHAR(50),
  ADD COLUMN "bio" VARCHAR(500) NOT NULL DEFAULT '',
  ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "currentProject" VARCHAR(200) NOT NULL DEFAULT '',
  ADD COLUMN "portfolioUrl" VARCHAR(2048) NOT NULL DEFAULT '',
  ADD COLUMN "githubUrl" VARCHAR(2048) NOT NULL DEFAULT '',
  ADD COLUMN "linkedinUrl" VARCHAR(2048) NOT NULL DEFAULT '',
  ADD COLUMN "avatarUrl" VARCHAR(2048) NOT NULL DEFAULT '';

CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");
