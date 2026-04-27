import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { suggestImprovements } from '@/lib/aiUtils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId, sessionId, memoirContent } = req.body;

  if (!userId || !sessionId || !memoirContent) {
    return res.status(400).json({
      success: false,
      error: 'userId, sessionId, and memoirContent are required',
    });
  }

  try {
    // 查询会话
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // 检查是否已达到最大提示次数
    if (session.aiSuggestionsUsed >= session.maxAiSuggestions) {
      return res.status(400).json({
        success: false,
        error: `已达到最大提示次数 (${session.maxAiSuggestions} 次)`,
      });
    }

    // 调用 AI 生成修改建议
    const suggestions = await suggestImprovements(memoirContent);

    // 更新会话的提示使用次数
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        aiSuggestionsUsed: session.aiSuggestionsUsed + 1,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        suggestions,
        suggestionsUsed: session.aiSuggestionsUsed + 1,
        suggestionsRemaining: session.maxAiSuggestions - (session.aiSuggestionsUsed + 1),
      },
    });
  } catch (error) {
    console.error('Suggest improvements error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
