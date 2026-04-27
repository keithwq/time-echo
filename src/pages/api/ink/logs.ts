import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { handleApiError, ValidationError } from '@/lib/errors';
import { validateUUID } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, limit = 20, offset = 0 } = req.query;

    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('用户 ID 无效');
    }

    // 验证 UUID 格式
    validateUUID(userId, '用户 ID');

    // 验证分页参数
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ValidationError('limit 必须在 1-100 之间');
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      throw new ValidationError('offset 必须大于等于 0');
    }

    const logs = await prisma.inkLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limitNum,
      skip: offsetNum,
    });

    const total = await prisma.inkLog.count({
      where: { userId },
    });

    res.status(200).json({ logs, total });
  } catch (error) {
    const { status, body } = handleApiError(error);
    res.status(status).json(body);
  }
}
