import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { validateUUID } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, limit = '10', offset = '0' } = req.query;

    if (!userId || typeof userId !== 'string') {
      throw new NotFoundError('用户 ID 无效');
    }

    validateUUID(userId, '用户 ID');

    const limitNum = Math.min(Math.max(parseInt(limit as string) || 10, 1), 50);
    const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const [sessions, total] = await Promise.all([
      prisma.interviewSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: limitNum,
        skip: offsetNum,
        select: {
          id: true,
          baseSlotsTotal: true,
          baseSlotsUsed: true,
          skippedCount: true,
          isCompleted: true,
          isGenerated: true,
          startedAt: true,
          updatedAt: true,
          // 统计回答数和总字数，避免 N+1
          answers: {
            select: {
              content: true,
              topicTag: true,
            },
          },
        },
      }),
      prisma.interviewSession.count({ where: { userId } }),
    ]);

    // 在应用层计算统计数据，避免 N+1
    const sessionsWithStats = sessions.map((session) => {
      const totalWords = session.answers.reduce((sum, a) => sum + a.content.length, 0);
      const coveredTopics = new Set(session.answers.map((a) => a.topicTag).filter(Boolean)).size;
      const { answers: _, ...sessionBase } = session;
      return {
        ...sessionBase,
        totalWords,
        coveredTopics,
        answerCount: session.answers.length,
      };
    });

    res.status(200).json({ sessions: sessionsWithStats, total });
  } catch (error) {
    const { status, body } = handleApiError(error);
    res.status(status).json(body);
  }
}
