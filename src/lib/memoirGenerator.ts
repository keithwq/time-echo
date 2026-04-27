/**
 * 回忆录生成器
 * 将访谈回答按人生阶段聚合，生成人物小记初稿
 * 优先级：人物底色 → 关键关系 → 日常气质 → 回望感 → 代表事件
 */

interface InterviewAnswer {
  id: string;
  questionContent: string;
  content: string;
  topicTag: string | null;
  stageTag?: string;
  createdAt: Date;
  narrativeRole?: string;
  nestedAnswers?: Record<string, Record<string, string>>;
}

interface MemoirSection {
  stage: string;
  title: string;
  content: string;
}

interface Memoir {
  title: string;
  sections: MemoirSection[];
  wordCount: number;
  generatedAt: string;
}

interface GenerationResult {
  memoir: Memoir;
  markdown: string;
  unusedAnswers: Array<{
    id: string;
    questionContent: string;
    contentPreview: string;
  }>;
}

// 人生阶段优先级和标题映射
const STAGE_PRIORITY = ['童年', '求学', '工作', '婚姻', '家庭', '迁徙', '时代记忆', '晚年'] as const;

const STAGE_TITLES: Record<string, string> = {
  童年: '成长与童年',
  求学: '求学与初入社会',
  工作: '工作与本事',
  婚姻: '婚姻与家庭',
  家庭: '婚姻与家庭',
  迁徙: '人生中的重要人和地方',
  时代记忆: '所处时代的日常',
  晚年: '人生中的重要人和地方',
};

// 叙述角色优先级（在每个阶段内，高优先级内容优先入稿）
const NARRATIVE_ROLE_PRIORITY = [
  'profile',
  'relationship',
  'daily_life',
  'reflection',
  'representative_event',
  'era_context',
];

/**
 * 展平嵌套答案树
 * 将嵌套答案递归展平为一维数组，与主线答案合并
 */
function flattenNestedAnswers(answers: InterviewAnswer[]): InterviewAnswer[] {
  const flattened: InterviewAnswer[] = [];

  for (const answer of answers) {
    flattened.push(answer);

    // 处理嵌套答案
    if (answer.nestedAnswers && typeof answer.nestedAnswers === 'object') {
      const nested = flattenNestedAnswersRecursive(
        answer.nestedAnswers,
        answer.stageTag || 'unknown',
        answer.id
      );
      flattened.push(...nested);
    }
  }

  return flattened;
}

/**
 * 递归展平嵌套答案对象
 */
function flattenNestedAnswersRecursive(
  nestedObj: any,
  parentStageTag: string,
  parentAnswerId: string
): InterviewAnswer[] {
  const result: InterviewAnswer[] = [];

  for (const [_optionValue, nestedAnswers] of Object.entries(nestedObj)) {
    if (typeof nestedAnswers === 'object' && nestedAnswers !== null) {
      for (const [nestedQuestionId, answer] of Object.entries(nestedAnswers)) {
        result.push({
          id: `${parentAnswerId}_nested_${nestedQuestionId}`,
          questionContent: `[追问] ${nestedQuestionId}`,
          content: String(answer),
          topicTag: null,
          stageTag: parentStageTag,
          createdAt: new Date(),
          narrativeRole: 'daily_life',
        });
      }
    }
  }

  return result;
}

/**
 * 生成回忆录及未入稿素材
 * 按人生阶段聚合，每个阶段内按叙述角色优先级排序
 */
export function generateMemoirWithUnused(
  answers: InterviewAnswer[],
  userName: string = '您'
): GenerationResult {
  // 先展平嵌套答案
  const flattenedAnswers = flattenNestedAnswers(answers);

  // 按人生阶段分组
  const groupedByStage = groupAnswersByStage(flattenedAnswers);

  // 按阶段优先级生成章节，同时追踪字数
  const sections: MemoirSection[] = [];
  const usedAnswerIds = new Set<string>();
  let totalWordCount = 0;
  const MAX_WORDS = 2000;

  // 合并相同标题的阶段（如婚姻和家庭都映射到"婚姻与家庭"）
  const stagesByTitle = new Map<string, string[]>();
  for (const stage of STAGE_PRIORITY) {
    const title = STAGE_TITLES[stage] || stage;
    if (!stagesByTitle.has(title)) {
      stagesByTitle.set(title, []);
    }
    stagesByTitle.get(title)!.push(stage);
  }

  // 按标题优先级生成章节（保持阶段顺序）
  const titleOrder: string[] = [];
  for (const stage of STAGE_PRIORITY) {
    const title = STAGE_TITLES[stage];
    if (!titleOrder.includes(title)) {
      titleOrder.push(title);
    }
  }

  for (const title of titleOrder) {
    const stages = stagesByTitle.get(title) || [];
    const stageAnswers: InterviewAnswer[] = [];

    // 收集该标题下所有阶段的回答
    for (const stage of stages) {
      stageAnswers.push(...(groupedByStage.get(stage) || []));
    }

    if (stageAnswers.length === 0) continue;

    // 在该阶段内，按叙述角色优先级排序
    const sortedAnswers = sortAnswersByNarrativeRole(stageAnswers);

    let sectionContent = '';
    for (const answer of sortedAnswers) {
      const answerWords = answer.content.length;

      // 检查是否超过字数限制
      if (totalWordCount + answerWords > MAX_WORDS) {
        // 如果还未达到基本内容，允许超出一点
        if (totalWordCount < 800) {
          const content = formatAnswerAsNarrative(answer);
          sectionContent += (sectionContent ? '\n\n' : '') + content;
          usedAnswerIds.add(answer.id);
          totalWordCount += answerWords;
          break;
        } else {
          // 超过限制，不再添加
          continue;
        }
      }

      const content = formatAnswerAsNarrative(answer);
      sectionContent += (sectionContent ? '\n\n' : '') + content;
      usedAnswerIds.add(answer.id);
      totalWordCount += answerWords;

      if (totalWordCount >= MAX_WORDS) {
        break;
      }
    }

    if (sectionContent) {
      sections.push({
        stage: stages[0],
        title,
        content: sectionContent,
      });
    }

    if (totalWordCount >= MAX_WORDS) {
      break;
    }
  }

  // 收集未入稿的回答
  const unusedAnswers = answers
    .filter((a) => !usedAnswerIds.has(a.id))
    .map((a) => ({
      id: a.id,
      questionContent: a.questionContent,
      contentPreview: a.content.substring(0, 50),
    }));

  const memoir: Memoir = {
    title: `${userName}的答案`,
    sections,
    wordCount: totalWordCount,
    generatedAt: new Date().toISOString(),
  };

  return {
    memoir,
    markdown: memoirToMarkdown(memoir),
    unusedAnswers,
  };
}

