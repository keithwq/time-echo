import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/polish
 * AI 润色（首次免费，后续 5 水滴）
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId, answerId, originalText } = req.body;

  if (!userId || !answerId || !originalText) {
    return res.status(400).json({
      success: false,
      error: 'userId, answerId, and originalText are required',
    });
  }

  try {
    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        freePolishUsed: true,
        extensionDropsRemaining: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 判断是否免费
    const isFree = !user.freePolishUsed;
    const cost = isFree ? 0 : 5;

    // 检查水滴余额（如果需要扣费）
    if (!isFree && user.extensionDropsRemaining < cost) {
      return res.status(400).json({
        success: false,
        error: '扩展操作水滴不足，需要 5 个水滴',
      });
    }

    // 调用 AI 润色（P0 阶段：简化版，直接返回原文）
    // TODO: 集成真实 AI 润色服务
    const polishedText = await mockPolishText(originalText);

    // 原子事务：扣费 + 更新用户状态
    const result = await prisma.$transaction(async (tx) => {
      let updatedUser = user;

      if (isFree) {
        // 首次免费，标记已使用
        updatedUser = await tx.user.update({
          where: { id: userId },
          data: { freePolishUsed: true },
        });
      } else {
        // 扣除 5 个扩展水滴
        updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            extensionDropsRemaining: { decrement: cost },
          },
        });

        // 记录墨水流水
        await tx.inkLog.create({
          data: {
            userId,
            amount: -cost,
            reason: 'AI 润色',
            balance_after: updatedUser.extensionDropsRemaining,
          },
        });
      }

      return { user: updatedUser };
    });

    return res.status(200).json({
      success: true,
      data: {
        original_text: originalText,
        polished_text: polishedText,
        is_free: isFree,
        cost,
        remaining_drops: result.user.extensionDropsRemaining,
        message: isFree ? '首次润色免费' : `已消耗 ${cost} 个水滴`,
      },
    });
  } catch (error) {
    console.error('Polish text error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * 模拟 AI 润色（P0 阶段简化版）
 * TODO: 集成真实 AI 服务（Claude/GPT）
 */
async function mockPolishText(
  originalText: string
): Promise<string> {
  // P0 阶段：简单的文本整理
  // 1. 去除多余空格
  let polished = originalText.trim().replace(/\s+/g, ' ');

  // 2. 确保句子以句号结尾
  if (!/[。！？]$/.test(polished)) {
    polished += '。';
  }

  // 3. 添加简单的书面化提升
  polished = polished
    .replace(/我觉得/g, '我认为')
    .replace(/挺/g, '很')
    .replace(/特别/g, '非常');

  return polished;
}
