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

  if (username.length < 3) {
    return res.status(400).json({ error: '用户名至少需要 3 个字符' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少需要 6 个字符' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const now = new Date();
    const activeDeadline = new Date(now.getTime() + 190 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        real_name: username,
        ink_balance: 50,
        active_deadline: activeDeadline,
        protection_end: activeDeadline,
        destruction_date: activeDeadline,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('[REGISTER] Error:', error);
    res.status(500).json({ error: '注册失败' });
  }
}
