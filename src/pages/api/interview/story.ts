import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

interface SuccessResponse {
  success: true;
  data: {
    storyMarkdown: string;
    wordCount: number;
    generatedAt: string;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
}

type ResponseData = SuccessResponse | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: '方法不允许' });
  }

  try {
    const { sessionId, userId } = req.query;

    if (!sessionId || !userId) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    // 获取会话
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId as string },
    });

    if (!session || session.userId !== userId) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }

    if (!session.storyMarkdown || !session.storyGeneratedAt) {
      return res.status(404).json({ success: false, error: '人生故事不存在' });
    }

    return res.status(200).json({
      success: true,
      data: {
        storyMarkdown: session.storyMarkdown,
        wordCount: session.storyMarkdown.length,
        generatedAt: session.storyGeneratedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in story:', error);
    return res.status(500).json({ success: false, error: '服务器错误' });
  }
}

