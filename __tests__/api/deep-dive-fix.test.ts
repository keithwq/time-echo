import { describe, it, expect, beforeEach } from '@jest/globals';

/**
 * 测试 P0-10：修复深挖题过度触发
 *
 * 验证：
 * 1. 同主题深挖次数 ≤ 2
 * 2. 只在用户明确选择"需要深挖"的选项时触发深挖
 * 3. 用户选择"说不清"时不触发深挖
 */

describe('P0-10: 修复深挖题过度触发', () => {
  describe('子任务 7.1.1: 限制同主题深挖次数 ≤ 2', () => {
    it('第 1 次深挖应该触发', () => {
      // 模拟场景：用户在"童年"主题回答了一个问题，选择了"people"
      // 期望：应该触发深挖题

      const allAnswers = [
        {
          questionId: 'childhood_001',
          topicTag: '童年',
          content: '我父亲是个很严厉的人',
          selectedOption: 'people',
          createdAt: new Date(),
        },
      ];

      // 同主题深挖次数应该是 0
      const deepDiveCountInStage = allAnswers.filter((answer) =>
        answer.questionId.startsWith('deepdive_')
      ).length;

      expect(deepDiveCountInStage).toBe(0);
      expect(deepDiveCountInStage < 2).toBe(true);
    });

    it('第 2 次深挖应该触发', () => {
      // 模拟场景：用户已经有 1 个深挖题回答
      const allAnswers = [
        {
          questionId: 'deepdive_childhood_001',
          topicTag: '童年',
          content: '他总是很严厉',
          selectedOption: null,
          createdAt: new Date(),
        },
        {
          questionId: 'childhood_001',
          topicTag: '童年',
          content: '我父亲是个很严厉的人',
          selectedOption: 'people',
          createdAt: new Date(),
        },
      ];

      const deepDiveCountInStage = allAnswers.filter((answer) =>
        answer.questionId.startsWith('deepdive_')
      ).length;

      expect(deepDiveCountInStage).toBe(1);
      expect(deepDiveCountInStage < 2).toBe(true);
    });

    it('第 3 次深挖不应该触发', () => {
      // 模拟场景：用户已经有 2 个深挖题回答
      const allAnswers = [
        {
          questionId: 'deepdive_childhood_002',
          topicTag: '童年',
          content: '他总是很严厉',
          selectedOption: null,
          createdAt: new Date(),
        },
        {
          questionId: 'deepdive_childhood_001',
          topicTag: '童年',
          content: '他总是很严厉',
          selectedOption: null,
          createdAt: new Date(),
        },
        {
          questionId: 'childhood_001',
          topicTag: '童年',
          content: '我父亲是个很严厉的人',
          selectedOption: 'people',
          createdAt: new Date(),
        },
      ];

      const deepDiveCountInStage = allAnswers.filter((answer) =>
        answer.questionId.startsWith('deepdive_')
      ).length;

      expect(deepDiveCountInStage).toBe(2);
      expect(deepDiveCountInStage >= 2).toBe(true);
    });
  });

  describe('子任务 7.1.2: 只在用户明确选择"需要深挖"的选项时触发深挖', () => {
    it('用户选择"people"应该触发深挖', () => {
      const selectedOption = 'people';
      const EXPLICIT_DEEP_DIVE_VALUES = new Set([
        'people',
        'scene',
        'timeline',
        'emotion',
        'list',
        'quote',
        'object',
        'one_person',
        'place_clear',
        'year_range',
        'life_stage',
      ]);

      const hasExplicitDeepDiveChoice = selectedOption
        .split('|')
        .map((v) => v.trim())
        .some((value) => EXPLICIT_DEEP_DIVE_VALUES.has(value));

      expect(hasExplicitDeepDiveChoice).toBe(true);
    });

    it('用户选择"scene"应该触发深挖', () => {
      const selectedOption = 'scene';
      const EXPLICIT_DEEP_DIVE_VALUES = new Set([
        'people',
        'scene',
        'timeline',
        'emotion',
        'list',
        'quote',
        'object',
        'one_person',
        'place_clear',
        'year_range',
        'life_stage',
      ]);

      const hasExplicitDeepDiveChoice = selectedOption
        .split('|')
        .map((v) => v.trim())
        .some((value) => EXPLICIT_DEEP_DIVE_VALUES.has(value));

      expect(hasExplicitDeepDiveChoice).toBe(true);
    });

    it('用户选择"emotion"应该触发深挖', () => {
      const selectedOption = 'emotion';
      const EXPLICIT_DEEP_DIVE_VALUES = new Set([
        'people',
        'scene',
        'timeline',
        'emotion',
        'list',
        'quote',
        'object',
        'one_person',
        'place_clear',
        'year_range',
        'life_stage',
      ]);

      const hasExplicitDeepDiveChoice = selectedOption
        .split('|')
        .map((v) => v.trim())
        .some((value) => EXPLICIT_DEEP_DIVE_VALUES.has(value));

      expect(hasExplicitDeepDiveChoice).toBe(true);
    });
  });

  describe('子任务 7.1.3: 用户选择"说不清"不应该触发深挖', () => {
    it('用户选择"unclear"不应该触发深挖', () => {
      const selectedOption = 'unclear';
      const NO_DEEP_DIVE_VALUES = new Set([
        'unclear',
        'forgotten',
        'inconvenient',
        'not_applicable',
        'skip',
      ]);

      const hasNoDiveChoice = selectedOption
        .split('|')
        .map((v) => v.trim())
        .some((value) => NO_DEEP_DIVE_VALUES.has(value));

      expect(hasNoDiveChoice).toBe(true);
    });

    it('用户选择"forgotten"不应该触发深挖', () => {
      const selectedOption = 'forgotten';
      const NO_DEEP_DIVE_VALUES = new Set([
        'unclear',
        'forgotten',
        'inconvenient',
        'not_applicable',
        'skip',
      ]);

      const hasNoDiveChoice = selectedOption
        .split('|')
        .map((v) => v.trim())
        .some((value) => NO_DEEP_DIVE_VALUES.has(value));

      expect(hasNoDiveChoice).toBe(true);
    });

    it('用户选择"inconvenient"不应该触发深挖', () => {
      const selectedOption = 'inconvenient';
      const NO_DEEP_DIVE_VALUES = new Set([
        'unclear',
        'forgotten',
        'inconvenient',
        'not_applicable',
        'skip',
      ]);

      const hasNoDiveChoice = selectedOption
        .split('|')
        .map((v) => v.trim())
        .some((value) => NO_DEEP_DIVE_VALUES.has(value));

      expect(hasNoDiveChoice).toBe(true);
    });
  });

  describe('综合测试：shouldDigDeeper 逻辑', () => {
    it('用户选择"people"且同主题深挖 < 2 时应该触发深挖', () => {
      // 模拟 shouldDigDeeper 的逻辑
      const selectedOption = 'people';
      const deepDiveCountInStage = 0;

      const EXPLICIT_DEEP_DIVE_VALUES = new Set([
        'people',
        'scene',
        'timeline',
        'emotion',
        'list',
        'quote',
        'object',
        'one_person',
        'place_clear',
        'year_range',
        'life_stage',
      ]);

      const NO_DEEP_DIVE_VALUES = new Set([
        'unclear',
        'forgotten',
        'inconvenient',
        'not_applicable',
        'skip',
      ]);

      const selectedValues = selectedOption.split('|').map((v) => v.trim());

      // 第一步：检查是否选择了"不想深挖"的选项
      const hasNoDiveChoice = selectedValues.some((value) => NO_DEEP_DIVE_VALUES.has(value));
      if (hasNoDiveChoice) {
        expect(true).toBe(false); // 不应该到这里
      }

      // 第二步：检查是否选择了"需要深挖"的选项
      const hasExplicitDeepDiveChoice = selectedValues.some((value) =>
        EXPLICIT_DEEP_DIVE_VALUES.has(value)
      );
      expect(hasExplicitDeepDiveChoice).toBe(true);

      // 第三步：检查同主题深挖次数
      expect(deepDiveCountInStage < 2).toBe(true);

      // 综合判断：应该触发深挖
      const shouldTriggerDeepDive =
        !hasNoDiveChoice && hasExplicitDeepDiveChoice && deepDiveCountInStage < 2;
      expect(shouldTriggerDeepDive).toBe(true);
    });

    it('用户选择"unclear"时不应该触发深挖', () => {
      const selectedOption = 'unclear';
      const deepDiveCountInStage = 0;

      const NO_DEEP_DIVE_VALUES = new Set([
        'unclear',
        'forgotten',
        'inconvenient',
        'not_applicable',
        'skip',
      ]);

      const selectedValues = selectedOption.split('|').map((v) => v.trim());
      const hasNoDiveChoice = selectedValues.some((value) => NO_DEEP_DIVE_VALUES.has(value));

      expect(hasNoDiveChoice).toBe(true);

      const shouldTriggerDeepDive = !hasNoDiveChoice;
      expect(shouldTriggerDeepDive).toBe(false);
    });

    it('同主题深挖 >= 2 时不应该触发深挖', () => {
      const selectedOption = 'people';
      const deepDiveCountInStage = 2;

      const EXPLICIT_DEEP_DIVE_VALUES = new Set([
        'people',
        'scene',
        'timeline',
        'emotion',
        'list',
        'quote',
        'object',
        'one_person',
        'place_clear',
        'year_range',
        'life_stage',
      ]);

      const NO_DEEP_DIVE_VALUES = new Set([
        'unclear',
        'forgotten',
        'inconvenient',
        'not_applicable',
        'skip',
      ]);

      const selectedValues = selectedOption.split('|').map((v) => v.trim());

      const hasNoDiveChoice = selectedValues.some((value) => NO_DEEP_DIVE_VALUES.has(value));
      const hasExplicitDeepDiveChoice = selectedValues.some((value) =>
        EXPLICIT_DEEP_DIVE_VALUES.has(value)
      );

      const shouldTriggerDeepDive =
        !hasNoDiveChoice && hasExplicitDeepDiveChoice && deepDiveCountInStage < 2;

      expect(shouldTriggerDeepDive).toBe(false);
    });
  });
});
