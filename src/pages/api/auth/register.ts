import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { username, password, real_name, age } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: '用户名和密码不能为空'
    });
  }

  if (username.length < 3) {
    return res.status(400).json({
      success: false,
      error: '用户名至少3位'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: '密码至少6位'
    });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: '用户名已被使用'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        real_name: real_name || null,
        age: age ? parseInt(age) : null,
        ink_balance: 50,
        role: 'USER',
        active_deadline: new Date(Date.now() + 190 * 24 * 60 * 60 * 1000),
        protection_end: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        destruction_date: new Date(Date.now() + 190 * 24 * 60 * 60 * 1000)
      }
    });

    return res.status(201).json({
      success: true,
      userId: user.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
