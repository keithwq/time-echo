-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "completionPackageId" TEXT,
ADD COLUMN     "lastCompletionMode" TEXT,
ADD COLUMN     "memoirVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "CompletionPackage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "identifiedGaps" TEXT[],
    "gapSummary" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "isAnswered" BOOLEAN NOT NULL DEFAULT false,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompletionPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompletionPackage_sessionId_key" ON "CompletionPackage"("sessionId");

-- CreateIndex
CREATE INDEX "CompletionPackage_sessionId_idx" ON "CompletionPackage"("sessionId");

-- CreateIndex
CREATE INDEX "CompletionPackage_createdAt_idx" ON "CompletionPackage"("createdAt");

-- AddForeignKey
ALTER TABLE "CompletionPackage" ADD CONSTRAINT "CompletionPackage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
