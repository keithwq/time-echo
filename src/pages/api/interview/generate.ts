import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateMemoirWithUnused } from '@/lib/memoirGenerator';
import { generateMemoirContent } from '@/lib/aiUtils';
import { getQuestionById } from '@/data/question-templates';

/**
 * POST /api/interview/generate
 * 生成回忆录初稿
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId, sessionId } = req.body;

  if (!userId || !sessionId) {
    return res.status(400).json({
      success: false,
      error: 'userId and sessionId are required',
    });
  }

  try {
    // 查询用户
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { real_name: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 查询会话
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          select: {
            id: true,
            questionId: true,
            questionContent: true,
            content: true,
            topicTag: true,
            nestedAnswers: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // 检查是否有回答
    if (session.answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: '暂无回答内容，无法生成回忆录',
      });
    }

    // 生成回忆录及未入稿素材
    // 排除被跳过的题目
    const skippedIds = new Set(session.skippedQuestionIds || []);
    const answersWithMetadata = session.answers
      .filter((answer) => !skippedIds.has(answer.questionId))
      .map((answer) => {
        const question = getQuestionById(answer.questionId);
        return {
          ...answer,
          stageTag: question?.stageTag,
          narrativeRole: question?.narrativeRole || 'representative_event',
        };
      });

    const { memoir, unusedAnswers } = generateMemoirWithUnused(
      answersWithMetadata as any,
      user.real_name || '您'
    );

    // 调用 AI 改写成真正的人生小传（必须成功，不允许降级）
    console.log('[Generate] 开始调用 AI 改写回忆录');
    console.log('[Generate] 回忆录标题:', memoir.title);
    console.log('[Generate] 回忆录字数:', memoir.wordCount);
    console.log('[Generate] 用户姓名:', user.real_name || '您');

    const aiGeneratedContent = await generateMemoirContent(memoir, user.real_name || '您');

    console.log('[Generate] AI 改写成功，内容长度:', aiGeneratedContent.length);
    const finalMarkdown = `# ${memoir.title}\n\n> 生成时间：${new Date(memoir.generatedAt).toLocaleString('zh-CN')} | 字数：${memoir.wordCount}\n\n---\n\n${aiGeneratedContent}`;
    const isPolished = true;

    // 更新会话状态
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        isGenerated: true,
        isCompleted: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        memoir,
        markdown: finalMarkdown,
        isPolished,
        unusedAnswers,
      },
    });
  } catch (error) {
    console.error('[Generate] 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
