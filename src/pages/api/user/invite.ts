import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, error: 'userId is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const inviteCode = userId.substring(0, 8).toUpperCase();
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/register?invite=${inviteCode}`;

    const invitedUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const bonusDrops = Math.min(invitedUsers * 10, 500);

    return res.status(200).json({
      success: true,
      inviteCode,
      inviteUrl,
      successCount: invitedUsers,
      bonusDrops
    });
  } catch (error) {
    console.error('Get invite info error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
