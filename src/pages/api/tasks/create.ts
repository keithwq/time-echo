import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError, InsufficientBalanceError } from '@/lib/errors';
import { validateTaskCreation } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clientId, locked_ink, requirement_desc } = req.body;

    // 输入验证（包含敏感词检查）
    validateTaskCreation({ clientId, locked_ink, requirement_desc });

    // 原子事务：扣除墨水并创建任务
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: clientId },
      });

      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      if (user.ink_balance < locked_ink) {
        throw new InsufficientBalanceError();
      }

      // 扣除墨水
      await tx.user.update({
        where: { id: clientId },
        data: {
          ink_balance: {
            decrement: locked_ink,
          },
          total_ink_consumed: {
            increment: locked_ink,
          },
        },
      });

      // 创建任务
      const task = await tx.mutualAidTask.create({
        data: {
          clientId,
          locked_ink,
          requirement_desc,
        },
      });

      return task;
    });

    res.status(201).json(result);
  } catch (error) {
    const { status, body } = handleApiError(error);
    res.status(status).json(body);
  }
}
