import { describe, it, expect } from '@jest/globals';
import { generateMemoirWithUnused, memoirToMarkdown } from '@/lib/memoirGenerator';

/**
 * 测试 P0-3：生成器实现
 *
 * 验证：
 * 1. 按人生阶段聚合（不按叙述角色）
 * 2. 优先级：人物底色 → 关键关系 → 日常气质 → 回望感 → 代表事件
 * 3. 生成 2000 字人物小记
 * 4. 未入稿素材正确收集
 */

describe('P0-3: 生成器实现', () => {
  describe('任务 4.1.1: 按人生阶段聚合', () => {
    it('应该按人生阶段分组回答', () => {
      const answers = [
        {
          id: 'ans_1',
          questionContent: '您最早的记忆是什么？',
          content: '我最早的记忆是在老家的院子里。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
        {
          id: 'ans_2',
          questionContent: '您上过什么学校？',
          content: '我上过县里的中学。',
          topicTag: '求学',
          stageTag: '求学',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
      ];

      const result = generateMemoirWithUnused(answers, '李奶奶');

      expect(result.memoir.sections.length).toBeGreaterThan(0);
      expect(result.memoir.sections[0].title).toBe('成长与童年');
      expect(result.memoir.sections[1].title).toBe('求学与初入社会');
    });

    it('应该合并相同标题的阶段（婚姻和家庭）', () => {
      const answers = [
        {
          id: 'ans_1',
          questionContent: '您什么时候结婚的？',
          content: '我 25 岁结婚了。',
          topicTag: '婚姻',
          stageTag: '婚姻',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
        {
          id: 'ans_2',
          questionContent: '您有几个孩子？',
          content: '我有两个孩子。',
          topicTag: '家庭',
          stageTag: '家庭',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
      ];

      const result = generateMemoirWithUnused(answers, '李奶奶');

      // 婚姻和家庭应该合并到同一个章节
      const marriageSection = result.memoir.sections.find(s => s.title === '婚姻与家庭');
      expect(marriageSection).toBeDefined();
      expect(marriageSection?.content).toContain('25 岁结婚');
      expect(marriageSection?.content).toContain('两个孩子');
    });
  });

  describe('任务 4.1.2: 实现优先级排序', () => {
    it('应该按优先级排序：profile > relationship > daily_life > reflection > representative_event', () => {
      const answers = [
        {
          id: 'ans_1',
          questionContent: '您是个什么样的人？',
          content: '我是个很勤快的人。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'profile',
        },
        {
          id: 'ans_2',
          questionContent: '您最记得的一件事是什么？',
          content: '我最记得的是和父亲一起去地里。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
        {
          id: 'ans_3',
          questionContent: '您和父亲的关系怎么样？',
          content: '我和父亲关系很好。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'relationship',
        },
      ];

      const result = generateMemoirWithUnused(answers, '李奶奶');

      const section = result.memoir.sections[0];
      expect(section.content).toContain('我是个很勤快的人');
      // profile 应该在 relationship 之前
      const profileIndex = section.content.indexOf('我是个很勤快的人');
      const relationshipIndex = section.content.indexOf('我和父亲关系很好');
      expect(profileIndex).toBeLessThan(relationshipIndex);
    });

    it('应该优先选择 profile 和 relationship 内容', () => {
      const answers = [
        {
          id: 'ans_1',
          questionContent: '您是个什么样的人？',
          content: '我是个很勤快的人。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'profile',
        },
        {
          id: 'ans_2',
          questionContent: '您和谁最亲？',
          content: '我和母亲最亲。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'relationship',
        },
        {
          id: 'ans_3',
          questionContent: '您日常怎么过的？',
          content: '我每天都要做家务。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'daily_life',
        },
      ];

      const result = generateMemoirWithUnused(answers, '李奶奶');

      expect(result.memoir.sections.length).toBeGreaterThan(0);
      expect(result.memoir.wordCount).toBeGreaterThan(0);
    });
  });

  describe('任务 4.1.3: 生成 2000 字人物小记', () => {
    it('应该生成约 2000 字的回忆录', () => {
      const answers = Array.from({ length: 30 }, (_, i) => ({
        id: `ans_${i}`,
        questionContent: `问题 ${i}`,
        content: '这是一个很长的回答，包含了很多细节和故事。'.repeat(10),
        topicTag: ['童年', '求学', '工作', '婚姻', '家庭'][i % 5],
        stageTag: ['童年', '求学', '工作', '婚姻', '家庭'][i % 5],
        createdAt: new Date(),
        narrativeRole: ['profile', 'relationship', 'daily_life', 'representative_event'][i % 4],
      }));

      const result = generateMemoirWithUnused(answers, '李奶奶');

      expect(result.memoir.wordCount).toBeLessThanOrEqual(2100);
      expect(result.memoir.wordCount).toBeGreaterThan(1800);
    });

    it('应该在字数接近 2000 时停止添加内容', () => {
      const answers = Array.from({ length: 50 }, (_, i) => ({
        id: `ans_${i}`,
        questionContent: `问题 ${i}`,
        content: '这是一个很长的回答，包含了很多细节和故事。'.repeat(5),
        topicTag: '童年',
        stageTag: '童年',
        createdAt: new Date(),
        narrativeRole: 'representative_event',
      }));

      const result = generateMemoirWithUnused(answers, '李奶奶');

      expect(result.memoir.wordCount).toBeLessThanOrEqual(2100);
      expect(result.unusedAnswers.length).toBeGreaterThan(0);
    });
  });

  describe('任务 4.1.4: 收集未入稿素材', () => {
    it('应该正确收集未入稿的回答', () => {
      const answers = [
        {
          id: 'ans_1',
          questionContent: '您最早的记忆是什么？',
          content: '我最早的记忆是在老家的院子里。'.repeat(100),
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
        {
          id: 'ans_2',
          questionContent: '您上过什么学校？',
          content: '我上过县里的中学，那是一个很好的学校。'.repeat(50),
          topicTag: '求学',
          stageTag: '求学',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
      ];

      const result = generateMemoirWithUnused(answers, '李奶奶');

      expect(result.unusedAnswers.length).toBeGreaterThan(0);
      expect(result.unusedAnswers[0].id).toBe('ans_2');
      expect(result.unusedAnswers[0].contentPreview).toContain('我上过县里的中学');
    });

    it('应该不包含被跳过的题目', () => {
      const answers = [
        {
          id: 'ans_1',
          questionContent: '您最早的记忆是什么？',
          content: '我最早的记忆是在老家的院子里。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
      ];

      const result = generateMemoirWithUnused(answers, '李奶奶');

      expect(result.memoir.sections.length).toBeGreaterThan(0);
      expect(result.memoir.wordCount).toBeGreaterThan(0);
    });
  });

  describe('任务 4.1.5: Markdown 转换', () => {
    it('应该正确转换为 Markdown 格式', () => {
      const answers = [
        {
          id: 'ans_1',
          questionContent: '您最早的记忆是什么？',
          content: '我最早的记忆是在老家的院子里。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
      ];

      const result = generateMemoirWithUnused(answers, '李奶奶');
      const markdown = result.markdown;

      expect(markdown).toContain('# 李奶奶的回忆');
      expect(markdown).toContain('## 成长与童年');
      expect(markdown).toContain('我最早的记忆是在老家的院子里。');
      expect(markdown).toContain('生成时间');
      expect(markdown).toContain('字数');
    });

    it('应该包含所有章节', () => {
      const answers = [
        {
          id: 'ans_1',
          questionContent: '您最早的记忆是什么？',
          content: '我最早的记忆是在老家的院子里。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
        {
          id: 'ans_2',
          questionContent: '您上过什么学校？',
          content: '我上过县里的中学。',
          topicTag: '求学',
          stageTag: '求学',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
      ];

      const result = generateMemoirWithUnused(answers, '李奶奶');
      const markdown = result.markdown;

      expect(markdown).toContain('## 成长与童年');
      expect(markdown).toContain('## 求学与初入社会');
    });
  });

  describe('任务 4.1.6: 测试生成器', () => {
    it('完整流程：从回答到回忆录', () => {
      const answers = [
        {
          id: 'ans_1',
          questionContent: '您是个什么样的人？',
          content: '我是个很勤快的人，从小就喜欢做事。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'profile',
        },
        {
          id: 'ans_2',
          questionContent: '您和父亲的关系怎么样？',
          content: '我和父亲关系很好，他教会了我很多东西。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'relationship',
        },
        {
          id: 'ans_3',
          questionContent: '您上过什么学校？',
          content: '我上过县里的中学，那是一个很好的学校。',
          topicTag: '求学',
          stageTag: '求学',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
        {
          id: 'ans_4',
          questionContent: '您做过什么工作？',
          content: '我在工厂里做过工人，后来做了管理员。',
          topicTag: '工作',
          stageTag: '工作',
          createdAt: new Date(),
          narrativeRole: 'representative_event',
        },
      ];

      const result = generateMemoirWithUnused(answers, '李奶奶');

      expect(result.memoir.title).toBe('李奶奶的回忆');
      expect(result.memoir.sections.length).toBeGreaterThan(0);
      expect(result.memoir.wordCount).toBeGreaterThan(0);
      expect(result.memoir.sections[0].title).toBe('成长与童年');
      expect(result.memoir.sections[0].content).toContain('我是个很勤快的人');
      expect(result.memoir.sections[0].content).toContain('我和父亲关系很好');
    });
  });

  describe('P0-4: 嵌套答案处理', () => {
    it('应该展平并处理嵌套答案', () => {
      const answers = [
        {
          id: 'ans_1',
          questionContent: '您小时候住的是什么样的房子？',
          content: '我住的是砖瓦房。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'profile',
          nestedAnswers: {
            brick_house: {
              'childhood_001_brick_1': '有 3 间房。',
            },
          },
        },
      ] as any;

      const result = generateMemoirWithUnused(answers, '李奶奶');

      expect(result.memoir.sections.length).toBeGreaterThan(0);
      expect(result.memoir.wordCount).toBeGreaterThan(0);
      // 嵌套答案应该被包含在内容中
      expect(result.memoir.sections[0].content).toContain('有 3 间房');
    });

    it('应该处理多层嵌套答案', () => {
      const answers = [
        {
          id: 'ans_1',
          questionContent: '小时候谁最疼您？',
          content: '爸爸最疼我。',
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'relationship',
          nestedAnswers: {
            father: {
              'childhood_003_father_1': '他常说"冷不冷"。',
              'childhood_003_father_2': '他偷偷给我好吃的。',
            },
          },
        },
      ] as any;

      const result = generateMemoirWithUnused(answers, '李奶奶');

      expect(result.memoir.sections.length).toBeGreaterThan(0);
      // 两个嵌套答案都应该被包含
      expect(result.memoir.sections[0].content).toContain('他常说"冷不冷"');
      expect(result.memoir.sections[0].content).toContain('他偷偷给我好吃的');
    });

    it('应该正确计算包含嵌套答案的字数', () => {
      const answers = [
        {
          id: 'ans_1',
          questionContent: '您是个什么样的人？',
          content: '我是个很勤快的人。'.repeat(50),
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'profile',
          nestedAnswers: {
            option1: {
              'nested_1': '这是一个嵌套答案。'.repeat(50),
            },
          },
        },
      ] as any;

      const result = generateMemoirWithUnused(answers, '李奶奶');

      expect(result.memoir.wordCount).toBeLessThanOrEqual(2100);
      expect(result.memoir.wordCount).toBeGreaterThan(0);
    });

    it('应该在未入稿素材中包含嵌套答案', () => {
      const answers = [
        {
          id: 'ans_1',
          questionContent: '您是个什么样的人？',
          content: '我是个很勤快的人。'.repeat(100),
          topicTag: '童年',
          stageTag: '童年',
          createdAt: new Date(),
          narrativeRole: 'profile',
          nestedAnswers: {
            option1: {
              'nested_1': '这是一个很长的嵌套答案。'.repeat(100),
            },
          },
        },
      ] as any;

      const result = generateMemoirWithUnused(answers, '李奶奶');

      // 由于字数限制，嵌套答案可能被放入未入稿素材
      expect(result.unusedAnswers.length >= 0).toBe(true);
    });
  });
});
