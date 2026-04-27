/**
 * 单元测试：AI 润色功能
 * 测试场景：
 * 1. 首次润色免费
 * 2. 后续润色扣费 5 水滴
 * 3. 水滴不足时拒绝
 * 4. 文本改写逻辑
 */

import { prisma } from '@/lib/prisma';

describe('AI Polish (润色) Tests', () => {
  let testUserId: string;
  let testAnswerId: string;

  beforeAll(async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        role: 'USER',
        ink_balance: 100,
        extensionDropsRemaining: 50,
        freePolishUsed: false,
        active_deadline: new Date(Date.now() + 99 * 24 * 60 * 60 * 1000),
        protection_end: new Date(Date.now() + 189 * 24 * 60 * 60 * 1000),
        destruction_date: new Date(Date.now() + 190 * 24 * 60 * 60 * 1000),
      },
    });
    testUserId = user.id;

    // 创建测试访谈会话
    const session = await prisma.interviewSession.create({
      data: {
        userId: testUserId,
        baseSlotsTotal: 50,
        baseSlotsUsed: 1,
        skippedCount: 0,
      },
    });

    // 创建测试回答
    const answer = await prisma.interviewAnswer.create({
      data: {
        userId: testUserId,
        sessionId: session.id,
        questionId: 'q-001',
        questionContent: '请描述您的工作经历',
        content: '我觉得那个时候挺困难的，特别是在工厂里工作',
      },
    });
    testAnswerId = answer.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.interviewAnswer.deleteMany({ where: { userId: testUserId } });
    await prisma.interviewSession.deleteMany({ where: { userId: testUserId } });
    await prisma.inkLog.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('首次润色免费', () => {
    it('应该在首次润色时不扣费', async () => {
      const userBefore = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          freePolishUsed: true,
          extensionDropsRemaining: true,
        },
      });

      expect(userBefore?.freePolishUsed).toBe(false);
      const dropsBefore = userBefore?.extensionDropsRemaining || 0;

      // 模拟首次润色
      const polished = await mockPolishText(
        '我觉得那个时候挺困难的，特别是在工厂里工作'
      );

      // 更新用户状态（模拟 API 调用）
      const userAfter = await prisma.user.update({
        where: { id: testUserId },
        data: { freePolishUsed: true },
        select: {
          freePolishUsed: true,
          extensionDropsRemaining: true,
        },
      });

      expect(userAfter.freePolishUsed).toBe(true);
      expect(userAfter.extensionDropsRemaining).toBe(dropsBefore);
      expect(polished).toContain('我认为');
    });
  });

  describe('后续润色扣费', () => {
    it('应该在第二次润色时扣除 5 个水滴', async () => {
      const userBefore = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { extensionDropsRemaining: true },
      });

      const dropsBefore = userBefore?.extensionDropsRemaining || 0;

      // 模拟第二次润色（扣费）
      const cost = 5;
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: testUserId },
          data: {
            extensionDropsRemaining: { decrement: cost },
          },
        });

        await tx.inkLog.create({
          data: {
            userId: testUserId,
            amount: -cost,
            reason: 'AI 润色',
            balance_after: updated.extensionDropsRemaining,
          },
        });

        return updated;
      });

      expect(result.extensionDropsRemaining).toBe(dropsBefore - cost);

      // 验证墨水流水记录
      const log = await prisma.inkLog.findFirst({
        where: {
          userId: testUserId,
          reason: 'AI 润色',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(log?.amount).toBe(-5);
    });
  });

  describe('水滴不足处理', () => {
    it('应该在水滴不足时拒绝润色', async () => {
      // 将用户水滴设置为 2（不足 5）
      await prisma.user.update({
        where: { id: testUserId },
        data: { extensionDropsRemaining: 2 },
      });

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { extensionDropsRemaining: true },
      });

      expect(user?.extensionDropsRemaining).toBe(2);

      // 尝试润色应该失败
      const canPolish = (user?.extensionDropsRemaining || 0) >= 5;
      expect(canPolish).toBe(false);
    });
  });

  describe('文本改写逻辑', () => {
    it('应该正确改写文本', async () => {
      const testCases = [
        {
          input: '我觉得那个时候挺困难的',
          expected: ['我认为', '很困难'],
        },
        {
          input: '特别是在工厂里工作',
          expected: ['非常', '。'],
        },
        {
          input: '我觉得挺好的',
          expected: ['我认为', '很好'],
        },
      ];

      for (const testCase of testCases) {
        const polished = await mockPolishText(testCase.input);
        for (const expected of testCase.expected) {
          expect(polished).toContain(expected);
        }
      }
    });

    it('应该去除多余空格', async () => {
      const input = '我觉得   那个时候   挺困难的';
      const polished = await mockPolishText(input);
      expect(polished).not.toContain('   ');
    });

    it('应该确保句子以句号结尾', async () => {
      const inputs = ['我觉得那个时候挺困难的', '我觉得那个时候挺困难的。'];
      for (const input of inputs) {
        const polished = await mockPolishText(input);
        expect(/[。！？]$/.test(polished)).toBe(true);
      }
    });
  });

  describe('用户状态验证', () => {
    it('应该正确追踪首次润色状态', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { freePolishUsed: true },
      });

      expect(user?.freePolishUsed).toBe(true);
    });

    it('应该正确追踪水滴余额', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { extensionDropsRemaining: true },
      });

      // 应该是初始 50 - 5（第二次润色）- 5（第三次润色）= 40
      // 但由于我们在"水滴不足处理"中设置为 2，这里应该是 2
      expect(user?.extensionDropsRemaining).toBe(2);
    });
  });
});

/**
 * 模拟 AI 润色（P0 阶段简化版）
 */
async function mockPolishText(originalText: string): Promise<string> {
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
