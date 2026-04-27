import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { validateUUID } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, userId } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new NotFoundError('会话 ID 无效');
    }

    validateUUID(sessionId, '会话 ID');

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            questionId: true,
            questionContent: true,
            content: true,
            selectedOption: true,
            customAnswer: true,
            topicTag: true,
            emotionTag: true,
            polishedText: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundError('会话不存在');
    }

    // 验证会话归属（如果传了 userId）
    if (userId && typeof userId === 'string') {
      if (session.userId !== userId) {
        throw new NotFoundError('会话不存在');
      }
    }

    // 获取记忆画像
    const memoryProfile = await prisma.memoryProfile.findUnique({
      where: { userId: session.userId },
    });

    res.status(200).json({ ...session, memoryProfile });
  } catch (error) {
    const { status, body } = handleApiError(error);
    res.status(status).json(body);
  }
}
