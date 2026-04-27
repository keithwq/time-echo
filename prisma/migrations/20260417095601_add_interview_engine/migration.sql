-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'CARING_VOLUNTEER', 'WRITING_MENTOR');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "real_name" VARCHAR(50),
    "birth_year" INTEGER,
    "gender" VARCHAR(10),
    "birth_place" VARCHAR(100),
    "ink_balance" INTEGER NOT NULL DEFAULT 50,
    "management_ink" INTEGER NOT NULL DEFAULT 0,
    "total_words_written" INTEGER NOT NULL DEFAULT 0,
    "total_ink_consumed" INTEGER NOT NULL DEFAULT 0,
    "monthly_expense" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active_deadline" TIMESTAMP(3) NOT NULL,
    "protection_end" TIMESTAMP(3) NOT NULL,
    "destruction_date" TIMESTAMP(3) NOT NULL,
    "wechat_notify_token" TEXT,
    "emergency_email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "freePolishUsed" BOOLEAN NOT NULL DEFAULT false,
    "baseInterviewFrozenDrops" INTEGER NOT NULL DEFAULT 0,
    "extensionDropsRemaining" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InkLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InkLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MutualAidTask" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "mentorId" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "locked_ink" INTEGER NOT NULL,
    "requirement_desc" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "scrollId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MutualAidTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scroll" (
    "id" TEXT NOT NULL,
    "scrollNum" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Memory',
    "content" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "contentTemplate" TEXT NOT NULL,
    "hintTemplate" TEXT,
    "topicTags" TEXT[],
    "demographicTags" TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "scrollId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolishLog" (
    "id" TEXT NOT NULL,
    "scrollId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "polishedText" TEXT NOT NULL,
    "aiAction" TEXT NOT NULL,
    "nextQuestions" TEXT[],
    "tokenUsed" INTEGER NOT NULL,
    "costRMB" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolishLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "baseSlotsTotal" INTEGER NOT NULL DEFAULT 50,
    "baseSlotsUsed" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionContent" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceQuestionMode" TEXT NOT NULL,
    "extractedEntities" JSONB,
    "topicTag" TEXT,
    "emotionTag" TEXT,
    "polishedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "demographicTags" TEXT[],
    "coveredTopics" TEXT[],
    "keyLifeEvents" TEXT[],
    "peopleMentions" TEXT[],
    "placeMentions" TEXT[],
    "emotionTags" TEXT[],
    "currentStateSummary" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoryProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_wechat_notify_token_key" ON "User"("wechat_notify_token");

-- CreateIndex
CREATE INDEX "User_destruction_date_idx" ON "User"("destruction_date");

-- CreateIndex
CREATE INDEX "InkLog_userId_createdAt_idx" ON "InkLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "InkLog_taskId_idx" ON "InkLog"("taskId");

-- CreateIndex
CREATE INDEX "MutualAidTask_mentorId_status_idx" ON "MutualAidTask"("mentorId", "status");

-- CreateIndex
CREATE INDEX "MutualAidTask_clientId_idx" ON "MutualAidTask"("clientId");

-- CreateIndex
CREATE INDEX "MutualAidTask_status_createdAt_idx" ON "MutualAidTask"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Scroll_userId_createdAt_idx" ON "Scroll"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Scroll_userId_scrollNum_idx" ON "Scroll"("userId", "scrollNum");

-- CreateIndex
CREATE INDEX "Question_topicTags_idx" ON "Question"("topicTags");

-- CreateIndex
CREATE INDEX "Question_demographicTags_idx" ON "Question"("demographicTags");

-- CreateIndex
CREATE INDEX "Image_scrollId_idx" ON "Image"("scrollId");

-- CreateIndex
CREATE INDEX "PolishLog_scrollId_createdAt_idx" ON "PolishLog"("scrollId", "createdAt");

-- CreateIndex
CREATE INDEX "InterviewSession_userId_isCompleted_idx" ON "InterviewSession"("userId", "isCompleted");

-- CreateIndex
CREATE INDEX "InterviewAnswer_userId_sessionId_idx" ON "InterviewAnswer"("userId", "sessionId");

-- CreateIndex
CREATE INDEX "InterviewAnswer_sessionId_createdAt_idx" ON "InterviewAnswer"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryProfile_userId_key" ON "MemoryProfile"("userId");

-- AddForeignKey
ALTER TABLE "InkLog" ADD CONSTRAINT "InkLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutualAidTask" ADD CONSTRAINT "MutualAidTask_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutualAidTask" ADD CONSTRAINT "MutualAidTask_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scroll" ADD CONSTRAINT "Scroll_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_scrollId_fkey" FOREIGN KEY ("scrollId") REFERENCES "Scroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolishLog" ADD CONSTRAINT "PolishLog_scrollId_fkey" FOREIGN KEY ("scrollId") REFERENCES "Scroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAnswer" ADD CONSTRAINT "InterviewAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAnswer" ADD CONSTRAINT "InterviewAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryProfile" ADD CONSTRAINT "MemoryProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
