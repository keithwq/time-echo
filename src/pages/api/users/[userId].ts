import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { validateUUID } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      throw new NotFoundError('用户 ID 无效');
    }

    // 验证 UUID 格式
    validateUUID(userId, '用户 ID');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        inkLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    res.status(200).json(user);
  } catch (error) {
    const { status, body } = handleApiError(error);
    res.status(status).json(body);
  }
}
