-- Production drift guard for auth fields and Phase 6 story fields.
-- These statements are intentionally idempotent because some Sealos
-- databases may have been synchronized with `prisma db push` already.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "username" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "passwordHash" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

ALTER TABLE "InterviewSession"
  ADD COLUMN IF NOT EXISTS "storyMarkdown" TEXT,
  ADD COLUMN IF NOT EXISTS "storyGeneratedAt" TIMESTAMP(3);
