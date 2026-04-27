import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { validateUUID, validateUserInput } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, real_name, birth_year, gender, birth_place, emergency_email } = req.body;

    if (!userId || typeof userId !== 'string') {
      throw new NotFoundError('用户 ID 无效');
    }

    validateUUID(userId, '用户 ID');

    // 复用现有验证逻辑
    validateUserInput({ real_name, birth_year, gender, birth_place });

    // 验证邮箱（可选字段）
    if (emergency_email && emergency_email.trim()) {
      const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
      if (!emailRegex.test(emergency_email.trim())) {
        return res.status(400).json({ error: '邮箱格式无效' });
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(real_name !== undefined && { real_name }),
        ...(birth_year !== undefined && { birth_year }),
        ...(gender !== undefined && { gender }),
        ...(birth_place !== undefined && { birth_place }),
        ...(emergency_email !== undefined && { emergency_email: emergency_email.trim() || null }),
        last_active_at: new Date(),
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    const { status, body } = handleApiError(error);
    res.status(status).json(body);
  }
}
