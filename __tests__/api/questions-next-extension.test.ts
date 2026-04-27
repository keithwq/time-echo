import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { questionTemplates } from '@/data/question-templates';

describe('Extension Question Selection (Phase 3 P1)', () => {
  let testUserId: string;
  let testSessionId: string;

  beforeAll(async () => {
    // 创建测试用户
    const now = new Date();
    const user = await prisma.user.create({
      data: {
        real_name: 'Test User',
        ink_balance: 100,
        active_deadline: new Date(now.getTime() + 99 * 24 * 60 * 60 * 1000), // 99 天后
        protection_end: new Date(now.getTime() + 189 * 24 * 60 * 60 * 1000), // 189 天后
        destruction_date: new Date(now.getTime() + 190 * 24 * 60 * 60 * 1000), // 190 天后
      },
    });
    testUserId = user.id;

    // 创建测试访谈会话
    const session = await prisma.interviewSession.create({
      data: {
        userId: testUserId,
        baseSlotsTotal: 50,
        baseSlotsUsed: 0,
        skippedCount: 0,
        isInExpansionMode: true,
      },
    });
    testSessionId = session.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.interviewAnswer.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.interviewSession.deleteMany({ where: { id: testSessionId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should have extension questions in the question bank', () => {
    const extensionQuestions = questionTemplates.filter((q) => q.phase === 'extension');
    expect(extensionQuestions.length).toBeGreaterThan(0);
  });

  it('should have adaptable field on extension questions', () => {
    const extensionQuestions = questionTemplates.filter((q) => q.phase === 'extension');
    const adaptableQuestions = extensionQuestions.filter((q) => q.adaptable !== undefined);
    expect(adaptableQuestions.length).toBeGreaterThan(0);
  });

  it('should have detailTags on extension questions', () => {
    const extensionQuestions = questionTemplates.filter((q) => q.phase === 'extension');
    const questionsWithTags = extensionQuestions.filter((q) => q.detailTags && q.detailTags.length > 0);
    expect(questionsWithTags.length).toBeGreaterThan(0);
  });

  it('should have stage tags on all questions', () => {
    const allQuestions = questionTemplates;
    const questionsWithStage = allQuestions.filter((q) => q.stageTag);
    expect(questionsWithStage.length).toBe(allQuestions.length);
  });

  it('should have narrative roles on all questions', () => {
    const allQuestions = questionTemplates;
    const questionsWithRole = allQuestions.filter((q) => q.narrativeRole);
    expect(questionsWithRole.length).toBe(allQuestions.length);
  });

  it('should have material types on all questions', () => {
    const allQuestions = questionTemplates;
    const questionsWithMaterial = allQuestions.filter((q) => q.materialType);
    expect(questionsWithMaterial.length).toBe(allQuestions.length);
  });

  it('should have draft importance on all questions', () => {
    const allQuestions = questionTemplates;
    const questionsWithImportance = allQuestions.filter((q) => q.draftImportance);
    expect(questionsWithImportance.length).toBe(allQuestions.length);
  });

  it('should have phase annotation on all questions', () => {
    const allQuestions = questionTemplates;
    const questionsWithPhase = allQuestions.filter((q) => q.phase);
    // 根据 QUESTION_BANK_HANDOFF.md，当前题库有 440 题（不是 500 题）
    expect(questionsWithPhase.length).toBe(440);
  });

  it('should have base, extension, and closure phases', () => {
    const phases = new Set(questionTemplates.map((q) => q.phase));
    expect(phases.has('base')).toBe(true);
    expect(phases.has('extension')).toBe(true);
    expect(phases.has('closure')).toBe(true);
  });

  it('should have correct distribution of phases', () => {
    const baseQuestions = questionTemplates.filter((q) => q.phase === 'base');
    const extensionQuestions = questionTemplates.filter((q) => q.phase === 'extension');
    const closureQuestions = questionTemplates.filter((q) => q.phase === 'closure');

    // 根据 QUESTION_BANK_HANDOFF.md，应该有大约 161 base, 276 extension, 3 closure
    expect(baseQuestions.length).toBeGreaterThan(150);
    expect(extensionQuestions.length).toBeGreaterThan(250);
    expect(closureQuestions.length).toBeGreaterThan(0);
  });

  it('should have adaptable field only on extension questions', () => {
    const baseQuestions = questionTemplates.filter((q) => q.phase === 'base');
    const baseWithAdaptable = baseQuestions.filter((q) => q.adaptable !== undefined);
    expect(baseWithAdaptable.length).toBe(0);

    const extensionQuestions = questionTemplates.filter((q) => q.phase === 'extension');
    const extensionWithAdaptable = extensionQuestions.filter((q) => q.adaptable !== undefined);
    expect(extensionWithAdaptable.length).toBeGreaterThan(0);
  });

  it('should have high percentage of adaptable extension questions', () => {
    const extensionQuestions = questionTemplates.filter((q) => q.phase === 'extension');
    const adaptableQuestions = extensionQuestions.filter((q) => q.adaptable === true);
    const adaptablePercentage = (adaptableQuestions.length / extensionQuestions.length) * 100;

    // 根据 QUESTION_BANK_HANDOFF.md，应该有大约 89% 的 adaptable 题
    expect(adaptablePercentage).toBeGreaterThan(80);
  });

  it('should have consistent detail tags across questions', () => {
    const allDetailTags = new Set<string>();
    questionTemplates.forEach((q) => {
      if (q.detailTags) {
        q.detailTags.forEach((tag) => allDetailTags.add(tag));
      }
    });

    expect(allDetailTags.size).toBeGreaterThan(0);
  });

  it('should have consistent stage tags', () => {
    const stages = new Set(questionTemplates.map((q) => q.stageTag));
    const expectedStages = ['童年', '求学', '工作', '婚姻', '家庭', '迁徙', '时代记忆', '晚年'];
    expectedStages.forEach((stage) => {
      expect(stages.has(stage)).toBe(true);
    });
  });

  it('should have consistent narrative roles', () => {
    const roles = new Set(questionTemplates.map((q) => q.narrativeRole));
    const expectedRoles = ['profile', 'relationship', 'daily_life', 'representative_event', 'era_context', 'reflection'];
    expectedRoles.forEach((role) => {
      expect(roles.has(role)).toBe(true);
    });
  });

  it('should have consistent material types', () => {
    const types = new Set(questionTemplates.map((q) => q.materialType));
    const expectedTypes = ['person', 'scene', 'event', 'quote', 'object', 'emotion', 'timeline', 'mixed'];
    expectedTypes.forEach((type) => {
      expect(types.has(type)).toBe(true);
    });
  });

  it('should have consistent draft importance values', () => {
    const importances = new Set(questionTemplates.map((q) => q.draftImportance));
    const expectedImportances = ['core_2000', 'optional_reserve', 'expansion_lead'];
    expectedImportances.forEach((importance) => {
      expect(importances.has(importance)).toBe(true);
    });
  });
});
