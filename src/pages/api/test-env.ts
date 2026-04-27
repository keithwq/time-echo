import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(200).json({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `已设置 (长度: ${process.env.OPENAI_API_KEY.length})` : '未设置',
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || '未设置',
    OPENAI_MODEL: process.env.OPENAI_MODEL || '未设置',
    DATABASE_URL: process.env.DATABASE_URL ? '已设置' : '未设置',
  });
}
