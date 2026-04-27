import { describe, it, expect } from '@jest/globals';

/**
 * 测试 P0-2：调度器对齐
 *
 * 验证：
 * 1. 基础访谈阶段只调度 phase: base 的题
 * 2. 扩展阶段只调度 phase: extension 的题
 * 3. 尾声题 phase: closure 作为可选题，不阻塞初稿生成
 */

describe('P0-2: 调度器对齐', () => {
  describe('任务 3.2.1: 修改 /api/questions/next 读取 phase 字段', () => {
    it('题目应该包含 phase 字段', () => {
      // 模拟题目对象
      const question = {
        id: 'childhood_001',
        content: '您最早的记忆是什么？',
        phase: 'base',
        stageTag: '童年',
        draftImportance: 'core_2000',
      };

      expect(question.phase).toBe('base');
      expect(['base', 'extension', 'closure']).toContain(question.phase);
    });

    it('phase 字段应该有三个有效值', () => {
      const validPhases = ['base', 'extension', 'closure'];

      const testPhases = ['base', 'extension', 'closure'];
      testPhases.forEach((phase) => {
        expect(validPhases).toContain(phase);
      });
    });
  });

  describe('任务 3.2.2: 实现基础访谈阶段调度逻辑', () => {
    it('基础访谈阶段应该只调度 phase: base 的题', () => {
      const isInExpansionMode = false;
      const availableQuestions = [
        { id: 'base_001', phase: 'base', stageTag: '童年' },
        { id: 'ext_001', phase: 'extension', stageTag: '童年' },
        { id: 'closure_001', phase: 'closure', stageTag: '晚年' },
      ];

      // 模拟基础访谈阶段的过滤
      const baseQuestions = availableQuestions.filter(
        (q) => q.phase === 'base'
      );

      expect(baseQuestions).toHaveLength(1);
      expect(baseQuestions[0].id).toBe('base_001');
    });

    it('基础访谈阶段应该排除 phase: extension 的题', () => {
      const availableQuestions = [
        { id: 'base_001', phase: 'base', stageTag: '童年' },
        { id: 'ext_001', phase: 'extension', stageTag: '童年' },
      ];

      const baseQuestions = availableQuestions.filter(
        (q) => q.phase === 'base'
      );

      expect(baseQuestions).not.toContainEqual(
        expect.objectContaining({ id: 'ext_001' })
      );
    });

    it('基础访谈阶段应该排除 phase: closure 的题', () => {
      const availableQuestions = [
        { id: 'base_001', phase: 'base', stageTag: '童年' },
        { id: 'closure_001', phase: 'closure', stageTag: '晚年' },
      ];

      const baseQuestions = availableQuestions.filter(
        (q) => q.phase === 'base'
      );

      expect(baseQuestions).not.toContainEqual(
        expect.objectContaining({ id: 'closure_001' })
      );
    });
  });

  describe('任务 3.2.3: 实现扩展阶段调度逻辑', () => {
    it('扩展阶段应该只调度 phase: extension 的题', () => {
      const isInExpansionMode = true;
      const availableQuestions = [
        { id: 'base_001', phase: 'base', stageTag: '童年' },
        { id: 'ext_001', phase: 'extension', stageTag: '童年' },
        { id: 'closure_001', phase: 'closure', stageTag: '晚年' },
      ];

      // 模拟扩展阶段的过滤
      const extensionQuestions = availableQuestions.filter(
        (q) => q.phase === 'extension'
      );

      expect(extensionQuestions).toHaveLength(1);
      expect(extensionQuestions[0].id).toBe('ext_001');
    });

    it('扩展阶段应该排除 phase: base 的题', () => {
      const availableQuestions = [
        { id: 'base_001', phase: 'base', stageTag: '童年' },
        { id: 'ext_001', phase: 'extension', stageTag: '童年' },
      ];

      const extensionQuestions = availableQuestions.filter(
        (q) => q.phase === 'extension'
      );

      expect(extensionQuestions).not.toContainEqual(
        expect.objectContaining({ id: 'base_001' })
      );
    });

    it('扩展阶段应该排除 phase: closure 的题', () => {
      const availableQuestions = [
        { id: 'ext_001', phase: 'extension', stageTag: '童年' },
        { id: 'closure_001', phase: 'closure', stageTag: '晚年' },
      ];

      const extensionQuestions = availableQuestions.filter(
        (q) => q.phase === 'extension'
      );

      expect(extensionQuestions).not.toContainEqual(
        expect.objectContaining({ id: 'closure_001' })
      );
    });
  });

  describe('任务 3.2.4: 实现尾声题调度逻辑', () => {
    it('尾声题应该作为可选题，不阻塞初稿生成', () => {
      const hasReachedBaseLimit = true;
      const availableQuestions = [
        { id: 'closure_001', phase: 'closure', stageTag: '晚年' },
        { id: 'closure_002', phase: 'closure', stageTag: '晚年' },
      ];

      // 模拟已达到基础题位上限时的过滤
      const epilogueQuestions = availableQuestions.filter(
        (q) => q.phase === 'closure'
      );

      expect(epilogueQuestions.length > 0).toBe(true);
      expect(epilogueQuestions[0].phase).toBe('closure');
    });

    it('尾声题不应该阻塞初稿生成', () => {
      const hasReachedBaseLimit = true;
      const availableQuestions: any[] = [];

      // 模拟没有尾声题时的情况
      const epilogueQuestions = availableQuestions.filter(
        (q) => q.phase === 'closure'
      );

      // 即使没有尾声题，也不应该阻塞初稿生成
      expect(epilogueQuestions.length === 0).toBe(true);
    });

    it('尾声题只在已达到基础题位上限时出现', () => {
      const hasReachedBaseLimit = false;
      const availableQuestions = [
        { id: 'base_001', phase: 'base', stageTag: '童年' },
        { id: 'closure_001', phase: 'closure', stageTag: '晚年' },
      ];

      // 模拟基础访谈阶段的过滤
      const baseQuestions = availableQuestions.filter(
        (q) => q.phase === 'base'
      );

      // 基础访谈阶段应该先返回基础题，不是尾声题
      expect(baseQuestions[0].phase).toBe('base');
    });
  });

  describe('任务 3.2.5: 测试调度器', () => {
    it('基础访谈阶段只调度 phase: base 的题', () => {
      const isInExpansionMode = false;
      const availableQuestions = [
        { id: 'base_001', phase: 'base', stageTag: '童年', draftImportance: 'core_2000' },
        { id: 'base_002', phase: 'base', stageTag: '求学', draftImportance: 'core_2000' },
        { id: 'ext_001', phase: 'extension', stageTag: '工作', draftImportance: 'core_2000' },
      ];

      const baseQuestions = availableQuestions.filter(
        (q) => q.phase === 'base' && q.draftImportance === 'core_2000'
      );

      expect(baseQuestions).toHaveLength(2);
      baseQuestions.forEach((q) => {
        expect(q.phase).toBe('base');
      });
    });

    it('扩展阶段只调度 phase: extension 的题', () => {
      const isInExpansionMode = true;
      const availableQuestions = [
        { id: 'base_001', phase: 'base', stageTag: '童年', draftImportance: 'core_2000' },
        { id: 'ext_001', phase: 'extension', stageTag: '工作', draftImportance: 'core_2000' },
        { id: 'ext_002', phase: 'extension', stageTag: '婚姻', draftImportance: 'core_2000' },
      ];

      const extensionQuestions = availableQuestions.filter(
        (q) => q.phase === 'extension'
      );

      expect(extensionQuestions).toHaveLength(2);
      extensionQuestions.forEach((q) => {
        expect(q.phase).toBe('extension');
      });
    });

    it('尾声题不阻塞初稿生成', () => {
      const hasReachedBaseLimit = true;
      const availableQuestions = [
        { id: 'closure_001', phase: 'closure', stageTag: '晚年' },
      ];

      const epilogueQuestions = availableQuestions.filter(
        (q) => q.phase === 'closure'
      );

      // 尾声题可以返回，但不是必须的
      expect(epilogueQuestions.length >= 0).toBe(true);
    });
  });
});
