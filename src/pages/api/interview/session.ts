import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/interview/session
 * 获取会话信息和答案列表，不触发生成
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'sessionId is required',
    });
  }

  try {
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

    return res.status(200).json({
      success: true,
      data: {
        session,
        isGenerated: session.isGenerated,
        answersCount: session.answers.length,
        aiSuggestionsUsed: session.aiSuggestionsUsed,
        maxAiSuggestions: session.maxAiSuggestions,
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
