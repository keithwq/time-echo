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

  const { userId, sessionId, unusedAnswerId, elaboration } = req.body;

  if (!userId || !sessionId || !unusedAnswerId || !elaboration) {
    return res.status(400).json({
      success: false,
      error: 'userId, sessionId, unusedAnswerId, and elaboration are required',
    });
  }

  try {
    // 验证会话
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

    // 获取原始未入稿答案
    const originalAnswer = await prisma.interviewAnswer.findUnique({
      where: { id: unusedAnswerId },
    });

    if (!originalAnswer || originalAnswer.sessionId !== sessionId) {
      return res.status(404).json({ success: false, error: 'Answer not found' });
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { real_name: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 创建新的展开答案
    const entities = extractEntities(elaboration);
    const emotionTag = entities.emotionInfo.positive[0] || entities.emotionInfo.negative[0];

    const newAnswer = await prisma.interviewAnswer.create({
      data: {
        userId,
        sessionId,
        questionId: originalAnswer.questionId,
        questionContent: originalAnswer.questionContent,
        content: elaboration,
        sourceQuestionMode: 'elaborate',
        sourceType: 'elaborate',
        topicTag: originalAnswer.topicTag,
        emotionTag,
        extractedEntities: entities as any,
      },
    });

    // 获取所有答案
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
      const q = getQuestionById(answer.questionId);
      return {
        id: answer.id,
        questionContent: answer.questionContent,
        content: answer.content,
        topicTag: answer.topicTag,
        stageTag: q?.stageTag,
        narrativeRole: q?.narrativeRole || 'representative_event',
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
        lastCompletionMode: 'elaborate',
        memoirVersion: session.memoirVersion + 1,
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
        newAnswerId: newAnswer.id,
        updatedMemoir: memoirResponse,
        memoirVersion: session.memoirVersion + 1,
      },
    });
  } catch (error) {
    console.error('Save elaborate answer error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
