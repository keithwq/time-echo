import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateMemoirWithUnused } from '@/lib/memoirGenerator';
import { getQuestionById } from '@/data/question-templates';
import { extractEntities } from '@/lib/extraction';

interface MemoirResponse {
  title: string;
  wordCount: number;
  sections: Array<{ stage: string; title: string; content: string }>;
  generatedAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId, sessionId, completionPackageId, answers, mode } = req.body as {
    userId: string;
    sessionId: string;
    completionPackageId: string;
    answers: Array<{ questionId: string; questionContent: string; content: string }>;
    mode: string;
  };

  if (!userId || !sessionId || !completionPackageId || !answers || !mode) {
    return res.status(400).json({
      success: false,
      error: 'userId, sessionId, completionPackageId, answers, and mode are required',
    });
  }

  try {
    // 验证会话和补全包
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          select: {
            id: true,
            questionId: true,
            questionContent: true,
            content: true,
            topicTag: true,
            nestedAnswers: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const completionPackage = await prisma.completionPackage.findUnique({
      where: { id: completionPackageId },
    });

    if (!completionPackage || completionPackage.sessionId !== sessionId) {
      return res.status(404).json({ success: false, error: 'Completion package not found' });
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { real_name: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 保存补全答案
    const newAnswerIds: string[] = [];
    for (const answer of answers) {
      const question = getQuestionById(answer.questionId);
      const entities = extractEntities(answer.content);
      const emotionTag = entities.emotionInfo.positive[0] || entities.emotionInfo.negative[0];

      const newAnswer = await prisma.interviewAnswer.create({
        data: {
          userId,
          sessionId,
          questionId: answer.questionId,
          questionContent: answer.questionContent || answer.questionId,
          content: answer.content,
          sourceQuestionMode: 'completion',
          sourceType: 'completion',
          topicTag: question?.stageTag,
          emotionTag,
          extractedEntities: entities as any,
        },
      });

      newAnswerIds.push(newAnswer.id);
    }

    // 获取所有答案（包括新补全答案）
    const allAnswers = await prisma.interviewAnswer.findMany({
      where: { sessionId },
      select: {
        id: true,
        questionId: true,
        questionContent: true,
        content: true,
        topicTag: true,
        nestedAnswers: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 转换回答格式
    const formattedAnswers = allAnswers.map((answer) => {
      const question = getQuestionById(answer.questionId);
      return {
        id: answer.id,
        questionContent: answer.questionContent,
        content: answer.content,
        topicTag: answer.topicTag,
        stageTag: question?.stageTag,
        narrativeRole: question?.narrativeRole || 'representative_event',
        createdAt: answer.createdAt,
        nestedAnswers: answer.nestedAnswers,
      };
    });

    // 重新生成回忆录
    const { memoir } = generateMemoirWithUnused(
      formattedAnswers as any,
      user.real_name || '您'
    );

    // 更新会话状态
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        lastCompletionMode: mode,
        memoirVersion: session.memoirVersion + 1,
      },
    });

    // 更新补全包状态
    await prisma.completionPackage.update({
      where: { id: completionPackageId },
      data: {
        isAnswered: true,
        answeredAt: new Date(),
      },
    });

    const memoirResponse: MemoirResponse = {
      title: memoir.title,
      wordCount: memoir.wordCount,
      sections: memoir.sections,
      generatedAt: memoir.generatedAt,
    };

    return res.status(200).json({
      success: true,
      data: {
        newAnswerIds,
        updatedMemoir: memoirResponse,
        memoirVersion: session.memoirVersion + 1,
      },
    });
  } catch (error) {
    console.error('Save completion answer error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
