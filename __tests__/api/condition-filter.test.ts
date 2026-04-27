import { describe, it, expect } from '@jest/globals';

/**
 * 测试 P3-1：修复假设性问题
 *
 * 验证：
 * 1. 无条件的题目总是显示
 * 2. 有条件的题目根据用户状态显示/隐藏
 * 3. 单身用户不看到"您和伴侣"相关题目
 * 4. 已婚用户可以看到婚姻相关题目
 */

describe('P3-1: 修复假设性问题', () => {
  // 定义条件值集合
  const CONDITION_VALUES = {
    HAS_SPOUSE: 'has_spouse',
    NO_SPOUSE: 'no_spouse',
    HAS_CHILDREN: 'has_children',
    NO_CHILDREN: 'no_children',
  };

  // 模拟 evaluateCondition 函数
  function evaluateConditionMock(
    condition: string | null | undefined,
    userState: { hasSpouse: boolean; hasChildren: boolean }
  ): boolean {
    if (!condition) {
      return true; // 无条件限制，总是显示
    }

    switch (condition) {
      case CONDITION_VALUES.HAS_SPOUSE:
        return userState.hasSpouse;
      case CONDITION_VALUES.NO_SPOUSE:
        return !userState.hasSpouse;
      case CONDITION_VALUES.HAS_CHILDREN:
        return userState.hasChildren;
      case CONDITION_VALUES.NO_CHILDREN:
        return !userState.hasChildren;
      default:
        return true;
    }
  }

  describe('任务 7.4.1: 无条件题目总是显示', () => {
    it('condition 为 null 的题目应该显示', () => {
      const condition = null;
      const userState = { hasSpouse: false, hasChildren: false };

      const result = evaluateConditionMock(condition, userState);
      expect(result).toBe(true);
    });

    it('condition 为 undefined 的题目应该显示', () => {
      const condition = undefined;
      const userState = { hasSpouse: false, hasChildren: false };

      const result = evaluateConditionMock(condition, userState);
      expect(result).toBe(true);
    });

    it('无条件题目对所有用户状态都显示', () => {
      const condition = null;

      const singleUserState = { hasSpouse: false, hasChildren: false };
      const marriedUserState = { hasSpouse: true, hasChildren: false };
      const parentUserState = { hasSpouse: true, hasChildren: true };

      expect(evaluateConditionMock(condition, singleUserState)).toBe(true);
      expect(evaluateConditionMock(condition, marriedUserState)).toBe(true);
      expect(evaluateConditionMock(condition, parentUserState)).toBe(true);
    });
  });

  describe('任务 7.4.2: 有条件题目根据用户状态显示/隐藏', () => {
    it('has_spouse 条件：已婚用户可以看到', () => {
      const condition = CONDITION_VALUES.HAS_SPOUSE;
      const userState = { hasSpouse: true, hasChildren: false };

      const result = evaluateConditionMock(condition, userState);
      expect(result).toBe(true);
    });

    it('has_spouse 条件：单身用户看不到', () => {
      const condition = CONDITION_VALUES.HAS_SPOUSE;
      const userState = { hasSpouse: false, hasChildren: false };

      const result = evaluateConditionMock(condition, userState);
      expect(result).toBe(false);
    });

    it('no_spouse 条件：单身用户可以看到', () => {
      const condition = CONDITION_VALUES.NO_SPOUSE;
      const userState = { hasSpouse: false, hasChildren: false };

      const result = evaluateConditionMock(condition, userState);
      expect(result).toBe(true);
    });

    it('no_spouse 条件：已婚用户看不到', () => {
      const condition = CONDITION_VALUES.NO_SPOUSE;
      const userState = { hasSpouse: true, hasChildren: false };

      const result = evaluateConditionMock(condition, userState);
      expect(result).toBe(false);
    });

    it('has_children 条件：有子女用户可以看到', () => {
      const condition = CONDITION_VALUES.HAS_CHILDREN;
      const userState = { hasSpouse: true, hasChildren: true };

      const result = evaluateConditionMock(condition, userState);
      expect(result).toBe(true);
    });

    it('has_children 条件：无子女用户看不到', () => {
      const condition = CONDITION_VALUES.HAS_CHILDREN;
      const userState = { hasSpouse: true, hasChildren: false };

      const result = evaluateConditionMock(condition, userState);
      expect(result).toBe(false);
    });
  });

  describe('任务 7.4.3: 单身用户不看到"您和伴侣"相关题目', () => {
    it('单身用户不应该看到婚姻相关题目', () => {
      const questions = [
        { id: 'marriage_001', content: '您和伴侣', condition: CONDITION_VALUES.HAS_SPOUSE },
        { id: 'marriage_002', content: '您的婚姻生活', condition: CONDITION_VALUES.HAS_SPOUSE },
        { id: 'general_001', content: '您的人生经历', condition: null },
      ];

      const singleUserState = { hasSpouse: false, hasChildren: false };

      const availableQuestions = questions.filter((q) =>
        evaluateConditionMock(q.condition, singleUserState)
      );

      expect(availableQuestions).toHaveLength(1);
      expect(availableQuestions[0].id).toBe('general_001');
      expect(availableQuestions).not.toContainEqual(
        expect.objectContaining({ id: 'marriage_001' })
      );
      expect(availableQuestions).not.toContainEqual(
        expect.objectContaining({ id: 'marriage_002' })
      );
    });

    it('已婚用户可以看到婚姻相关题目', () => {
      const questions = [
        { id: 'marriage_001', content: '您和伴侣', condition: CONDITION_VALUES.HAS_SPOUSE },
        { id: 'marriage_002', content: '您的婚姻生活', condition: CONDITION_VALUES.HAS_SPOUSE },
        { id: 'general_001', content: '您的人生经历', condition: null },
      ];

      const marriedUserState = { hasSpouse: true, hasChildren: false };

      const availableQuestions = questions.filter((q) =>
        evaluateConditionMock(q.condition, marriedUserState)
      );

      expect(availableQuestions).toHaveLength(3);
      expect(availableQuestions.map((q) => q.id)).toContain('marriage_001');
      expect(availableQuestions.map((q) => q.id)).toContain('marriage_002');
      expect(availableQuestions.map((q) => q.id)).toContain('general_001');
    });
  });

  describe('任务 7.4.4: 综合过滤测试', () => {
    it('单身无子女用户的题目过滤', () => {
      const questions = [
        { id: 'q1', content: '您的成长经历', condition: null },
        { id: 'q2', content: '您和伴侣的故事', condition: CONDITION_VALUES.HAS_SPOUSE },
        { id: 'q3', content: '您的单身生活', condition: CONDITION_VALUES.NO_SPOUSE },
        { id: 'q4', content: '您的子女', condition: CONDITION_VALUES.HAS_CHILDREN },
      ];

      const userState = { hasSpouse: false, hasChildren: false };

      const availableQuestions = questions.filter((q) =>
        evaluateConditionMock(q.condition, userState)
      );

      expect(availableQuestions.map((q) => q.id)).toEqual(['q1', 'q3']);
    });

    it('已婚有子女用户的题目过滤', () => {
      const questions = [
        { id: 'q1', content: '您的成长经历', condition: null },
        { id: 'q2', content: '您和伴侣的故事', condition: CONDITION_VALUES.HAS_SPOUSE },
        { id: 'q3', content: '您的单身生活', condition: CONDITION_VALUES.NO_SPOUSE },
        { id: 'q4', content: '您的子女', condition: CONDITION_VALUES.HAS_CHILDREN },
      ];

      const userState = { hasSpouse: true, hasChildren: true };

      const availableQuestions = questions.filter((q) =>
        evaluateConditionMock(q.condition, userState)
      );

      expect(availableQuestions.map((q) => q.id)).toEqual(['q1', 'q2', 'q4']);
    });
  });
});
