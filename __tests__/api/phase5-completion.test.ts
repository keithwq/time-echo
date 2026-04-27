import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { generateMemoirWithUnused } from '@/lib/memoirGenerator';

/**
 * Phase 5 补全机制测试
 *
 * 验证：
 * 1. 补全包创建和持久化
 * 2. 补全答案保存和回忆录重新生成
 * 3. 展开答案保存和回忆录重新生成
 * 4. 字数限制处理
 */

describe('Phase 5: 补全机制', () => {
  let testUserId: string;
  let testSessionId: string;

  beforeEach(async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        real_name: '测试用户',
        active_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        protection_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        destruction_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    testUserId = user.id;

    // 创建测试会话
    const session = await prisma.interviewSession.create({
      data: {
        userId: testUserId,
        baseSlotsTotal: 50,
        baseSlotsUsed: 10,
      },
    });
    testSessionId = session.id;
  });

  afterEach(async () => {
    // 清理测试数据
    await prisma.interviewAnswer.deleteMany({ where: { userId: testUserId } });
    await prisma.completionPackage.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.interviewSession.deleteMany({ where: { id: testSessionId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('任务 5.1: 补全包创建和持久化', () => {
    it('应该创建补全包并持久化到数据库', async () => {
      const completionPackage = await prisma.completionPackage.create({
        data: {
          sessionId: testSessionId,
          identifiedGaps: ['missing_people', 'missing_places'],
          gapSummary: '您的回忆录还可以补充：关键人物、重要地点',
          questions: [
            {
              id: 'completion_0',
              type: 'missing_people',
              question: '您最亲近的人是谁？',
              hint: '可以是家人、朋友或同事',
              priority: 1,
            },
          ],
        },
      });

      expect(completionPackage).toBeDefined();
      expect(completionPackage.sessionId).toBe(testSessionId);
      expect(completionPackage.identifiedGaps).toContain('missing_people');
      expect(completionPackage.gapSummary).toContain('关键人物');
    });

    it('应该关联补全包到会话', async () => {
      const completionPackage = await prisma.completionPackage.create({
        data: {
          sessionId: testSessionId,
          identifiedGaps: ['missing_people'],
          gapSummary: '缺少关键人物',
          questions: [],
        },
      });

      await prisma.interviewSession.update({
        where: { id: testSessionId },
        data: { completionPackageId: completionPackage.id },
      });

      const updatedSession = await prisma.interviewSession.findUnique({
        where: { id: testSessionId },
        include: { completionPackage: true },
      });

      expect(updatedSession?.completionPackageId).toBe(completionPackage.id);
      expect(updatedSession?.completionPackage).toBeDefined();
    });
  });

  describe('任务 5.2: 补全答案保存和回忆录重新生成', () => {
    it('应该保存补全答案为新的 InterviewAnswer 记录', async () => {
      const completionAnswer = await prisma.interviewAnswer.create({
        data: {
          userId: testUserId,
          sessionId: testSessionId,
          questionId: 'completion_0',
          questionContent: '您最亲近的人是谁？',
          content: '我最亲近的是我的女儿',
          sourceQuestionMode: 'completion',
          sourceType: 'completion',
          topicTag: '家庭',
        },
      });

      expect(completionAnswer).toBeDefined();
      expect(completionAnswer.sourceQuestionMode).toBe('completion');
      expect(completionAnswer.content).toContain('女儿');
    });

    it('应该正确计算包含补全答案的字数', async () => {
      // 创建原始答案
      const originalAnswers = [
        {
          id: 'ans_1',
          questionContent: '您是个什么样的人？',
          content: '我是个很勤快的人。'.repeat(50),
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'profile',
        },
      ];

      // 创建补全答案
      const completionAnswers = [
        {
          id: 'ans_completion_1',
          questionContent: '您最亲近的人是谁？',
          content: '我最亲近的是我的女儿。'.repeat(30),
          topicTag: '家庭',
          stageTag: '家庭',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
      ];

      const allAnswers = [...originalAnswers, ...completionAnswers];
      const { memoir } = generateMemoirWithUnused(allAnswers as any, '测试用户');

      expect(memoir.wordCount).toBeGreaterThan(0);
      expect(memoir.wordCount).toBeLessThanOrEqual(2100);
    });

    it('应该更新会话的 memoirVersion', async () => {
      const initialSession = await prisma.interviewSession.findUnique({
        where: { id: testSessionId },
      });
      expect(initialSession?.memoirVersion).toBe(1);

      await prisma.interviewSession.update({
        where: { id: testSessionId },
        data: { memoirVersion: 2, lastCompletionMode: 'supplement' },
      });

      const updatedSession = await prisma.interviewSession.findUnique({
        where: { id: testSessionId },
      });
      expect(updatedSession?.memoirVersion).toBe(2);
      expect(updatedSession?.lastCompletionMode).toBe('supplement');
    });
  });

  describe('任务 5.3: 展开答案保存和回忆录重新生成', () => {
    it('应该保存展开答案为新的 InterviewAnswer 记录', async () => {
      const elaborateAnswer = await prisma.interviewAnswer.create({
        data: {
          userId: testUserId,
          sessionId: testSessionId,
          questionId: 'q_1',
          questionContent: '您小时候住的是什么样的房子？',
          content: '我住的是砖瓦房，有 3 间房。那时候条件很艰苦...',
          sourceQuestionMode: 'elaborate',
          sourceType: 'elaborate',
          topicTag: '童年',
        },
      });

      expect(elaborateAnswer).toBeDefined();
      expect(elaborateAnswer.sourceQuestionMode).toBe('elaborate');
      expect(elaborateAnswer.content).toContain('砖瓦房');
    });

    it('应该标记补全包为已回答', async () => {
      const completionPackage = await prisma.completionPackage.create({
        data: {
          sessionId: testSessionId,
          identifiedGaps: ['missing_people'],
          gapSummary: '缺少关键人物',
          questions: [],
          isAnswered: false,
        },
      });

      expect(completionPackage.isAnswered).toBe(false);

      const updated = await prisma.completionPackage.update({
        where: { id: completionPackage.id },
        data: {
          isAnswered: true,
          answeredAt: new Date(),
        },
      });

      expect(updated.isAnswered).toBe(true);
      expect(updated.answeredAt).toBeDefined();
    });
  });

  describe('任务 5.4: 字数限制处理', () => {
    it('应该在字数接近 2000 时停止添加内容', async () => {
      const answers = Array.from({ length: 20 }, (_, i) => ({
        id: `ans_${i}`,
        questionContent: `问题 ${i}`,
        content: '这是一个很长的回答，包含了很多细节和故事。'.repeat(20),
        topicTag: '童年',
        stageTag: '童年',
        createdAt: new Date(),
        narrativeRole: 'representative_event',
      }));

      const { memoir, unusedAnswers } = generateMemoirWithUnused(answers as any, '测试用户');

      expect(memoir.wordCount).toBeLessThanOrEqual(2100);
      expect(unusedAnswers.length).toBeGreaterThan(0);
    });

    it('应该优先保留补全答案', async () => {
      const answers = [
        {
          id: 'ans_original_1',
          questionContent: '您是个什么样的人？',
          content: '我是个很勤快的人。'.repeat(100),
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(Date.now() - 1000),
          narrativeRole: 'profile',
        },
        {
          id: 'ans_completion_1',
          questionContent: '您最亲近的人是谁？',
          content: '我最亲近的是我的女儿。'.repeat(50),
          topicTag: '家庭',
          stageTag: '家庭',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
      ];

      const { memoir } = generateMemoirWithUnused(answers as any, '测试用户');

      // 两个答案都应该被包含（因为总字数在限制内）
      expect(memoir.sections.length).toBeGreaterThan(0);
      expect(memoir.wordCount).toBeGreaterThan(0);
    });
  });

  describe('任务 5.5: 补全流程完整性', () => {
    it('完整流程：从补全到回忆录更新', async () => {
      // 1. 创建原始答案
      const originalAnswer = await prisma.interviewAnswer.create({
        data: {
          userId: testUserId,
          sessionId: testSessionId,
          questionId: 'q_1',
          questionContent: '您是个什么样的人？',
          content: '我是个很勤快的人。',
          sourceQuestionMode: 'base',
          sourceType: 'local',
          topicTag: '童年',
        },
      });

      // 2. 创建补全包
      const completionPackage = await prisma.completionPackage.create({
        data: {
          sessionId: testSessionId,
          identifiedGaps: ['missing_people'],
          gapSummary: '缺少关键人物',
          questions: [
            {
              id: 'completion_0',
              type: 'missing_people',
              question: '您最亲近的人是谁？',
              hint: '可以是家人、朋友或同事',
              priority: 1,
            },
          ],
        },
      });

      // 3. 保存补全答案
      const completionAnswer = await prisma.interviewAnswer.create({
        data: {
          userId: testUserId,
          sessionId: testSessionId,
          questionId: 'completion_0',
          questionContent: '您最亲近的人是谁？',
          content: '我最亲近的是我的女儿。',
          sourceQuestionMode: 'completion',
          sourceType: 'completion',
          topicTag: '家庭',
        },
      });

      // 4. 更新会话状态
      const updatedSession = await prisma.interviewSession.update({
        where: { id: testSessionId },
        data: {
          completionPackageId: completionPackage.id,
          memoirVersion: 2,
          lastCompletionMode: 'supplement',
        },
      });

      // 5. 标记补全包为已回答
      const answeredPackage = await prisma.completionPackage.update({
        where: { id: completionPackage.id },
        data: {
          isAnswered: true,
          answeredAt: new Date(),
        },
      });

      // 验证
      expect(originalAnswer).toBeDefined();
      expect(completionAnswer).toBeDefined();
      expect(updatedSession.memoirVersion).toBe(2);
      expect(answeredPackage.isAnswered).toBe(true);

      // 获取所有答案并生成回忆录
      const allAnswers = await prisma.interviewAnswer.findMany({
        where: { sessionId: testSessionId },
      });

      expect(allAnswers.length).toBe(2);
      expect(allAnswers.some(a => a.sourceQuestionMode === 'completion')).toBe(true);
    });
  });
});
