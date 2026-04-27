import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/interview/start
 * 开始访谈会话，冻结 40 水滴
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId is required' });
  }

  try {
    // 检查用户是否已有进行中的访谈会话
    const existingSession = await prisma.interviewSession.findFirst({
      where: {
        userId,
        isCompleted: false,
      },
    });

    if (existingSession) {
      return res.status(200).json({
        success: true,
        data: {
          sessionId: existingSession.id,
          baseSlotsUsed: existingSession.baseSlotsUsed,
          baseSlotsTotal: existingSession.baseSlotsTotal,
          skippedCount: existingSession.skippedCount,
          message: '继续之前的访谈',
        },
      });
    }

    // 检查用户水滴余额
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { ink_balance: true, baseInterviewFrozenDrops: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.ink_balance < 40) {
      return res.status(400).json({
        success: false,
        error: '水滴不足，需要至少 40 个水滴开始访谈',
      });
    }

    // 原子事务：冻结水滴 + 创建访谈会话
    const result = await prisma.$transaction(async (tx) => {
      // 冻结 40 水滴
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          ink_balance: { decrement: 40 },
          baseInterviewFrozenDrops: 40,
          extensionDropsRemaining: 10,
        },
      });

      // 创建访谈会话
      const session = await tx.interviewSession.create({
        data: {
          userId,
          baseSlotsTotal: 50,
          baseSlotsUsed: 0,
          skippedCount: 0,
          isCompleted: false,
          isGenerated: false,
        },
      });

      // 记录墨水流水
      await tx.inkLog.create({
        data: {
          userId,
          amount: -40,
          reason: '基础访谈冻结',
          balance_after: updatedUser.ink_balance,
        },
      });

      return { session, user: updatedUser };
    });

    return res.status(200).json({
      success: true,
      data: {
        sessionId: result.session.id,
        baseSlotsUsed: result.session.baseSlotsUsed,
        baseSlotsTotal: result.session.baseSlotsTotal,
        skippedCount: result.session.skippedCount,
        frozenDrops: 40,
        remainingBalance: result.user.ink_balance,
        message: '访谈已开始，已冻结 40 个水滴',
      },
    });
  } catch (error) {
    console.error('Start interview error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
