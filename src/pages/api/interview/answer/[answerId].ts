import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/interview/answer/:answerId
 * 更新单个答案
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { answerId } = req.query;
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
