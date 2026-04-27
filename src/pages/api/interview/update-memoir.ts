import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateMemoirWithUnused } from '@/lib/memoirGenerator';
import { generateMemoirContent } from '@/lib/aiUtils';
import { getQuestionById } from '@/data/question-templates';

interface UpdateMemoirResponse {
  success: boolean;
  data?: {
    memoir: {
      title: string;
      sections: Array<{
        stage: string;
        title: string;
        content: string;
      }>;
      wordCount: number;
      generatedAt: string;
    };
    markdown: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateMemoirResponse>
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
    // 获取会话和所有回答
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          select: {
            id: true,
            questionId: true,
            content: true,
            topicTag: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { real_name: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 转换回答格式，添加问题内容和元数据
    const answers = session.answers.map((answer) => {
      const question = getQuestionById(answer.questionId);
      return {
        id: answer.id,
        questionContent: question?.content || '',
        content: answer.content,
        topicTag: answer.topicTag,
        stageTag: question?.stageTag,
        narrativeRole: question?.narrativeRole,
        createdAt: answer.createdAt,
      };
    });

    // 第一步：生成初稿回忆录
    const { memoir, markdown } = generateMemoirWithUnused(answers, user.real_name || '您');

    // 第二步：调用 AI 改写回忆录
    let improvedMarkdown = markdown;
    try {
      const improvedContent = await generateMemoirContent(memoir, user.real_name || '您');
      improvedMarkdown = `# ${memoir.title}\n\n> 生成时间：${new Date(memoir.generatedAt).toLocaleString('zh-CN')} | 字数：${improvedContent.length}\n\n---\n\n${improvedContent}`;
    } catch (aiError) {
      console.warn('AI improvement failed, using original memoir:', aiError);
      // 如果 AI 改写失败，使用原始回忆录
    }

    return res.status(200).json({
      success: true,
      data: {
        memoir,
        markdown: improvedMarkdown,
      },
    });
  } catch (error) {
    console.error('Update memoir error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
