import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateLifecycleTimestamps } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { validateUserInput } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { real_name, birth_year, gender, birth_place, age } = req.body;

    // 输入验证
    validateUserInput({ real_name, birth_year, gender, birth_place });

    // 年龄验证
    let parsedAge: number | null = null;
    if (age !== undefined && age !== null) {
      parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        return res.status(400).json({ error: '年龄必须在 1-120 之间' });
      }
    }

    const timestamps = generateLifecycleTimestamps();

    const user = await prisma.user.create({
      data: {
        real_name,
        birth_year: birth_year ? parseInt(birth_year) : null,
        gender,
        birth_place,
        age: parsedAge,
        ink_balance: 50,
        ...timestamps,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    const { status, body } = handleApiError(error);
    res.status(status).json(body);
  }
}
