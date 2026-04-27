import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { validateUUID } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'PATCH') {
    return handlePatch(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      throw new NotFoundError('用户 ID 无效');
    }

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

async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    const { real_name, age, gender } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const updateData: Record<string, any> = {};
    if (real_name) updateData.real_name = real_name;
    if (age) updateData.age = parseInt(age, 10);
    if (gender) updateData.gender = gender;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[UPDATE USER] Error:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
}
