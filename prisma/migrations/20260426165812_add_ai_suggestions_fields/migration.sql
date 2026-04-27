-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "aiSuggestionsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxAiSuggestions" INTEGER NOT NULL DEFAULT 3;
