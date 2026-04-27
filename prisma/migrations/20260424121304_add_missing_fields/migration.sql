-- AlterTable
ALTER TABLE "InterviewAnswer" ADD COLUMN     "adaptedAnswerOptions" JSONB,
ADD COLUMN     "customAnswer" TEXT,
ADD COLUMN     "nestedAnswers" JSONB,
ADD COLUMN     "originalQuestionId" TEXT,
ADD COLUMN     "parentOptionValue" TEXT,
ADD COLUMN     "parentQuestionId" TEXT,
ADD COLUMN     "selectedOption" TEXT,
ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'local';

-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "expansionPacksUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isInExpansionMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastRecommendedQuestionId" TEXT,
ADD COLUMN     "skippedQuestionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "staticMatchCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "adaptableAnswerTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "answerType" TEXT NOT NULL DEFAULT 'choice',
ADD COLUMN     "detailTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "options" JSONB,
ADD COLUMN     "questionPhase" TEXT NOT NULL DEFAULT 'base',
ADD COLUMN     "stageTag" TEXT;

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_userId_createdAt_idx" ON "Feedback"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Question_questionPhase_idx" ON "Question"("questionPhase");

-- CreateIndex
CREATE INDEX "Question_stageTag_idx" ON "Question"("stageTag");
