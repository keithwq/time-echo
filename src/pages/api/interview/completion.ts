import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { analyzeGaps } from '@/lib/gapAnalyzer';
import { generateMemoirWithUnused } from '@/lib/memoirGenerator';
import { getQuestionById } from '@/data/question-templates';

interface CompletionQuestion {
  id: string;
  type: string;
  question: string;
  hint: string;
  priority: number;
}

interface MemoirResponse {
  title: string;
  wordCount: number;
  sections: Array<{ stage: string; title: string; content: string }>;
}

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
    // 获取会话和回答
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
      return res.status(403).json({ success: false, error: 'Unauthorized' });
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
        questionContent: answer.questionContent,
        content: answer.content,
        topicTag: answer.topicTag,
        stageTag: question?.stageTag,
        narrativeRole: question?.narrativeRole || 'representative_event',
        createdAt: answer.createdAt,
        nestedAnswers: answer.nestedAnswers,
      };
    });

    // 生成回忆录
    const { memoir } = generateMemoirWithUnused(
      answers as any,
      user.real_name || '您'
    );

    // 分析缺口
    const gapAnalysis = analyzeGaps(memoir, answers);

    // 构建补全问题包
    const completionQuestions: CompletionQuestion[] = gapAnalysis.completionQuestions.map(
      (q, index) => ({
        id: `completion_${index}`,
        type: q.type,
        question: q.question,
        hint: q.hint,
        priority: q.priority || 1,
      })
    );

    // 持久化补全包到数据库
    const savedPackage = await prisma.completionPackage.create({
      data: {
        sessionId,
        identifiedGaps: gapAnalysis.gaps,
        gapSummary: gapAnalysis.summary,
        questions: completionQuestions as any,
      },
    });

    // 更新会话关联补全包
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { completionPackageId: savedPackage.id },
    });

    const memoirResponse: MemoirResponse = {
      title: memoir.title,
      wordCount: memoir.wordCount,
      sections: memoir.sections,
    };

    return res.status(200).json({
      success: true,
      data: {
        completionPackage: {
          id: savedPackage.id,
          identifiedGaps: savedPackage.identifiedGaps,
          gapSummary: savedPackage.gapSummary,
          questions: completionQuestions,
        },
        currentMemoir: memoirResponse,
      },
    });
  } catch (error) {
    console.error('Generate completion package error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
