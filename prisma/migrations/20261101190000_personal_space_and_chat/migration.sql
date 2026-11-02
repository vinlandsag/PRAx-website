-- Personal Space (to-dos, notes, goals) and community chat (messages, reactions), plus the
-- first-visit community-rules acceptance timestamp on the existing preferences row.
-- Generated schema-to-schema with `prisma migrate diff`; foreign keys and the progress CHECK are
-- written inline (like 20261101173000_user_preferences) and names match the generated output.
-- Every new table has RLS enabled with no policies: the app reads and writes them only through
-- server-side routes, and Personal Space rows must always be filtered by the signed-in owner.
CREATE TYPE "TodoDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

CREATE TYPE "TodoPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

ALTER TABLE "UserPreferences" ADD COLUMN "chatRulesAcceptedAt" TIMESTAMPTZ(3);

CREATE TABLE "Todo" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" VARCHAR(5000) NOT NULL DEFAULT '',
  "difficulty" "TodoDifficulty" NOT NULL DEFAULT 'MEDIUM',
  "priority" "TodoPriority" NOT NULL DEFAULT 'MEDIUM',
  "dueDate" DATE,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "taskId" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Todo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Todo_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Todo_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Note" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "content" VARCHAR(5000) NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Note_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Note_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Goal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" VARCHAR(5000) NOT NULL DEFAULT '',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Goal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Goal_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Goal_progress_range" CHECK ("progress" BETWEEN 0 AND 100)
);

CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" VARCHAR(500) NOT NULL,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "editedAt" TIMESTAMPTZ(3),
  "deletedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChatMessage_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "MessageReaction" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emoji" VARCHAR(16) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MessageReaction_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MessageReaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Todo_userId_completed_dueDate_idx" ON "Todo"("userId", "completed", "dueDate");

CREATE INDEX "Todo_taskId_idx" ON "Todo"("taskId");

CREATE INDEX "Note_userId_updatedAt_idx" ON "Note"("userId", "updatedAt");

CREATE INDEX "Goal_userId_createdAt_idx" ON "Goal"("userId", "createdAt");

CREATE INDEX "ChatMessage_createdAt_id_idx" ON "ChatMessage"("createdAt" DESC, "id" DESC);

CREATE INDEX "ChatMessage_pinned_createdAt_idx" ON "ChatMessage"("pinned", "createdAt");

CREATE INDEX "ChatMessage_updatedAt_idx" ON "ChatMessage"("updatedAt");

CREATE INDEX "MessageReaction_userId_idx" ON "MessageReaction"("userId");

CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key"
  ON "MessageReaction"("messageId", "userId", "emoji");

ALTER TABLE "Todo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MessageReaction" ENABLE ROW LEVEL SECURITY;
