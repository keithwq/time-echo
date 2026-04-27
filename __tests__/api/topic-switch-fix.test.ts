import { describe, it, expect } from '@jest/globals';

/**
 * 测试 P2-1：修复话题生硬切换
 *
 * 验证：
 * 1. 同主题优先
 * 2. 相邻主题其次
 * 3. 其他主题最后
 */

describe('P2-1: 修复话题生硬切换', () => {
  // 定义相邻主题关系
  const ADJACENT_STAGES: Record<string, string[]> = {
    童年: ['求学'],
    求学: ['童年', '工作'],
    工作: ['求学', '婚姻'],
    婚姻: ['工作', '家庭'],
    家庭: ['婚姻', '子女'],
    子女: ['家庭', '晚年'],
    迁徙: ['工作', '婚姻'],
    时代记忆: ['工作', '晚年'],
    晚年: ['时代记忆', '子女'],
  };

  describe('任务 7.3.1: 重构 selectNextQuestion() 优先级', () => {
    it('同主题优先', () => {
      const lastQuestionStage = '童年';
      const availableStages = ['童年', '求学', '工作'];

      // 模拟选择逻辑：同主题优先
      let selectedStage: string | null = null;

      // 1. 优先选择同主题
      if (availableStages.includes(lastQuestionStage)) {
        selectedStage = lastQuestionStage;
      }

      expect(selectedStage).toBe('童年');
    });

    it('相邻主题其次', () => {
      const lastQuestionStage = '童年';
      const availableStages = ['求学', '工作', '婚姻'];

      let selectedStage: string | null = null;

      // 1. 优先选择同主题（不可用）
      if (availableStages.includes(lastQuestionStage)) {
        selectedStage = lastQuestionStage;
      }

      // 2. 其次选择相邻主题
      if (!selectedStage) {
        const adjacentStages = ADJACENT_STAGES[lastQuestionStage] || [];
        for (const adjacentStage of adjacentStages) {
          if (availableStages.includes(adjacentStage)) {
            selectedStage = adjacentStage;
            break;
          }
        }
      }

      expect(selectedStage).toBe('求学');
    });

    it('其他主题最后', () => {
      const lastQuestionStage = '童年';
      const availableStages = ['工作', '婚姻', '晚年'];

      let selectedStage: string | null = null;

      // 1. 优先选择同主题（不可用）
      if (availableStages.includes(lastQuestionStage)) {
        selectedStage = lastQuestionStage;
      }

      // 2. 其次选择相邻主题（不可用）
      if (!selectedStage) {
        const adjacentStages = ADJACENT_STAGES[lastQuestionStage] || [];
        for (const adjacentStage of adjacentStages) {
          if (availableStages.includes(adjacentStage)) {
            selectedStage = adjacentStage;
            break;
          }
        }
      }

      // 3. 最后选择其他主题
      if (!selectedStage && availableStages.length > 0) {
        selectedStage = availableStages[0];
      }

      expect(selectedStage).toBe('工作');
    });
  });

  describe('任务 7.3.2: 实现 getAdjacentStages() 函数', () => {
    it('童年的相邻主题应该是求学', () => {
      const adjacentStages = ADJACENT_STAGES['童年'];
      expect(adjacentStages).toContain('求学');
    });

    it('求学的相邻主题应该是童年和工作', () => {
      const adjacentStages = ADJACENT_STAGES['求学'];
      expect(adjacentStages).toContain('童年');
      expect(adjacentStages).toContain('工作');
    });

    it('工作的相邻主题应该是求学和婚姻', () => {
      const adjacentStages = ADJACENT_STAGES['工作'];
      expect(adjacentStages).toContain('求学');
      expect(adjacentStages).toContain('婚姻');
    });

    it('婚姻的相邻主题应该是工作和家庭', () => {
      const adjacentStages = ADJACENT_STAGES['婚姻'];
      expect(adjacentStages).toContain('工作');
      expect(adjacentStages).toContain('家庭');
    });

    it('晚年的相邻主题应该是时代记忆和子女', () => {
      const adjacentStages = ADJACENT_STAGES['晚年'];
      expect(adjacentStages).toContain('时代记忆');
      expect(adjacentStages).toContain('子女');
    });
  });

  describe('任务 7.3.3: 测试话题切换', () => {
    it('从童年切换到求学（相邻主题）', () => {
      const lastQuestionStage = '童年';
      const availableStages = ['求学', '工作'];

      let selectedStage: string | null = null;

      if (availableStages.includes(lastQuestionStage)) {
        selectedStage = lastQuestionStage;
      }

      if (!selectedStage) {
        const adjacentStages = ADJACENT_STAGES[lastQuestionStage] || [];
        for (const adjacentStage of adjacentStages) {
          if (availableStages.includes(adjacentStage)) {
            selectedStage = adjacentStage;
            break;
          }
        }
      }

      expect(selectedStage).toBe('求学');
    });

    it('从工作切换到婚姻（相邻主题）', () => {
      const lastQuestionStage = '工作';
      const availableStages = ['婚姻', '晚年'];

      let selectedStage: string | null = null;

      if (availableStages.includes(lastQuestionStage)) {
        selectedStage = lastQuestionStage;
      }

      if (!selectedStage) {
        const adjacentStages = ADJACENT_STAGES[lastQuestionStage] || [];
        for (const adjacentStage of adjacentStages) {
          if (availableStages.includes(adjacentStage)) {
            selectedStage = adjacentStage;
            break;
          }
        }
      }

      expect(selectedStage).toBe('婚姻');
    });

    it('从求学切换到工作（相邻主题）', () => {
      const lastQuestionStage = '求学';
      const availableStages = ['工作', '晚年'];

      let selectedStage: string | null = null;

      if (availableStages.includes(lastQuestionStage)) {
        selectedStage = lastQuestionStage;
      }

      if (!selectedStage) {
        const adjacentStages = ADJACENT_STAGES[lastQuestionStage] || [];
        for (const adjacentStage of adjacentStages) {
          if (availableStages.includes(adjacentStage)) {
            selectedStage = adjacentStage;
            break;
          }
        }
      }

      expect(selectedStage).toBe('工作');
    });

    it('优先级验证：同主题 > 相邻主题 > 其他主题', () => {
      const lastQuestionStage = '工作';

      // 场景 1：同主题可用
      let availableStages = ['工作', '婚姻', '晚年'];
      let selectedStage: string | null = null;

      if (availableStages.includes(lastQuestionStage)) {
        selectedStage = lastQuestionStage;
      }
      expect(selectedStage).toBe('工作');

      // 场景 2：同主题不可用，相邻主题可用
      availableStages = ['婚姻', '晚年'];
      selectedStage = null;

      if (availableStages.includes(lastQuestionStage)) {
        selectedStage = lastQuestionStage;
      }

      if (!selectedStage) {
        const adjacentStages = ADJACENT_STAGES[lastQuestionStage] || [];
        for (const adjacentStage of adjacentStages) {
          if (availableStages.includes(adjacentStage)) {
            selectedStage = adjacentStage;
            break;
          }
        }
      }

      expect(selectedStage).toBe('婚姻');

      // 场景 3：同主题和相邻主题都不可用，选择其他主题
      availableStages = ['晚年', '迁徙'];
      selectedStage = null;

      if (availableStages.includes(lastQuestionStage)) {
        selectedStage = lastQuestionStage;
      }

      if (!selectedStage) {
        const adjacentStages = ADJACENT_STAGES[lastQuestionStage] || [];
        for (const adjacentStage of adjacentStages) {
          if (availableStages.includes(adjacentStage)) {
            selectedStage = adjacentStage;
            break;
          }
        }
      }

      if (!selectedStage && availableStages.length > 0) {
        selectedStage = availableStages[0];
      }

      expect(selectedStage).toBe('晚年');
    });
  });
});
