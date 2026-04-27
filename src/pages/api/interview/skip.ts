import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { questionTemplates, getQuestionById, type QuestionTemplate } from '@/data/question-templates';

type SessionAnswer = {
  questionId: string;
  topicTag: string | null;
  content: string;
  selectedOption: string | null;
  createdAt: Date;
};

type QuestionResponse = {
  questionId: string;
  content: string;
  hint?: string;
  options: QuestionTemplate['options'];
  source: 'local';
  mode: 'dig_deeper' | 'extend_topic' | 'switch_topic' | 'generated';
  answerMode: QuestionTemplate['answerMode'];
  minChoices?: number;
  maxChoices?: number;
  allowTextDetails?: boolean;
  responseCardinality?: QuestionTemplate['responseCardinality'];
  suggestedAnswerCount?: number;
  stageTag: string;
  shouldSuggestPreview?: boolean;
};

/**
 * POST /api/interview/skip
 * 跳题机制（5 次上限）
 * 返回下一题（即时补入）
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId, sessionId, questionId, isOptional } = req.body;

  if (!userId || !sessionId || !questionId) {
    return res.status(400).json({
      success: false,
      error: 'userId, sessionId, and questionId are required',
    });
  }

  try {
    // 获取访谈会话
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          select: {
            questionId: true,
            topicTag: true,
            content: true,
            selectedOption: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // 对于可选题目，不计入跳题次数，但仍需调度下一题
    if (isOptional) {
      const answers = session.answers as SessionAnswer[];
      const answeredQuestionIds = answers.map((answer) => answer.questionId);
      const skippedIds = session.skippedQuestionIds || [];
      const excludedIds = new Set([...answeredQuestionIds, ...skippedIds, questionId]);

      const nextQuestion = selectNextQuestion(excludedIds);

      if (!nextQuestion) {
        return res.status(200).json({
          success: true,
          data: {
            questionId: 'COMPLETED_BY_PREVIEW',
            content: '这轮可问的内容先到这里了。您可以先生成当前版本，也可以稍后继续补充。',
            source: 'local',
            mode: 'switch_topic',
            shouldSuggestPreview: true,
            isOptional: true,
            skippedCount: session.skippedCount,
            remainingSkips: 5 - session.skippedCount,
            message: '可选题目已跳过',
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          ...toQuestionResponse(nextQuestion, 'switch_topic'),
          skippedCount: session.skippedCount,
          remainingSkips: 5 - session.skippedCount,
          baseSlotsUsed: session.baseSlotsUsed,
          baseSlotsTotal: session.baseSlotsTotal,
          isOptional: nextQuestion.draftImportance === 'optional_reserve',
          message: '可选题目已跳过',
        },
      });
    }

    // 检查跳题次数上限
    if (session.skippedCount >= 5) {
      return res.status(400).json({
        success: false,
        error: '已达到跳题次数上限（5 次）',
      });
    }

    // 原子事务：更新跳题次数和记录被跳过的题目
    const updatedSession = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        skippedCount: { increment: 1 },
        skippedQuestionIds: {
          push: questionId,
        },
        updatedAt: new Date(),
      },
    });

    console.log('[Skip] 跳过题目:', questionId);
    console.log('[Skip] 当前已跳过题目列表:', updatedSession.skippedQuestionIds);

    const remainingSkips = 5 - updatedSession.skippedCount;

    // 调度下一题
    const answers = session.answers as SessionAnswer[];
    const answeredQuestionIds = answers.map((answer) => answer.questionId);
    const skippedIds = updatedSession.skippedQuestionIds;
    const excludedIds = new Set([...answeredQuestionIds, ...skippedIds]);

    const nextQuestion = selectNextQuestion(excludedIds);

    if (!nextQuestion) {
      return res.status(200).json({
        success: true,
        data: {
          questionId: 'COMPLETED_BY_PREVIEW',
          content: '这轮可问的内容先到这里了。您可以先生成当前版本，也可以稍后继续补充。',
          source: 'local',
          mode: 'switch_topic',
          shouldSuggestPreview: true,
          isOptional: true,
          skippedCount: updatedSession.skippedCount,
          remainingSkips,
          message: remainingSkips > 0
            ? `还可跳过 ${remainingSkips} 次`
            : '跳题次数已用完',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...toQuestionResponse(nextQuestion, 'switch_topic'),
        skippedCount: updatedSession.skippedCount,
        remainingSkips,
        baseSlotsUsed: updatedSession.baseSlotsUsed,
        baseSlotsTotal: updatedSession.baseSlotsTotal,
        isOptional: nextQuestion.draftImportance === 'optional_reserve',
        message: remainingSkips > 0
          ? `还可跳过 ${remainingSkips} 次`
          : '跳题次数已用完',
      },
    });
  } catch (error) {
    console.error('Skip question error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

function selectNextQuestion(excludedIds: Set<string>): QuestionTemplate | null {
  const availableQuestions = questionTemplates.filter(
    (q) => !excludedIds.has(q.id) && q.draftImportance !== 'optional_reserve'
  );

  if (availableQuestions.length === 0) {
    return null;
  }

  // 优先选择未覆盖的主题
  const coveredStages = new Set<string>();
  Array.from(excludedIds).forEach((id) => {
    const q = getQuestionById(id);
    if (q?.stageTag) {
      coveredStages.add(q.stageTag);
    }
  });

  const uncoveredQuestions = availableQuestions.filter(
    (q) => q.stageTag && !coveredStages.has(q.stageTag)
  );

  if (uncoveredQuestions.length > 0) {
    return uncoveredQuestions[0];
  }

  return availableQuestions[0];
}

function toQuestionResponse(
  question: QuestionTemplate,
  mode: 'dig_deeper' | 'extend_topic' | 'switch_topic' | 'generated'
): QuestionResponse {
  return {
    questionId: question.id,
    content: question.content,
    hint: question.hint,
    options: question.options || [],
    source: 'local',
    mode,
    answerMode: question.answerMode,
    minChoices: question.minChoices,
    maxChoices: question.maxChoices,
    allowTextDetails: question.allowTextDetails,
    responseCardinality: question.responseCardinality,
    suggestedAnswerCount: question.suggestedAnswerCount,
    stageTag: question.stageTag,
  };
}
