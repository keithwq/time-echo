import { describe, it, expect } from '@jest/globals';
import { analyzeGaps } from '@/lib/gapAnalyzer';

/**
 * 测试 P0-6：问题包补全
 *
 * 验证：
 * 1. 分析初稿，识别缺口
 * 2. 生成 3-5 题补全包
 * 3. 仍然优先客观题
 */

describe('P0-6: 问题包补全', () => {
  describe('任务 6.1: 缺口分析', () => {
    it('识别缺失的关键人物', () => {
      const memoir = {
        title: '测试回忆',
        sections: [
          {
            stage: '童年',
            title: '成长与童年',
            content: '我在农村长大，每天都在田里玩。',
          },
        ],
        wordCount: 20,
        generatedAt: new Date().toISOString(),
      };

      const answers = [
        {
          id: '1',
          questionContent: '您在哪里长大？',
          content: '我在农村长大，每天都在田里玩。',
          topicTag: null,
          stageTag: '童年',
          narrativeRole: 'daily_life',
        },
      ];

      const analysis = analyzeGaps(memoir, answers);

      expect(analysis.gaps).toContain('missing_people');
      expect(analysis.completionQuestions.length).toBeGreaterThan(0);
      expect(analysis.completionQuestions.some((q) => q.type === 'missing_people')).toBe(true);
    });

    it('识别缺失的重要地点', () => {
      const memoir = {
        title: '测试回忆',
        sections: [
          {
            stage: '工作',
            title: '工作与本事',
            content: '我在工厂工作了 30 年，每天都很忙。',
          },
        ],
        wordCount: 20,
        generatedAt: new Date().toISOString(),
      };

      const answers = [
        {
          id: '1',
          questionContent: '您的工作是什么？',
          content: '我在工厂工作了 30 年，每天都很忙。',
          topicTag: null,
          stageTag: '工作',
          narrativeRole: 'daily_life',
        },
      ];

      const analysis = analyzeGaps(memoir, answers);

      expect(analysis.gaps).toContain('missing_places');
      expect(analysis.completionQuestions.some((q) => q.type === 'missing_places')).toBe(true);
    });

    it('识别缺失的人生转折', () => {
      const memoir = {
        title: '测试回忆',
        sections: [
          {
            stage: '童年',
            title: '成长与童年',
            content: '我在农村长大，有一个快乐的童年。',
          },
          {
            stage: '工作',
            title: '工作与本事',
            content: '我在工厂工作了很多年。',
          },
        ],
        wordCount: 40,
        generatedAt: new Date().toISOString(),
      };

      const answers = [
        {
          id: '1',
          questionContent: '您在哪里长大？',
          content: '我在农村长大，有一个快乐的童年。',
          topicTag: null,
          stageTag: '童年',
          narrativeRole: 'daily_life',
        },
        {
          id: '2',
          questionContent: '您的工作是什么？',
          content: '我在工厂工作了很多年。',
          topicTag: null,
          stageTag: '工作',
          narrativeRole: 'daily_life',
        },
      ];

      const analysis = analyzeGaps(memoir, answers);

      expect(analysis.gaps).toContain('missing_transitions');
      expect(analysis.completionQuestions.some((q) => q.type === 'missing_transitions')).toBe(true);
    });

    it('识别缺失的时代背景', () => {
      const memoir = {
        title: '测试回忆',
        sections: [
          {
            stage: '工作',
            title: '工作与本事',
            content: '我在工厂工作，做了很多事情。',
          },
        ],
        wordCount: 20,
        generatedAt: new Date().toISOString(),
      };

      const answers = [
        {
          id: '1',
          questionContent: '您的工作是什么？',
          content: '我在工厂工作，做了很多事情。',
          topicTag: null,
          stageTag: '工作',
          narrativeRole: 'daily_life',
        },
      ];

      const analysis = analyzeGaps(memoir, answers);

      expect(analysis.gaps).toContain('missing_era_context');
      expect(analysis.completionQuestions.some((q) => q.type === 'missing_era_context')).toBe(true);
    });

    it('识别缺失的日常气质', () => {
      const memoir = {
        title: '测试回忆',
        sections: [
          {
            stage: '童年',
            title: '成长与童年',
            content: '我的父亲是一位教师，母亲是一位医生。',
          },
        ],
        wordCount: 20,
        generatedAt: new Date().toISOString(),
      };

      const answers = [
        {
          id: '1',
          questionContent: '您的父母是做什么的？',
          content: '我的父亲是一位教师，母亲是一位医生。',
          topicTag: null,
          stageTag: '童年',
          narrativeRole: 'relationship',
        },
      ];

      const analysis = analyzeGaps(memoir, answers);

      expect(analysis.gaps).toContain('missing_daily_life');
      expect(analysis.completionQuestions.some((q) => q.type === 'missing_daily_life')).toBe(true);
    });
  });

  describe('任务 6.2: 生成补全问题包', () => {
    it('生成 3-5 题补全包', () => {
      const memoir = {
        title: '测试回忆',
        sections: [
          {
            stage: '童年',
            title: '成长与童年',
            content: '我在农村长大。',
          },
        ],
        wordCount: 10,
        generatedAt: new Date().toISOString(),
      };

      const answers = [
        {
          id: '1',
          questionContent: '您在哪里长大？',
          content: '我在农村长大。',
          topicTag: null,
          stageTag: '童年',
          narrativeRole: 'daily_life',
        },
      ];

      const analysis = analyzeGaps(memoir, answers);

      expect(analysis.completionQuestions.length).toBeGreaterThanOrEqual(1);
      expect(analysis.completionQuestions.length).toBeLessThanOrEqual(5);
    });

    it('补全问题包包含问题内容和提示', () => {
      const memoir = {
        title: '测试回忆',
        sections: [
          {
            stage: '童年',
            title: '成长与童年',
            content: '我在农村长大。',
          },
        ],
        wordCount: 10,
        generatedAt: new Date().toISOString(),
      };

      const answers = [
        {
          id: '1',
          questionContent: '您在哪里长大？',
          content: '我在农村长大。',
          topicTag: null,
          stageTag: '童年',
          narrativeRole: 'daily_life',
        },
      ];

      const analysis = analyzeGaps(memoir, answers);

      for (const question of analysis.completionQuestions) {
        expect(question.question).toBeTruthy();
        expect(question.hint).toBeTruthy();
        expect(question.type).toBeTruthy();
        expect(question.priority).toBeGreaterThan(0);
      }
    });

    it('补全问题按优先级排序', () => {
      const memoir = {
        title: '测试回忆',
        sections: [
          {
            stage: '童年',
            title: '成长与童年',
            content: '我在农村长大。',
          },
        ],
        wordCount: 10,
        generatedAt: new Date().toISOString(),
      };

      const answers = [
        {
          id: '1',
          questionContent: '您在哪里长大？',
          content: '我在农村长大。',
          topicTag: null,
          stageTag: '童年',
          narrativeRole: 'daily_life',
        },
      ];

      const analysis = analyzeGaps(memoir, answers);

      for (let i = 1; i < analysis.completionQuestions.length; i++) {
        expect(analysis.completionQuestions[i].priority).toBeGreaterThanOrEqual(
          analysis.completionQuestions[i - 1].priority
        );
      }
    });
  });

  describe('任务 6.3: 缺口总结', () => {
    it('生成缺口总结', () => {
      const memoir = {
        title: '测试回忆',
        sections: [
          {
            stage: '童年',
            title: '成长与童年',
            content: '我在农村长大。',
          },
        ],
        wordCount: 10,
        generatedAt: new Date().toISOString(),
      };

      const answers = [
        {
          id: '1',
          questionContent: '您在哪里长大？',
          content: '我在农村长大。',
          topicTag: null,
          stageTag: '童年',
          narrativeRole: 'daily_life',
        },
      ];

      const analysis = analyzeGaps(memoir, answers);

      expect(analysis.summary).toBeTruthy();
      expect(analysis.summary.length).toBeGreaterThan(0);
    });

    it('内容完整时显示完整提示', () => {
      const memoir = {
        title: '测试回忆',
        sections: [
          {
            stage: '童年',
            title: '成长与童年',
            content:
              '我的父亲是一位教师，母亲是一位医生。我在北京长大，有一个快乐的童年。我最记得的是和父亲一起去公园的日子。',
          },
          {
            stage: '工作',
            title: '工作与本事',
            content:
              '我在 1980 年代改革开放时期进入工厂工作。那时候的日子很充实，我和同事们一起建设国家。',
          },
        ],
        wordCount: 100,
        generatedAt: new Date().toISOString(),
      };

      const answers = [
        {
          id: '1',
          questionContent: '您的父母是做什么的？',
          content: '我的父亲是一位教师，母亲是一位医生。',
          topicTag: null,
          stageTag: '童年',
          narrativeRole: 'relationship',
        },
        {
          id: '2',
          questionContent: '您在哪里长大？',
          content: '我在北京长大，有一个快乐的童年。',
          topicTag: null,
          stageTag: '童年',
          narrativeRole: 'daily_life',
        },
        {
          id: '3',
          questionContent: '您最记得的童年时光是什么？',
          content: '我最记得的是和父亲一起去公园的日子。',
          topicTag: null,
          stageTag: '童年',
          narrativeRole: 'representative_event',
        },
        {
          id: '4',
          questionContent: '您的工作是什么？',
          content: '我在 1980 年代改革开放时期进入工厂工作。',
          topicTag: null,
          stageTag: '工作',
          narrativeRole: 'era_context',
        },
        {
          id: '5',
          questionContent: '您工作时的日常是什么样的？',
          content: '那时候的日子很充实，我和同事们一起建设国家。',
          topicTag: null,
          stageTag: '工作',
          narrativeRole: 'daily_life',
        },
      ];

      const analysis = analyzeGaps(memoir, answers);

      expect(analysis.summary).toContain('完整');
    });
  });

  describe('任务 6.4: 完整流程', () => {
    it('从初稿到补全包的完整流程', () => {
      const memoir = {
        title: '测试回忆',
        sections: [
          {
            stage: '童年',
            title: '成长与童年',
            content: '我在农村长大。',
          },
        ],
        wordCount: 10,
        generatedAt: new Date().toISOString(),
      };

      const answers = [
        {
          id: '1',
          questionContent: '您在哪里长大？',
          content: '我在农村长大。',
          topicTag: null,
          stageTag: '童年',
          narrativeRole: 'daily_life',
        },
      ];

      const analysis = analyzeGaps(memoir, answers);

      // 验证缺口被识别
      expect(analysis.gaps.length).toBeGreaterThan(0);

      // 验证补全问题被生成
      expect(analysis.completionQuestions.length).toBeGreaterThan(0);
      expect(analysis.completionQuestions.length).toBeLessThanOrEqual(5);

      // 验证总结被生成
      expect(analysis.summary).toBeTruthy();

      // 验证每个补全问题都有完整的信息
      for (const question of analysis.completionQuestions) {
        expect(question.question).toBeTruthy();
        expect(question.hint).toBeTruthy();
        expect(question.type).toBeTruthy();
        expect(analysis.gaps).toContain(question.type);
      }
    });
  });
});
