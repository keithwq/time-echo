import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { real_name, age, gender } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const updateData: Record<string, any> = {};
    if (real_name) updateData.real_name = real_name;
    if (age) updateData.age = parseInt(age, 10);
    if (gender) updateData.gender = gender;

    const user = await prisma.user.update({
      where: { id },
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
