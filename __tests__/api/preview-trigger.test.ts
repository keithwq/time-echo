import { describe, it, expect } from '@jest/globals';

/**
 * 测试 P0-4：预览触发
 *
 * 验证：
 * 1. 约 40 题左右，系统判断内容足够
 * 2. 满足条件时建议预览
 * 3. 不满足条件时不建议预览
 */

describe('P0-4: 预览触发', () => {
  // 定义预览触发条件
  const STAGE_PRIORITY = ['童年', '求学', '工作', '婚姻', '家庭', '迁徙', '时代记忆', '晚年'] as const;

  function calculateShouldSuggestPreview(
    answeredQuestionIds: string[],
    stageCounts: Record<string, number>
  ): boolean {
    // 条件 0：保底逻辑 —— 如果已经回答了超过 40 题，强制建议预览
    if (answeredQuestionIds.length >= 40) {
      return true;
    }

    // 条件 1：已完成不少于 22 题
    if (answeredQuestionIds.length < 22) {
      return false;
    }

    // 条件 2：主干主题覆盖不少于 6 个
    const coveredStages = STAGE_PRIORITY.filter((stage) => stageCounts[stage] > 0);
    if (coveredStages.length < 6) {
      return false;
    }

    // 条件 3：至少有 2 条高价值线索已被深挖
    const deepDiveCount = answeredQuestionIds.filter((id) => id.startsWith('deepdive_')).length;
    if (deepDiveCount < 2) {
      return false;
    }

    // 条件 4：已可拼出"成长/工作/当下感悟"的基本结构
    const coreStages = ['童年', '工作', '晚年'];
    const hasCoreStages = coreStages.every((stage) => stageCounts[stage] > 0);
    if (!hasCoreStages) {
      return false;
    }

    return true;
  }

  describe('任务 4.2.1: 实现预览触发条件判断', () => {
    it('条件 0：已回答 40 题以上，强制建议预览', () => {
      const answeredQuestionIds = Array.from({ length: 40 }, (_, i) => `q_${i}`);
      const stageCounts = {
        童年: 5,
        求学: 5,
        工作: 5,
        婚姻: 5,
        家庭: 5,
        迁徙: 5,
        时代记忆: 5,
        晚年: 5,
      };

      const shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(true);
    });

    it('条件 1：已完成不少于 22 题', () => {
      const answeredQuestionIds = Array.from({ length: 21 }, (_, i) => `q_${i}`);
      const stageCounts = {
        童年: 5,
        求学: 5,
        工作: 5,
        婚姻: 5,
        家庭: 1,
        迁徙: 0,
        时代记忆: 0,
        晚年: 0,
      };

      const shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(false);
    });

    it('条件 2：主干主题覆盖不少于 6 个', () => {
      const answeredQuestionIds = Array.from({ length: 25 }, (_, i) => `q_${i}`);
      const stageCounts = {
        童年: 5,
        求学: 5,
        工作: 5,
        婚姻: 5,
        家庭: 5,
        迁徙: 0,
        时代记忆: 0,
        晚年: 0,
      };

      const shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(false);
    });

    it('条件 3：至少有 2 条高价值线索已被深挖', () => {
      const answeredQuestionIds = Array.from({ length: 25 }, (_, i) =>
        i < 1 ? `deepdive_q_${i}` : `q_${i}`
      );
      const stageCounts = {
        童年: 5,
        求学: 5,
        工作: 5,
        婚姻: 5,
        家庭: 5,
        迁徙: 0,
        时代记忆: 0,
        晚年: 0,
      };

      const shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(false);
    });

    it('条件 4：覆盖三个核心主题（童年、工作、晚年）', () => {
      const answeredQuestionIds = Array.from({ length: 25 }, (_, i) =>
        i < 2 ? `deepdive_q_${i}` : `q_${i}`
      );
      const stageCounts = {
        童年: 5,
        求学: 5,
        工作: 5,
        婚姻: 5,
        家庭: 5,
        迁徙: 0,
        时代记忆: 0,
        晚年: 0, // 缺少晚年
      };

      const shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(false);
    });
  });

  describe('任务 4.2.2: 满足所有条件时建议预览', () => {
    it('满足所有条件：建议预览', () => {
      const answeredQuestionIds = Array.from({ length: 25 }, (_, i) =>
        i < 2 ? `deepdive_q_${i}` : `q_${i}`
      );
      const stageCounts = {
        童年: 5,
        求学: 5,
        工作: 5,
        婚姻: 5,
        家庭: 5,
        迁徙: 0,
        时代记忆: 0,
        晚年: 1, // 覆盖晚年
      };

      const shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(true);
    });

    it('已回答 40 题：强制建议预览', () => {
      const answeredQuestionIds = Array.from({ length: 40 }, (_, i) => `q_${i}`);
      const stageCounts = {
        童年: 5,
        求学: 5,
        工作: 5,
        婚姻: 5,
        家庭: 5,
        迁徙: 5,
        时代记忆: 5,
        晚年: 5,
      };

      const shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(true);
    });
  });

  describe('任务 4.2.3: 不满足条件时不建议预览', () => {
    it('题数不足：不建议预览', () => {
      const answeredQuestionIds = Array.from({ length: 15 }, (_, i) => `q_${i}`);
      const stageCounts = {
        童年: 5,
        求学: 5,
        工作: 5,
        婚姻: 0,
        家庭: 0,
        迁徙: 0,
        时代记忆: 0,
        晚年: 0,
      };

      const shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(false);
    });

    it('主题覆盖不足：不建议预览', () => {
      const answeredQuestionIds = Array.from({ length: 25 }, (_, i) =>
        i < 2 ? `deepdive_q_${i}` : `q_${i}`
      );
      const stageCounts = {
        童年: 10,
        求学: 10,
        工作: 5,
        婚姻: 0,
        家庭: 0,
        迁徙: 0,
        时代记忆: 0,
        晚年: 0,
      };

      const shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(false);
    });

    it('深挖不足：不建议预览', () => {
      const answeredQuestionIds = Array.from({ length: 25 }, (_, i) => `q_${i}`);
      const stageCounts = {
        童年: 5,
        求学: 5,
        工作: 5,
        婚姻: 5,
        家庭: 5,
        迁徙: 0,
        时代记忆: 0,
        晚年: 0,
      };

      const shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(false);
    });

    it('缺少核心主题：不建议预览', () => {
      const answeredQuestionIds = Array.from({ length: 25 }, (_, i) =>
        i < 2 ? `deepdive_q_${i}` : `q_${i}`
      );
      const stageCounts = {
        童年: 5,
        求学: 5,
        工作: 5,
        婚姻: 5,
        家庭: 5,
        迁徙: 0,
        时代记忆: 0,
        晚年: 0, // 缺少晚年
      };

      const shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(false);
    });
  });

  describe('任务 4.2.4: 测试预览触发', () => {
    it('完整流程：从 22 题到 40 题的预览触发', () => {
      // 22 题，不满足条件
      let answeredQuestionIds = Array.from({ length: 22 }, (_, i) =>
        i < 2 ? `deepdive_q_${i}` : `q_${i}`
      );
      let stageCounts = {
        童年: 5,
        求学: 5,
        工作: 5,
        婚姻: 5,
        家庭: 2,
        迁徙: 0,
        时代记忆: 0,
        晚年: 0,
      };

      let shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(false);

      // 25 题，满足所有条件
      answeredQuestionIds = Array.from({ length: 25 }, (_, i) =>
        i < 2 ? `deepdive_q_${i}` : `q_${i}`
      );
      stageCounts = {
        童年: 5,
        求学: 5,
        工作: 5,
        婚姻: 5,
        家庭: 5,
        迁徙: 0,
        时代记忆: 0,
        晚年: 1,
      };

      shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(true);

      // 40 题，强制建议
      answeredQuestionIds = Array.from({ length: 40 }, (_, i) => `q_${i}`);
      stageCounts = {
        童年: 5,
        求学: 5,
        工作: 5,
        婚姻: 5,
        家庭: 5,
        迁徙: 5,
        时代记忆: 5,
        晚年: 5,
      };

      shouldSuggest = calculateShouldSuggestPreview(answeredQuestionIds, stageCounts);
      expect(shouldSuggest).toBe(true);
    });
  });
});
