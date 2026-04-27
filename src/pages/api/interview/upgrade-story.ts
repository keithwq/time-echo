import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

interface RequestBody {
  userId: string;
  sessionId: string;
  memoirMarkdown: string;
}

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
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '方法不允许' });
  }

  try {
    const { userId, sessionId, memoirMarkdown } = req.body as RequestBody;

    if (!userId || !sessionId || !memoirMarkdown) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    // 获取会话和所有回答
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session || session.userId !== userId) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    // 构建生成人生故事的上下文
    const answersSummary = session.answers
      .map((ans) => `Q: ${ans.questionContent}\nA: ${ans.content}`)
      .join('\n\n');

    // 调用 Claude API 生成人生故事（3000-5000 字）
    const response = await fetch('https://api.anthropic.com/v1/messages/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 2000,
        system: `你是一位资深的传记作家。你的任务是根据用户的人生小传和详细回答，生成一篇更完整的人生故事。

要求：
1. 字数：3000-5000 字
2. 在人生小传的基础上，对重要阶段进行展开和深挖
3. 保留原有的主题结构，但每个主题下增加更多细节和故事
4. 优先复用已有素材，不编造新的经历
5. 对关键人物、地点、事件进行更深入的描写
6. 保持温暖、尊重的语气
7. 使用 Markdown 格式，包含二级标题

输出格式：
# 您的人生故事

## 成长与童年
[展开内容]

## 求学与初入社会
[展开内容]

## 工作与本事
[展开内容]

## 婚姻与家庭
[展开内容]

## 所处时代的日常
[展开内容]

## 人生中的重要人和地方
[展开内容]

## 留给后人的话
[展开内容]`,
        messages: [
          {
            role: 'user',
            content: `请根据以下人生小传和详细回答，生成一篇更完整的人生故事。

【原始人生小传】
${memoirMarkdown}

【详细回答记录】
${answersSummary}

请生成 3000-5000 字的人生故事，在原有基础上进行展开和深挖。`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Claude API error:', error);
      return res.status(500).json({ success: false, error: '生成失败' });
    }

    const result = await response.json();
    const storyMarkdown = result.content[0].text;
    const wordCount = storyMarkdown.length;
    const generatedAt = new Date().toISOString();

    // 保存人生故事到数据库
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        storyMarkdown: storyMarkdown,
        storyGeneratedAt: new Date(),
        memoirVersion: 2, // 标记为第二版本（人生故事）
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        storyMarkdown,
        wordCount,
        generatedAt,
      },
    });
  } catch (error) {
    console.error('Error in upgrade-story:', error);
    return res.status(500).json({ success: false, error: '服务器错误' });
  }
}
