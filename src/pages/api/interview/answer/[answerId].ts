import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/interview/answer/:answerId
 * 更新单个答案
 * DELETE /api/interview/answer/:answerId
 * 删除答案并回滚会话计数
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { answerId } = req.query;

  if (req.method === 'PUT') {
    const { userId, content } = req.body;

    if (!answerId || typeof answerId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'answerId is required',
      });
    }

    if (!userId || !content) {
      return res.status(400).json({
        success: false,
        error: 'userId and content are required',
      });
    }

    try {
      // 1. 验证答案归属
      const answer = await prisma.interviewAnswer.findUnique({
        where: { id: answerId },
      });

      if (!answer) {
        return res.status(404).json({ success: false, error: 'Answer not found' });
      }

      if (answer.userId !== userId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      // 2. 更新答案
      const updated = await prisma.interviewAnswer.update({
        where: { id: answerId },
        data: { content },
      });

      // 3. 如果已生成过回忆录，标记需要重新生成
      await prisma.interviewSession.update({
        where: { id: answer.sessionId },
        data: { isGenerated: false },
      });

      return res.status(200).json({
        success: true,
        data: { answer: updated },
      });
    } catch (error) {
      console.error('Update answer error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  if (req.method === 'DELETE') {
    if (!answerId || typeof answerId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'answerId is required',
      });
    }

    try {
      const answer = await prisma.interviewAnswer.findUnique({
        where: { id: answerId },
        select: { sessionId: true, questionId: true }
      });

      if (!answer) {
        return res.status(404).json({ success: false, error: 'Answer not found' });
      }

      await prisma.$transaction([
        prisma.interviewAnswer.delete({ where: { id: answerId } }),
        prisma.interviewSession.update({
          where: { id: answer.sessionId },
          data: {
            baseSlotsUsed: answer.questionId.startsWith('deepdive_')
              ? undefined
              : { decrement: 1 },
            isGenerated: false
          }
        })
      ]);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete answer error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
