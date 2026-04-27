import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/interview/extend
 * 增加问题位（1 墨水增加 2 个问题位）
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId, sessionId } = req.body;

  if (!userId || !sessionId) {
    return res.status(400).json({
      success: false,
      error: 'userId and sessionId are required',
    });
  }

  try {
    // 原子事务：扣除墨水 + 增加问题位 + 记录流水
    const result = await prisma.$transaction(async (tx) => {
      // 查询用户
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // 检查剩余墨水
      if (user.extensionDropsRemaining < 10) {
        throw new Error('Insufficient extension drops');
      }

      // 查询会话
      const session = await tx.interviewSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.userId !== userId) {
        throw new Error('Session does not belong to this user');
      }

      // 扣除 10 个墨水
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          extensionDropsRemaining: { decrement: 10 },
        },
      });

      // 增加 10 个问题位，进入扩展模式
      const updatedSession = await tx.interviewSession.update({
        where: { id: sessionId },
        data: {
          baseSlotsTotal: { increment: 10 },
          isInExpansionMode: true,
        },
      });

      // 记录墨水流水
      await tx.inkLog.create({
        data: {
          userId,
          amount: -10,
          reason: '扩展题目包（10题）',
          balance_after: updatedUser.extensionDropsRemaining,
        },
      });

      return {
        user: updatedUser,
        session: updatedSession,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        newSlotsTotal: result.session.baseSlotsTotal,
        extensionDropsRemaining: result.user.extensionDropsRemaining,
        message: '已开启扩展题目包，增加 10 个问题位',
      },
    });
  } catch (error) {
    console.error('Extend interview error:', error);

    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      if (error.message === 'Session not found') {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }
      if (error.message === 'Insufficient extension drops') {
        return res.status(400).json({
          success: false,
          error: '扩展墨水不足',
        });
      }
      if (error.message === 'Session does not belong to this user') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized',
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
