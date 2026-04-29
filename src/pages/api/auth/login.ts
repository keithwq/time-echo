import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    if (user.passwordHash !== passwordHash) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const lastSession = await prisma.interviewSession.findFirst({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        baseSlotsUsed: true,
        updatedAt: true,
      },
    });

    let sessionId = lastSession?.id || '';
    let progress = '';
    let lastActivityTime = '';

    if (lastSession) {
      sessionId = lastSession.id;
      const baseSlotsUsed = lastSession.baseSlotsUsed || 0;
      progress = `已完成 ${baseSlotsUsed} 题`;

      if (lastSession.updatedAt) {
        const date = new Date(lastSession.updatedAt);
        lastActivityTime = date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        sessionId,
        progress,
        lastActivityTime,
      },
    });
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    res.status(500).json({ error: '登录失败' });
  }
}
