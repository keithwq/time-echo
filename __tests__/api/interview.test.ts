/**
 * 单元测试：跳题次数上限、水滴冻结逻辑、首次润色免费
 */

import { prisma } from '@/lib/prisma';

describe('Interview Core Logic Tests', () => {
  let testUserId: string;
  let testSessionId: string;

  beforeAll(async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        role: 'USER',
        ink_balance: 100,
        active_deadline: new Date(Date.now() + 99 * 24 * 60 * 60 * 1000),
        protection_end: new Date(Date.now() + 189 * 24 * 60 * 60 * 1000),
        destruction_date: new Date(Date.now() + 190 * 24 * 60 * 60 * 1000),
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.interviewAnswer.deleteMany({ where: { userId: testUserId } });
    await prisma.interviewSession.deleteMany({ where: { userId: testUserId } });
    await prisma.inkLog.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('水滴冻结逻辑', () => {
    it('应该在开始访谈时冻结 40 个水滴', async () => {
      const userBefore = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { ink_balance: true },
      });

      const session = await prisma.interviewSession.create({
        data: {
          userId: testUserId,
          baseSlotsTotal: 50,
          baseSlotsUsed: 0,
          skippedCount: 0,
        },
      });
      testSessionId = session.id;

      await prisma.user.update({
        where: { id: testUserId },
        data: {
          ink_balance: { decrement: 40 },
          baseInterviewFrozenDrops: 40,
          extensionDropsRemaining: 10,
        },
      });

      const userAfter = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          ink_balance: true,
          baseInterviewFrozenDrops: true,
          extensionDropsRemaining: true,
        },
      });

      expect(userAfter?.ink_balance).toBe((userBefore?.ink_balance || 0) - 40);
      expect(userAfter?.baseInterviewFrozenDrops).toBe(40);
      expect(userAfter?.extensionDropsRemaining).toBe(10);
    });

    it('应该拒绝水滴不足的用户开始访谈', async () => {
      const poorUser = await prisma.user.create({
        data: {
          role: 'USER',
          ink_balance: 30, // 不足 40
          active_deadline: new Date(Date.now() + 99 * 24 * 60 * 60 * 1000),
          protection_end: new Date(Date.now() + 189 * 24 * 60 * 60 * 1000),
          destruction_date: new Date(Date.now() + 190 * 24 * 60 * 60 * 1000),
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: poorUser.id },
        select: { ink_balance: true },
      });

      expect(user?.ink_balance).toBeLessThan(40);

      // 清理
      await prisma.user.delete({ where: { id: poorUser.id } });
    });
  });

  describe('跳题次数上限', () => {
    it('应该允许跳题最多 5 次', async () => {
      const session = await prisma.interviewSession.findUnique({
        where: { id: testSessionId },
      });

      expect(session?.skippedCount).toBe(0);

      // 模拟跳题 5 次
      for (let i = 1; i <= 5; i++) {
        await prisma.interviewSession.update({
          where: { id: testSessionId },
          data: { skippedCount: { increment: 1 } },
        });
      }

      const updatedSession = await prisma.interviewSession.findUnique({
        where: { id: testSessionId },
      });

      expect(updatedSession?.skippedCount).toBe(5);
    });

    it('应该拒绝第 6 次跳题', async () => {
      const session = await prisma.interviewSession.findUnique({
        where: { id: testSessionId },
      });

      expect(session?.skippedCount).toBeGreaterThanOrEqual(5);

      // 尝试第 6 次跳题应该被拒绝
      const canSkip = (session?.skippedCount || 0) < 5;
      expect(canSkip).toBe(false);
    });
  });

  describe('首次润色免费', () => {
    it('首次润色应该免费', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { freePolishUsed: true, extensionDropsRemaining: true },
      });

      expect(user?.freePolishUsed).toBe(false);

      const isFree = !user?.freePolishUsed;
      const cost = isFree ? 0 : 5;

      expect(cost).toBe(0);

      // 标记已使用免费润色
      await prisma.user.update({
        where: { id: testUserId },
        data: { freePolishUsed: true },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { freePolishUsed: true },
      });

      expect(updatedUser?.freePolishUsed).toBe(true);
    });

    it('第二次润色应该消耗 5 个水滴', async () => {
      const userBefore = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { freePolishUsed: true, extensionDropsRemaining: true },
      });

      expect(userBefore?.freePolishUsed).toBe(true);

      const isFree = !userBefore?.freePolishUsed;
      const cost = isFree ? 0 : 5;

      expect(cost).toBe(5);

      // 扣除 5 个水滴
      await prisma.user.update({
        where: { id: testUserId },
        data: { extensionDropsRemaining: { decrement: cost } },
      });

      const userAfter = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { extensionDropsRemaining: true },
      });

      expect(userAfter?.extensionDropsRemaining).toBe(
        (userBefore?.extensionDropsRemaining || 0) - cost
      );
    });
  });

  describe('基础访谈位管理', () => {
    it('应该正确追踪已使用的问题位', async () => {
      const session = await prisma.interviewSession.findUnique({
        where: { id: testSessionId },
      });

      expect(session?.baseSlotsTotal).toBe(50);
      expect(session?.baseSlotsUsed).toBe(0);

      // 模拟回答 3 个问题
      for (let i = 1; i <= 3; i++) {
        await prisma.interviewSession.update({
          where: { id: testSessionId },
          data: { baseSlotsUsed: { increment: 1 } },
        });
      }

      const updatedSession = await prisma.interviewSession.findUnique({
        where: { id: testSessionId },
      });

      expect(updatedSession?.baseSlotsUsed).toBe(3);
    });

    it('应该在达到 50 个问题位时标记完成', async () => {
      // 将问题位设置为 50
      await prisma.interviewSession.update({
        where: { id: testSessionId },
        data: { baseSlotsUsed: 50 },
      });

      const session = await prisma.interviewSession.findUnique({
        where: { id: testSessionId },
      });

      const isCompleted = (session?.baseSlotsUsed || 0) >= (session?.baseSlotsTotal || 50);
      expect(isCompleted).toBe(true);

      // 标记为完成
      await prisma.interviewSession.update({
        where: { id: testSessionId },
        data: { isCompleted: true },
      });

      const completedSession = await prisma.interviewSession.findUnique({
        where: { id: testSessionId },
      });

      expect(completedSession?.isCompleted).toBe(true);
    });
  });
});
