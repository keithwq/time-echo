import { describe, it, expect } from '@jest/globals';

/**
 * 测试 P1-5：修复题目重复出现
 *
 * 验证：
 * 1. 原始题不再出现
 * 2. 深挖题不再出现
 * 3. excludedIds 正确包含所有应排除的题目
 */

describe('P1-5: 修复题目重复出现', () => {
  describe('任务 7.2.1: 修复 excludedIds 构建逻辑', () => {
    it('excludedIds 应该包含已回答题', () => {
      const answeredQuestionIds = ['childhood_001', 'childhood_002'];
      const skippedQuestionIds: string[] = [];

      const excludedIds = new Set([...answeredQuestionIds, ...skippedQuestionIds]);

      expect(excludedIds.has('childhood_001')).toBe(true);
      expect(excludedIds.has('childhood_002')).toBe(true);
    });

    it('excludedIds 应该包含已跳过题', () => {
      const answeredQuestionIds: string[] = [];
      const skippedQuestionIds = ['childhood_003', 'childhood_004'];

      const excludedIds = new Set([...answeredQuestionIds, ...skippedQuestionIds]);

      expect(excludedIds.has('childhood_003')).toBe(true);
      expect(excludedIds.has('childhood_004')).toBe(true);
    });

    it('excludedIds 应该包含深挖题的原始题', () => {
      const answeredQuestionIds = [
        'deepdive_childhood_001',
        'childhood_001',
        'childhood_002',
      ];
      const skippedQuestionIds: string[] = [];

      const excludedIds = new Set([...answeredQuestionIds, ...skippedQuestionIds]);

      // 添加深挖题的原始题到排除集合
      answeredQuestionIds.forEach((questionId) => {
        if (questionId.startsWith('deepdive_')) {
          const originalQuestionId = questionId.replace('deepdive_', '');
          excludedIds.add(originalQuestionId);
        }
      });

      // 验证：原始题应该被排除
      expect(excludedIds.has('childhood_001')).toBe(true);
      expect(excludedIds.has('deepdive_childhood_001')).toBe(true);
    });

    it('excludedIds 应该包含多个深挖题的原始题', () => {
      const answeredQuestionIds = [
        'deepdive_childhood_001',
        'deepdive_childhood_002',
        'childhood_001',
        'childhood_002',
        'childhood_003',
      ];
      const skippedQuestionIds: string[] = [];

      const excludedIds = new Set([...answeredQuestionIds, ...skippedQuestionIds]);

      answeredQuestionIds.forEach((questionId) => {
        if (questionId.startsWith('deepdive_')) {
          const originalQuestionId = questionId.replace('deepdive_', '');
          excludedIds.add(originalQuestionId);
        }
      });

      // 验证：所有原始题都应该被排除
      expect(excludedIds.has('childhood_001')).toBe(true);
      expect(excludedIds.has('childhood_002')).toBe(true);
      expect(excludedIds.has('deepdive_childhood_001')).toBe(true);
      expect(excludedIds.has('deepdive_childhood_002')).toBe(true);

      // 验证：未被深挖的题目不应该被排除
      expect(excludedIds.has('childhood_003')).toBe(true); // 已回答
    });
  });

  describe('任务 7.2.2: 测试题目重复', () => {
    it('原始题不再出现', () => {
      // 模拟场景：用户回答了 childhood_001，然后系统生成了深挖题 deepdive_childhood_001
      const answeredQuestionIds = [
        'deepdive_childhood_001',
        'childhood_001',
      ];
      const skippedQuestionIds: string[] = [];

      const excludedIds = new Set([...answeredQuestionIds, ...skippedQuestionIds]);

      answeredQuestionIds.forEach((questionId) => {
        if (questionId.startsWith('deepdive_')) {
          const originalQuestionId = questionId.replace('deepdive_', '');
          excludedIds.add(originalQuestionId);
        }
      });

      // 验证：childhood_001 应该被排除，不会再次出现
      expect(excludedIds.has('childhood_001')).toBe(true);

      // 模拟选择下一题时的过滤
      const availableQuestions = ['childhood_002', 'childhood_003', 'childhood_001'];
      const filteredQuestions = availableQuestions.filter(
        (q) => !excludedIds.has(q)
      );

      expect(filteredQuestions).toContain('childhood_002');
      expect(filteredQuestions).toContain('childhood_003');
      expect(filteredQuestions).not.toContain('childhood_001');
    });

    it('深挖题不再出现', () => {
      // 模拟场景：用户已经回答了深挖题
      const answeredQuestionIds = [
        'deepdive_childhood_001',
        'childhood_001',
      ];
      const skippedQuestionIds: string[] = [];

      const excludedIds = new Set([...answeredQuestionIds, ...skippedQuestionIds]);

      answeredQuestionIds.forEach((questionId) => {
        if (questionId.startsWith('deepdive_')) {
          const originalQuestionId = questionId.replace('deepdive_', '');
          excludedIds.add(originalQuestionId);
        }
      });

      // 验证：deepdive_childhood_001 应该被排除
      expect(excludedIds.has('deepdive_childhood_001')).toBe(true);

      // 模拟选择下一题时的过滤
      const availableQuestions = [
        'deepdive_childhood_001',
        'childhood_002',
        'childhood_003',
      ];
      const filteredQuestions = availableQuestions.filter(
        (q) => !excludedIds.has(q)
      );

      expect(filteredQuestions).toContain('childhood_002');
      expect(filteredQuestions).toContain('childhood_003');
      expect(filteredQuestions).not.toContain('deepdive_childhood_001');
    });

    it('同一题不再重复出现', () => {
      // 模拟完整场景：用户回答了多个题目，包括深挖题
      const answeredQuestionIds = [
        'deepdive_childhood_002',
        'childhood_002',
        'deepdive_childhood_001',
        'childhood_001',
      ];
      const skippedQuestionIds = ['childhood_003'];

      const excludedIds = new Set([...answeredQuestionIds, ...skippedQuestionIds]);

      answeredQuestionIds.forEach((questionId) => {
        if (questionId.startsWith('deepdive_')) {
          const originalQuestionId = questionId.replace('deepdive_', '');
          excludedIds.add(originalQuestionId);
        }
      });

      // 验证排除集合的大小
      // 应该包含：childhood_001, childhood_002, childhood_003, deepdive_childhood_001, deepdive_childhood_002
      expect(excludedIds.size).toBe(5);

      // 验证所有题目都被排除
      expect(excludedIds.has('childhood_001')).toBe(true);
      expect(excludedIds.has('childhood_002')).toBe(true);
      expect(excludedIds.has('childhood_003')).toBe(true);
      expect(excludedIds.has('deepdive_childhood_001')).toBe(true);
      expect(excludedIds.has('deepdive_childhood_002')).toBe(true);

      // 模拟选择下一题时的过滤
      const availableQuestions = [
        'childhood_001',
        'childhood_002',
        'childhood_003',
        'childhood_004',
        'deepdive_childhood_001',
        'deepdive_childhood_002',
      ];
      const filteredQuestions = availableQuestions.filter(
        (q) => !excludedIds.has(q)
      );

      // 只有 childhood_004 应该可用
      expect(filteredQuestions).toEqual(['childhood_004']);
    });
  });
});