/**
 * 将 topicTag 映射到人生阶段
 */
function mapTopicToStage(topicTag?: string | null): string {
  if (!topicTag) return 'unknown';

  // 直接匹配
  if (STAGE_PRIORITY.includes(topicTag as any)) {
    return topicTag;
  }

  // 关键词映射
  const stageMapping: Record<string, string> = {
    '童年': '童年',
    '幼年': '童年',
    '小时候': '童年',
    '成长': '童年',
    '求学': '求学',
    '上学': '求学',
    '学校': '求学',
    '教育': '求学',
    '学习': '求学',
    '工作': '工作',
    '职业': '工作',
    '事业': '工作',
    '工厂': '工作',
    '单位': '工作',
    '婚姻': '婚姻',
    '结婚': '婚姻',
    '伴侣': '婚姻',
    '配偶': '婚姻',
    '家庭': '家庭',
    '子女': '家庭',
    '孩子': '家庭',
    '父母': '家庭',
    '亲人': '家庭',
    '迁徙': '迁徙',
    '搬家': '迁徙',
    '迁移': '迁徙',
    '进城': '迁徙',
    '下乡': '迁徙',
    '时代': '时代记忆',
    '社会': '时代记忆',
    '历史': '时代记忆',
    '晚年': '晚年',
    '退休': '晚年',
    '现在': '晚年',
    '人生': '晚年',
  };

  for (const [keyword, stage] of Object.entries(stageMapping)) {
    if (topicTag.includes(keyword)) {
      return stage;
    }
  }

  return 'unknown';
}

/**
 * 按人生阶段分组回答
 */
function groupAnswersByStage(
  answers: InterviewAnswer[]
): Map<string, InterviewAnswer[]> {
  const grouped = new Map<string, InterviewAnswer[]>();

  for (const answer of answers) {
    // 使用传入的 stageTag，或尝试从 topicTag 推断
    const stage = answer.stageTag || mapTopicToStage(answer.topicTag) || 'unknown';

    if (!grouped.has(stage)) {
      grouped.set(stage, []);
    }

    grouped.get(stage)!.push(answer);
  }

  return grouped;
}

/**
 * 按叙述角色优先级排序回答
 */
function sortAnswersByNarrativeRole(answers: InterviewAnswer[]): InterviewAnswer[] {
  return answers.sort((a, b) => {
    const roleA = a.narrativeRole || 'representative_event';
    const roleB = b.narrativeRole || 'representative_event';
    const priorityA = NARRATIVE_ROLE_PRIORITY.indexOf(roleA);
    const priorityB = NARRATIVE_ROLE_PRIORITY.indexOf(roleB);
    return priorityA - priorityB;
  });
}

/**
 * 将单条回答格式化为叙述段落
 */
function formatAnswerAsNarrative(answer: InterviewAnswer): string {
  // 去掉问题标题，只保留回答内容
  const content = answer.content.trim();
  return content;
}

/**
 * 将回忆录转换为 Markdown 文本
 */
export function memoirToMarkdown(memoir: Memoir): string {
  let markdown = `# ${memoir.title}\n\n`;
  markdown += `> 生成时间：${new Date(memoir.generatedAt).toLocaleString('zh-CN')} | 字数：${memoir.wordCount}\n\n`;
  markdown += `---\n\n`;

  for (const section of memoir.sections) {
    markdown += `## ${section.title}\n\n`;
    markdown += `${section.content}\n\n`;
    markdown += `---\n\n`;
  }

  return markdown;
}

/**
 * 向后兼容：原有的 generateMemoir 函数
 */
export function generateMemoir(
  answers: InterviewAnswer[],
  userName: string = '您'
) {
  const result = generateMemoirWithUnused(answers, userName);
  return result.memoir;
}
