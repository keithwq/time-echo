import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError, InsufficientBalanceError } from '@/lib/errors';
import { validateInkTransaction } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, amount, reason } = req.body;

    // 输入验证
    validateInkTransaction({ userId, amount, reason });

    // 原子事务：防止双花
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      const newBalance = user.ink_balance + amount;

      if (newBalance < 0) {
        throw new InsufficientBalanceError();
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          ink_balance: newBalance,
          // 只有扣除（amount < 0）时才增加消耗统计
          total_ink_consumed: {
            increment: amount < 0 ? Math.abs(amount) : 0,
          },
        },
      });

      const log = await tx.inkLog.create({
        data: {
          userId,
          amount,
          reason,
          balance_after: newBalance,
        },
      });

      return { user: updatedUser, log };
    });

    res.status(200).json(result);
  } catch (error) {
    const { status, body } = handleApiError(error);
    res.status(status).json(body);
  }
}
