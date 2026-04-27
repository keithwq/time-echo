import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { questionTemplates, getQuestionById, type QuestionTemplate } from '@/data/question-templates';
import { rewriteQuestion, generateNewQuestion } from '@/lib/aiUtils';

type SessionAnswer = {
  questionId: string;
  topicTag: string | null;
  content: string;
  selectedOption: string | null;
  createdAt: Date;
};

type QuestionResponse = {
  questionId: string;
  content: string;
  hint?: string;
  options: QuestionTemplate['options'];
  source: 'local' | 'rewritten' | 'generated';
  mode: 'dig_deeper' | 'extend_topic' | 'switch_topic' | 'generated';
  answerMode: QuestionTemplate['answerMode'];
  minChoices?: number;
  maxChoices?: number;
  allowTextDetails?: boolean;
  responseCardinality?: QuestionTemplate['responseCardinality'];
  suggestedAnswerCount?: number;
  stageTag: string;
  narrativeRole?: string;
  materialType?: string;
  shouldSuggestPreview?: boolean;
  originalContent?: string;
  isAdaptedForContext?: boolean;
};

const STAGE_PRIORITY = ['童年', '年轻时候', '成家与亲近的人', '朋友与邻里', '住过的地方', '时代与大事', '现在的日子', '一生回顾'] as const;

// 定义相邻主题关系
const ADJACENT_STAGES: Record<(typeof STAGE_PRIORITY)[number], (typeof STAGE_PRIORITY)[number][]> = {
  童年: ['年轻时候'],
  年轻时候: ['童年', '成家与亲近的人'],
  成家与亲近的人: ['年轻时候', '朋友与邻里'],
  朋友与邻里: ['成家与亲近的人', '住过的地方'],
  住过的地方: ['朋友与邻里', '时代与大事'],
  时代与大事: ['住过的地方', '现在的日子'],
  现在的日子: ['时代与大事', '一生回顾'],
  一生回顾: ['现在的日子'],
};

const SKELETON_TARGETS: Record<(typeof STAGE_PRIORITY)[number], number> = {
  童年: 5,
  年轻时候: 4,
  成家与亲近的人: 5,
  朋友与邻里: 2,
  住过的地方: 2,
  时代与大事: 2,
  现在的日子: 2,
  一生回顾: 3,
};

// 年龄相关的计算函数
function getBirthDecade(age: number): string {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;

  if (birthYear < 1940) return '1930s';
  if (birthYear < 1950) return '1940s';
  if (birthYear < 1960) return '1950s';
  if (birthYear < 1970) return '1960s';
  if (birthYear < 1980) return '1970s';
  if (birthYear < 1990) return '1980s';
  return '1990s+';
}

function isRetired(age: number): boolean {
  return age >= 60;
}

function hasExperiencedEvent(age: number, eventPeriod: string): boolean {
  const birthDecade = getBirthDecade(age);

  const eventMapping: Record<string, string[]> = {
    '文革': ['1940s', '1950s', '1960s', '1970s'],
    '上山下乡': ['1940s', '1950s', '1960s'],
    '改革开放': ['1940s', '1950s', '1960s', '1970s', '1980s'],
    '下岗': ['1950s', '1960s', '1970s'],
  };

  return eventMapping[eventPeriod]?.includes(birthDecade) || false;
}

// 只有这些选项明确表示用户想要深挖
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

// 这些选项表示用户不想深挖（说不清、记不清等）
const NO_DEEP_DIVE_VALUES = new Set([
  'unclear',
  'forgotten',
  'inconvenient',
  'not_applicable',
  'skip',
]);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId, sessionId } = req.body;

  console.log('[Next API] 收到请求:', { userId, sessionId });

  if (!userId || !sessionId) {
    console.log('[Next API] 缺少必需参数');
    return res.status(400).json({
      success: false,
      error: 'userId and sessionId are required',
    });
  }

  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          select: {
            questionId: true,
            topicTag: true,
            content: true,
            selectedOption: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // 获取用户年龄
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { age: true },
    });

    const userAge = user?.age || undefined;

    if (session.isCompleted) {
      return res.status(400).json({
        success: false,
        error: '访谈已完成',
      });
    }

    // 检查是否已达到基础题位上限
    const hasReachedBaseLimit = session.baseSlotsUsed >= session.baseSlotsTotal;
    if (hasReachedBaseLimit && !session.isInExpansionMode) {
      // 基础访谈已完成，提示用户生成或开启扩展包
      return res.status(200).json({
        success: true,
        data: ensureCompleteResponse({
          questionId: 'BASE_COMPLETED',
          content: '基础访谈已完成。您可以生成当前版本的回忆录，或开启扩展包继续补充。',
          source: 'local',
          mode: 'switch_topic',
          answerMode: 'text',
          stageTag: '一生回顾',
          shouldSuggestPreview: true,
          isBaseCompleted: true,
          baseSlotsUsed: session.baseSlotsUsed,
          baseSlotsTotal: session.baseSlotsTotal,
          skippedCount: session.skippedCount,
        }),
      });
    }

    const answers = session.answers as SessionAnswer[];
    const answeredQuestionIds = answers.map((answer) => answer.questionId);
    const skippedQuestionIds = session.skippedQuestionIds || [];

    // 构建排除集合：已回答题 + 已跳过题 + 深挖题的原始题
    const excludedIds = new Set([...answeredQuestionIds, ...skippedQuestionIds]);

    console.log('[Next] 已回答题目数:', answeredQuestionIds.length);
    console.log('[Next] 已跳过题目数:', skippedQuestionIds.length);
    console.log('[Next] 已跳过题目列表:', skippedQuestionIds);
    console.log('[Next] 排除集合大小:', excludedIds.size);

    // 添加深挖题的原始题到排除集合
    // 深挖题 ID 格式：deepdive_${originalQuestionId}
    answeredQuestionIds.forEach((questionId) => {
      if (questionId.startsWith('deepdive_')) {
        const originalQuestionId = questionId.replace('deepdive_', '');
        excludedIds.add(originalQuestionId);
      }
    });
    const stageCounts = getStageCounts(answeredQuestionIds);
    const lastAnswer = answers[0] ?? null;

    const shouldSuggestPreview = calculateShouldSuggestPreview(
      answeredQuestionIds,
      stageCounts
    );

    if (lastAnswer) {
      const deepDiveQuestion = getDeepDiveQuestion(lastAnswer, excludedIds, answers);

      if (deepDiveQuestion) {
        return res.status(200).json({
          success: true,
          data: {
            ...toQuestionResponse(deepDiveQuestion, 'dig_deeper'),
            baseSlotsUsed: session.baseSlotsUsed,
            baseSlotsTotal: session.baseSlotsTotal,
            skippedCount: session.skippedCount,
            shouldSuggestPreview,
          },
        });
      }
    }

    // 获取最后一个问题的主题标签，用于话题切换优先级
    let lastQuestionStage: string | undefined;
    if (lastAnswer) {
      const lastQuestion = getQuestionById(lastAnswer.questionId);
      if (lastQuestion) {
        lastQuestionStage = lastQuestion.stageTag;
      }
    }

    // 扩展阶段使用三层调度
    let nextQuestion: QuestionTemplate | null = null;
    let questionSource: 'local' | 'rewritten' | 'generated' = 'local';

    if (session.isInExpansionMode ?? false) {
      const availableQuestions = questionTemplates.filter(
        (q) => !excludedIds.has(q.id) && evaluateCondition(q.condition, answers, userAge)
      );
      const result = await selectExtensionQuestion(availableQuestions, answers, stageCounts, lastQuestionStage);
      nextQuestion = result.question;
      questionSource = result.source;
    } else {
      nextQuestion = selectNextQuestion(
        excludedIds,
        stageCounts,
        answers,
        shouldSuggestPreview,
        hasReachedBaseLimit,
        false,
        lastQuestionStage,
        userAge
      );
    }

    if (!nextQuestion) {
      return res.status(200).json({
        success: true,
        data: ensureCompleteResponse({
          questionId: 'COMPLETED_BY_PREVIEW',
          content: shouldSuggestPreview
            ? '内容已足够，您可以直接生成回忆录，或继续完善。'
            : '这轮可问的内容先到这里了。您可以先生成当前版本，也可以稍后继续补充。',
          source: 'local',
          mode: 'switch_topic',
          answerMode: 'text',
          stageTag: '一生回顾',
          shouldSuggestPreview: true,
          isOptional: true,
          baseSlotsUsed: session.baseSlotsUsed,
          baseSlotsTotal: session.baseSlotsTotal,
          skippedCount: session.skippedCount,
        }),
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...toQuestionResponse(nextQuestion, determineQuestionMode(lastAnswer?.questionId, nextQuestion), questionSource),
        baseSlotsUsed: session.baseSlotsUsed,
        baseSlotsTotal: session.baseSlotsTotal,
        skippedCount: session.skippedCount,
        shouldSuggestPreview,
        isOptional: nextQuestion.draftImportance === 'optional_reserve',
      },
    });
  } catch (error) {
    console.error('Get next question error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

function toQuestionResponse(
  question: QuestionTemplate,
  mode: QuestionResponse['mode'],
  source: 'local' | 'rewritten' | 'generated' = 'local'
): QuestionResponse {
  return {
    questionId: question.id,
    content: question.content,
    hint: question.hint,
    options: question.options,
    source,
    mode,
    answerMode: question.answerMode,
    minChoices: question.minChoices,
    maxChoices: question.maxChoices,
    allowTextDetails: question.allowTextDetails,
    responseCardinality: question.responseCardinality,
    suggestedAnswerCount: question.suggestedAnswerCount,
    stageTag: question.stageTag,
    narrativeRole: question.narrativeRole,
    materialType: question.materialType,
  };
}

// 防守函数：确保特殊动作题有完整字段
function ensureCompleteResponse(data: any): any {
  if (!data.answerMode) {
    console.warn('[API] 响应缺少 answerMode，补齐默认值');
    data.answerMode = 'text';
  }
  if (!data.stageTag) {
    console.warn('[API] 响应缺少 stageTag，补齐默认值');
    data.stageTag = '一生回顾';
  }
  return data;
}

function getStageCounts(answeredQuestionIds: string[]) {
  const counts = Object.fromEntries(
    STAGE_PRIORITY.map((stage) => [stage, 0])
  ) as Record<(typeof STAGE_PRIORITY)[number], number>;

  answeredQuestionIds.forEach((questionId) => {
    const question = getQuestionById(questionId);
    if (question && question.stageTag in counts) {
      counts[question.stageTag as keyof typeof counts] += 1;
    }
  });

  return counts;
}

// 构建用户上下文摘要
function buildUserContextSummary(
  answers: SessionAnswer[],
  stageCounts: Record<(typeof STAGE_PRIORITY)[number], number>
): string {
  const recentAnswers = answers.slice(0, 3).map((a) => a.content).join('\n');
  const coveredStages = STAGE_PRIORITY.filter((stage) => stageCounts[stage] > 0);

  return `用户已回答的最近内容：\n${recentAnswers}\n\n已覆盖的人生阶段：${coveredStages.join('、')}`;
}

// 标签匹配：根据用户上下文和已覆盖的标签选择合适的题
function matchExtensionQuestionByTags(
  availableQuestions: QuestionTemplate[],
  answers: SessionAnswer[],
  stageCounts: Record<(typeof STAGE_PRIORITY)[number], number>,
  lastQuestionStage?: string
): QuestionTemplate | null {
  const extensionQuestions = availableQuestions.filter((q) => q.phase === 'extension');

  if (extensionQuestions.length === 0) {
    return null;
  }

  // 1. 同主题优先（优先返回可适配的题目）
  if (lastQuestionStage) {
    const sameStageQuestions = extensionQuestions.filter((q) => q.stageTag === lastQuestionStage);
    if (sameStageQuestions.length > 0) {
      // 优先返回可适配的题目
      const adaptableQuestions = sameStageQuestions.filter((q) => q.adaptable === true);
      if (adaptableQuestions.length > 0) {
        return adaptableQuestions[0];
      }
      return sameStageQuestions[0];
    }
  }

  // 2. 相邻主题（优先返回可适配的题目）
  if (lastQuestionStage) {
    const adjacentStages = ADJACENT_STAGES[lastQuestionStage as (typeof STAGE_PRIORITY)[number]] || [];
    for (const stage of adjacentStages) {
      const adjacentQuestions = extensionQuestions.filter((q) => q.stageTag === stage);
      if (adjacentQuestions.length > 0) {
        // 优先返回可适配的题目
        const adaptableQuestions = adjacentQuestions.filter((q) => q.adaptable === true);
        if (adaptableQuestions.length > 0) {
          return adaptableQuestions[0];
        }
        return adjacentQuestions[0];
      }
    }
  }

  // 3. 缺口补齐：统计已覆盖的 detailTags（优先返回可适配的题目）
  const coveredDetailTags = new Set<string>();
  answers.forEach((answer) => {
    const q = getQuestionById(answer.questionId);
    if (q?.detailTags) {
      q.detailTags.forEach((tag) => coveredDetailTags.add(tag));
    }
  });

  const gapFillingQuestions = extensionQuestions.filter((q) =>
    q.detailTags?.some((tag) => !coveredDetailTags.has(tag)) ?? false
  );

  if (gapFillingQuestions.length > 0) {
    // 优先返回可适配的题目
    const adaptableQuestions = gapFillingQuestions.filter((q) => q.adaptable === true);
    if (adaptableQuestions.length > 0) {
      return adaptableQuestions[0];
    }
    return gapFillingQuestions[0];
  }

  // 4. 阶段均衡（优先返回可适配的题目）
  const leastCoveredStage = STAGE_PRIORITY.reduce((min, stage) =>
    stageCounts[stage] < stageCounts[min] ? stage : min
  );

  const balancingQuestions = extensionQuestions.filter((q) => q.stageTag === leastCoveredStage);
  if (balancingQuestions.length > 0) {
    // 优先返回可适配的题目
    const adaptableQuestions = balancingQuestions.filter((q) => q.adaptable === true);
    if (adaptableQuestions.length > 0) {
      return adaptableQuestions[0];
    }
    return balancingQuestions[0];
  }

  // 5. 如果以上都没有，直接返回第一个可适配的扩展题
  const adaptableQuestions = extensionQuestions.filter((q) => q.adaptable === true);
  if (adaptableQuestions.length > 0) {
    return adaptableQuestions[0];
  }

  // 最后才返回任意扩展题
  return extensionQuestions[0] || null;
}

// 第一层：改写答案选项（基于用户上下文）
async function adaptAnswerOptions(
  question: QuestionTemplate,
  _userContext: string,
  answers: SessionAnswer[]
): Promise<QuestionTemplate> {
  // 如果题目没有选项，直接返回原题
  if (!question.options || question.options.length === 0) {
    return question;
  }

  // 简单的答案适配逻辑：根据用户上下文调整选项
  // 这里可以调用 AI 来改写选项，但为了降低成本，先用简单逻辑
  const adaptedOptions = question.options.map((option) => {
    // 检查用户回答中是否提到了相关的职业、地点等
    const userAnswerText = answers.map((a) => a.content).join(' ');

    // 简单的关键词替换逻辑
    let adaptedLabel = option.label;

    // 如果选项中有"同事"，但用户是音乐家，改为"听众"
    if (adaptedLabel.includes('同事') && userAnswerText.includes('音乐')) {
      adaptedLabel = adaptedLabel.replace('同事', '听众');
    }

    return {
      ...option,
      label: adaptedLabel,
    };
  });

  return {
    ...question,
    options: adaptedOptions,
  };
}

// 寻找相对接近的题目（用于第二层改写）
function findCloseQuestions(
  extensionQuestions: QuestionTemplate[],
  _answers: SessionAnswer[],
  _stageCounts: Record<(typeof STAGE_PRIORITY)[number], number>,
  lastQuestionStage?: string
): QuestionTemplate[] {
  const closeQuestions: QuestionTemplate[] = [];

  // 1. 同主题的题目
  if (lastQuestionStage) {
    const sameStageQuestions = extensionQuestions.filter((q) => q.stageTag === lastQuestionStage);
    closeQuestions.push(...sameStageQuestions);
  }

  // 2. 相邻主题的题目
  if (lastQuestionStage) {
    const adjacentStages = ADJACENT_STAGES[lastQuestionStage as (typeof STAGE_PRIORITY)[number]] || [];
    for (const stage of adjacentStages) {
      const adjacentQuestions = extensionQuestions.filter((q) => q.stageTag === stage);
      closeQuestions.push(...adjacentQuestions);
    }
  }

  // 3. 如果还没有找到，返回所有扩展题
  if (closeQuestions.length === 0) {
    closeQuestions.push(...extensionQuestions);
  }

  return closeQuestions;
}

// 三层调度主函数（重新设计）
async function selectExtensionQuestion(
  availableQuestions: QuestionTemplate[],
  answers: SessionAnswer[],
  stageCounts: Record<(typeof STAGE_PRIORITY)[number], number>,
  lastQuestionStage?: string
): Promise<{ question: QuestionTemplate | null; source: 'local' | 'rewritten' | 'generated' }> {
  const extensionQuestions = availableQuestions.filter((q) => q.phase === 'extension');
  console.log('[三层调度] 可用扩展题数:', extensionQuestions.length);
  console.log('[三层调度] 回答数:', answers.length);
  console.log('[三层调度] 最后问题阶段:', lastQuestionStage);

  // 第一层：标签匹配 + 改写答案选项（最多 4 次）
  const matchedQuestion = matchExtensionQuestionByTags(availableQuestions, answers, stageCounts, lastQuestionStage);

  console.log('[三层调度] 第一层匹配结果:', {
    matched: matchedQuestion?.id,
    answersCount: answers.length,
  });

  if (matchedQuestion) {
    // 第一层：改写答案选项（基于用户上下文）
    try {
      const userContext = buildUserContextSummary(answers, stageCounts);
      const adaptedQuestion = await adaptAnswerOptions(matchedQuestion, userContext, answers);

      console.log('[三层调度] 第一层答案改写成功');
      return {
        question: adaptedQuestion,
        source: 'local',
      };
    } catch (error) {
      console.error('[三层调度] 第一层答案改写失败:', error instanceof Error ? error.message : String(error));
      // 降级：返回原题
      return { question: matchedQuestion, source: 'local' };
    }
  }

  // 第二层：AI 改写题目和答案（当标签匹配失败时）
  console.log('[三层调度] 第一层无匹配，尝试第二层改写');

  // 寻找相对接近的题目（可能不完全匹配，但有一定相关性）
  const closeQuestions = findCloseQuestions(extensionQuestions, answers, stageCounts, lastQuestionStage);

  if (closeQuestions.length > 0) {
    const candidateQuestion = closeQuestions[0];
    try {
      const userContext = buildUserContextSummary(answers, stageCounts);
      const previousAnswers = answers.slice(0, 5).map((a) => a.content);

      console.log('[三层调度] 触发第二层改写:', candidateQuestion.id);
      const rewriteResult = await rewriteQuestion(
        candidateQuestion.content,
        candidateQuestion.options,
        userContext,
        previousAnswers
      );

      console.log('[三层调度] 第二层改写成功');
      return {
        question: {
          ...candidateQuestion,
          content: rewriteResult.question,
          options: rewriteResult.options || candidateQuestion.options,
        },
        source: 'rewritten',
      };
    } catch (error) {
      console.error('[三层调度] 第二层改写失败:', error instanceof Error ? error.message : String(error));
      // 降级：返回原题
      return { question: candidateQuestion, source: 'local' };
    }
  }

  // 第三层：AI 生成新题（完全找不到相关题目）
  console.log('[三层调度] 第一二层都无法满足，尝试第三层生成');
  if (answers.length >= 10) {
    try {
      const userContext = buildUserContextSummary(answers, stageCounts);
      const previousAnswers = answers.slice(0, 5).map((a) => a.content);
      const currentStage = STAGE_PRIORITY.find((stage) => stageCounts[stage] > 0) || '晚年';

      console.log('[三层调度] 触发第三层生成');
      const { question: generatedContent, hint: generatedHint } = await generateNewQuestion(
        userContext,
        previousAnswers,
        currentStage
      );

      const generatedQuestion: QuestionTemplate = {
        id: `generated_${Date.now()}`,
        content: generatedContent,
        hint: generatedHint,
        options: [],
        topicTags: [],
        detailTags: [],
        stageTag: currentStage,
        demographicTags: [],
        triggerKeywords: [],
        followupQuestions: [],
        condition: null,
        answerMode: 'text',
        minChoices: 0,
        maxChoices: 0,
        allowTextDetails: false,
        responseCardinality: 'open',
        suggestedAnswerCount: 1,
        narrativeRole: 'representative_event',
        materialType: 'mixed',
        draftImportance: 'optional_reserve',
        phase: 'extension',
        adaptable: false,
      };

      console.log('[三层调度] 第三层生成成功');
      return { question: generatedQuestion, source: 'generated' };
    } catch (error) {
      console.warn('[三层调度] 第三层生成失败，降级到随机选择:', error);
      const randomQuestion = extensionQuestions[Math.floor(Math.random() * extensionQuestions.length)] || null;
      return { question: randomQuestion, source: 'local' };
    }
  }

  return { question: null, source: 'local' };
}

function evaluateCondition(
  condition: string | null | undefined,
  answers: SessionAnswer[],
  userAge?: number
): boolean {
  if (!condition) {
    return true; // 无条件限制，总是显示
  }

  // 从回答中提取用户状态
  const hasSpouseAnswer = answers.find((a) => a.questionId === 'family_001');
  const hasChildrenAnswer = answers.find((a) => a.questionId === 'family_007');

  const relationshipSelections = splitSelectedOptions(hasSpouseAnswer?.selectedOption ?? null);
  const hasSpouse =
    hasSpouseAnswer?.selectedOption === 'yes' ||
    relationshipSelections.includes('partner') ||
    relationshipSelections.includes('spouse');
  const hasChildren = hasChildrenAnswer?.selectedOption === 'yes';

  // 年龄相关条件判断
  if (userAge) {
    if (condition === 'is_retired') {
      return isRetired(userAge);
    }
    if (condition === 'not_retired') {
      return !isRetired(userAge);
    }
    if (condition === 'age_50_plus') {
      return userAge >= 50;
    }
    if (condition.startsWith('experienced_')) {
      const event = condition.replace('experienced_', '');
      return hasExperiencedEvent(userAge, event);
    }
  }

  // 根据条件评估
  switch (condition) {
    case 'has_spouse':
      return hasSpouse;
    case 'no_spouse':
      return !hasSpouse;
    case 'has_children':
      return hasChildren;
    case 'no_children':
      return !hasChildren;
    default:
      return true;
  }
}

function selectNextQuestion(
  excludedIds: Set<string>,
  stageCounts: Record<(typeof STAGE_PRIORITY)[number], number>,
  answers: SessionAnswer[] = [],
  shouldSuggestPreview: boolean = false,
  hasReachedBaseLimit: boolean = false,
  isInExpansionMode: boolean = false,
  lastQuestionStage?: string,
  userAge?: number
): QuestionTemplate | null {
  // 强制追问链：孩子相关的追问
  const hasChildrenAnswer = answers.find((a) => a.questionId === 'family_007');
  const hasChildrenFollowup1 = answers.find((a) => a.questionId === 'family_011');
  const hasChildrenFollowup2 = answers.find((a) => a.questionId === 'family_012');

  // 如果用户回答了"有孩子"但还没回答 family_011，强制调度 family_011
  if (
    hasChildrenAnswer?.selectedOption === 'yes' &&
    !hasChildrenFollowup1 &&
    !excludedIds.has('family_011')
  ) {
    const followupQuestion = getQuestionById('family_011');
    if (followupQuestion) {
      console.log('[强制追问] 调度 family_011（偏爱/愧疚）');
      return followupQuestion;
    }
  }

  // 如果用户回答了 family_011 但还没回答 family_012，强制调度 family_012
  if (
    hasChildrenFollowup1 &&
    !hasChildrenFollowup2 &&
    !excludedIds.has('family_012')
  ) {
    const followupQuestion = getQuestionById('family_012');
    if (followupQuestion) {
      console.log('[强制追问] 调度 family_012（探望频率）');
      return followupQuestion;
    }
  }

  const availableQuestions = questionTemplates.filter(
    (question) => !excludedIds.has(question.id) && evaluateCondition(question.condition, answers, userAge)
  );

  if (availableQuestions.length === 0) {
    return null;
  }

  // 扩展模式下优先选 expansion_lead 题
  if (isInExpansionMode) {
    const expansionLeadQuestions = availableQuestions.filter(
      (q) => q.draftImportance === 'expansion_lead' && q.phase === 'extension'
    );
    if (expansionLeadQuestions.length > 0) {
      return expansionLeadQuestions[0];
    }
  }

  // 如果已达到基础题位上限，只返回尾声题（可选题）
  if (hasReachedBaseLimit) {
    const epilogueQuestions = availableQuestions.filter(
      (q) => q.phase === 'closure' || (q.draftImportance === 'optional_reserve' && q.phase === 'extension')
    );
    if (epilogueQuestions.length > 0) {
      return epilogueQuestions[0];
    }
    return null;
  }

  // 1. 基础访谈阶段：只调度 phase: base 的题
  if (!isInExpansionMode) {
    const baseQuestions = availableQuestions.filter(
      (question) => question.phase === 'base' && question.draftImportance === 'core_2000'
    );

    if (baseQuestions.length > 0) {
      // 优先满足骨架题目标
      for (const stage of getStageTraversalOrder(lastQuestionStage, stageCounts)) {
        const stageQuestions = baseQuestions.filter(
          (question) => question.stageTag === stage
        );
        if (stageQuestions.length === 0) {
          continue;
        }

        if (stageCounts[stage] < SKELETON_TARGETS[stage]) {
          return stageQuestions[0];
        }
      }

      // 如果已经满足预览条件，且有可选的”尾声”题，按顺序给出一道
      if (shouldSuggestPreview) {
        const epilogueQuestions = availableQuestions.filter(
          (q) => q.phase === 'closure' || (q.draftImportance === 'optional_reserve' && q.phase === 'extension')
        );
        if (epilogueQuestions.length > 0) {
          return epilogueQuestions[0];
        }
      }

      // 继续从基础题库中选择（按话题优先级）
      const remainingBaseQuestions = baseQuestions.filter(
        (q) => q.draftImportance === 'core_2000'
      );

      if (remainingBaseQuestions.length > 0) {
        // 优先级：同主题 → 相邻主题 → 其他主题
        if (lastQuestionStage) {
          const sameStageQuestions = remainingBaseQuestions.filter(
            (q) => q.stageTag === lastQuestionStage
          );
          if (sameStageQuestions.length > 0) {
            return sameStageQuestions[0];
          }

          const adjacentStages = ADJACENT_STAGES[lastQuestionStage as (typeof STAGE_PRIORITY)[number]] || [];
          for (const adjacentStage of adjacentStages) {
            const adjacentQuestions = remainingBaseQuestions.filter(
              (q) => q.stageTag === adjacentStage
            );
            if (adjacentQuestions.length > 0) {
              return adjacentQuestions[0];
            }
          }
        }

        const otherStages = STAGE_PRIORITY.filter((stage) =>
          remainingBaseQuestions.some((question) => question.stageTag === stage)
        ).sort((left, right) => stageCounts[left] - stageCounts[right]);

        if (otherStages.length > 0) {
          const selectedStage = otherStages[0];
          return (
            remainingBaseQuestions.find((question) => question.stageTag === selectedStage) ??
            remainingBaseQuestions[0]
          );
        }
      }
    }
  }

  // 2. 扩展阶段：只调度 phase: extension 的题
  const extensionQuestions = availableQuestions.filter(
    (q) => q.phase === 'extension'
  );

  if (extensionQuestions.length > 0) {
    // 优先级：同主题 → 相邻主题 → 其他主题
    if (lastQuestionStage) {
      const sameStageQuestions = extensionQuestions.filter(
        (q) => q.stageTag === lastQuestionStage
      );
      if (sameStageQuestions.length > 0) {
        return sameStageQuestions[0];
      }

      const adjacentStages = ADJACENT_STAGES[lastQuestionStage as (typeof STAGE_PRIORITY)[number]] || [];
      for (const adjacentStage of adjacentStages) {
        const adjacentQuestions = extensionQuestions.filter(
          (q) => q.stageTag === adjacentStage
        );
        if (adjacentQuestions.length > 0) {
          return adjacentQuestions[0];
        }
      }
    }

    const otherStages = STAGE_PRIORITY.filter((stage) =>
      extensionQuestions.some((question) => question.stageTag === stage)
    ).sort((left, right) => stageCounts[left] - stageCounts[right]);

    if (otherStages.length > 0) {
      const selectedStage = otherStages[0];
      return (
        extensionQuestions.find((question) => question.stageTag === selectedStage) ??
        extensionQuestions[0]
      );
    }
  }

  return null;
}

function determineQuestionMode(
  lastQuestionId: string | undefined,
  nextQuestion: QuestionTemplate
): QuestionResponse['mode'] {
  if (!lastQuestionId) {
    return 'switch_topic';
  }

  const lastQuestion = getQuestionById(lastQuestionId);
  if (!lastQuestion) {
    return 'switch_topic';
  }

  return lastQuestion.stageTag === nextQuestion.stageTag ? 'extend_topic' : 'switch_topic';
}

function getStageTraversalOrder(
  lastQuestionStage: string | undefined,
  stageCounts: Record<(typeof STAGE_PRIORITY)[number], number>
): (typeof STAGE_PRIORITY)[number][] {
  const orderedStages: (typeof STAGE_PRIORITY)[number][] = [];
  const seen = new Set<string>();

  const pushStage = (stage: string | undefined) => {
    if (!stage || seen.has(stage) || !STAGE_PRIORITY.includes(stage as (typeof STAGE_PRIORITY)[number])) {
      return;
    }

    orderedStages.push(stage as (typeof STAGE_PRIORITY)[number]);
    seen.add(stage);
  };

  pushStage(lastQuestionStage);

  if (lastQuestionStage) {
    const adjacentStages = ADJACENT_STAGES[lastQuestionStage as (typeof STAGE_PRIORITY)[number]] || [];
    adjacentStages.forEach(pushStage);
  }

  STAGE_PRIORITY
    .slice()
    .sort((left, right) => {
      if (stageCounts[left] !== stageCounts[right]) {
        return stageCounts[left] - stageCounts[right];
      }

      return STAGE_PRIORITY.indexOf(left) - STAGE_PRIORITY.indexOf(right);
    })
    .forEach(pushStage);

  return orderedStages;
}

function getDeepDiveQuestion(
  lastAnswer: SessionAnswer,
  excludedIds: Set<string>,
  allAnswers: SessionAnswer[]
): QuestionTemplate | null {
  if (!shouldDigDeeper(lastAnswer, excludedIds, allAnswers)) {
    return null;
  }

  const currentQuestion = getQuestionById(lastAnswer.questionId);
  if (!currentQuestion) {
    return null;
  }

  const immediateQuestion = buildImmediateDeepDiveQuestion(currentQuestion, lastAnswer);
  if (immediateQuestion) {
    return immediateQuestion;
  }

  const followupIds = currentQuestion.followupQuestions ?? [];
  for (const followupId of followupIds) {
    if (!excludedIds.has(followupId)) {
      const followupQuestion = getQuestionById(followupId);
      if (followupQuestion) {
        return followupQuestion;
      }
    }
  }

  return null;
}

function shouldDigDeeper(
  lastAnswer: SessionAnswer,
  excludedIds: Set<string>,
  allAnswers: SessionAnswer[]
): boolean {
  const currentQuestion = getQuestionById(lastAnswer.questionId);
  if (!currentQuestion) {
    return false;
  }

  const selectedValues = splitSelectedOptions(lastAnswer.selectedOption);

  // 第一步：检查用户是否明确选择了"不想深挖"的选项
  if (selectedValues.some((value) => NO_DEEP_DIVE_VALUES.has(value))) {
    return false;
  }

  // 第二步：检查用户是否明确选择了"需要深挖"的选项
  const hasExplicitDeepDiveChoice = selectedValues.some((value) => EXPLICIT_DEEP_DIVE_VALUES.has(value));
  if (!hasExplicitDeepDiveChoice) {
    return false;
  }

  // 第三步：限制同主题深挖次数 ≤ 2
  const currentStageTag = currentQuestion.stageTag;
  const deepDiveCountInStage = allAnswers.filter((answer) => {
    // 对于深挖题，直接检查 ID 前缀和 topicTag
    if (answer.questionId.startsWith('deepdive_')) {
      return answer.topicTag === currentStageTag;
    }
    return false;
  }).length;

  if (deepDiveCountInStage >= 2) {
    return false;
  }

  // 第四步：检查是否有可用的深挖题
  const hasGeneratedDeepDive = Boolean(buildImmediateDeepDiveQuestion(currentQuestion, lastAnswer));
  const hasUnansweredFollowup = (currentQuestion.followupQuestions ?? []).some(
    (followupId) => !excludedIds.has(followupId)
  );

  if (!hasGeneratedDeepDive && !hasUnansweredFollowup) {
    return false;
  }

  return true;
}

function buildImmediateDeepDiveQuestion(
  currentQuestion: QuestionTemplate,
  lastAnswer: SessionAnswer
): QuestionTemplate | null {
  const intent = detectDeepDiveIntent(lastAnswer);
  if (!intent) {
    return null;
  }

  const templates: Record<typeof intent, Pick<QuestionTemplate, 'content' | 'hint'>> = {
    people: {
      content: '您先想到的是哪一位？他/她那时怎么照看您，您为什么最记得他/她？',
      hint: '先讲一个人就好。可以说怎么称呼、做过什么、给您的感觉。',
    },
    scene: {
      content: '先说最先冒出来的那个场景吧。那是在什么地方、什么时间，周围有什么声音、气味或画面？',
      hint: '不必一下说很多，先把一个场景讲活就很好。',
    },
    timeline: {
      content: '您先说个大概时候就行。那时您多大、人在什么地方、正在过什么日子？',
      hint: '年份不必特别准，能说出人生阶段和当时的日子就够了。',
    },
    emotion: {
      content: '先挑一件最深的事讲讲吧。那件事里有谁、发生了什么、您当时心里是什么滋味？',
      hint: '一件事、一个人、一种心情，说透一点，就很有分量。',
    },
    list: {
      content: '这题可以慢慢来。先说第一项最想讲的就好，它为什么排在前面？',
      hint: '不用一次讲完，先把第一项讲细，再继续补第二项第三项。',
    },
    quote: {
      content: '您先把那句最常听的话说给我听听吧。通常是谁说、在什么情形下会说这句话？',
      hint: '原话不一定一字不差，先把那股语气和当时的场景说出来就很好。',
    },
    object: {
      content: '您先讲讲那样东西吧。它是什么、谁给的或怎么来的，为什么让您一直记到现在？',
      hint: '先讲一件具体东西，再讲它背后的人和事，会很有画面。',
    },
  };

  const narrativeRoleMap: Record<typeof intent, QuestionTemplate['narrativeRole']> = {
    people: 'relationship',
    scene: 'daily_life',
    timeline: 'profile',
    emotion: 'representative_event',
    list: 'representative_event',
    quote: 'daily_life',
    object: 'daily_life',
  };

  const materialTypeMap: Record<typeof intent, QuestionTemplate['materialType']> = {
    people: 'person',
    scene: 'scene',
    timeline: 'timeline',
    emotion: 'emotion',
    list: 'mixed',
    quote: 'quote',
    object: 'object',
  };

  return {
    id: `deepdive_${currentQuestion.id}`,
    content: templates[intent].content,
    hint: templates[intent].hint,
    options: [],
    topicTags: currentQuestion.topicTags,
    detailTags: currentQuestion.detailTags,
    stageTag: currentQuestion.stageTag,
    demographicTags: currentQuestion.demographicTags,
    triggerKeywords: [],
    followupQuestions: [],
    condition: null,
    answerMode: 'text',
    minChoices: 0,
    maxChoices: 0,
    allowTextDetails: false,
    responseCardinality: 'single_focus',
    suggestedAnswerCount: 1,
    narrativeRole: narrativeRoleMap[intent],
    materialType: materialTypeMap[intent],
    draftImportance: 'core_2000',
  };
}

function detectDeepDiveIntent(
  lastAnswer: SessionAnswer
): 'people' | 'scene' | 'timeline' | 'emotion' | 'list' | 'quote' | 'object' | null {
  const selectedValues = splitSelectedOptions(lastAnswer.selectedOption);

  // 只有用户明确选择了"需要深挖"的选项，才返回深挖意图
  // 否则返回 null，不生成深挖题

  if (selectedValues.includes('people') || selectedValues.includes('one_person')) {
    return 'people';
  }

  if (selectedValues.includes('list')) {
    return 'list';
  }

  if (selectedValues.includes('scene')) {
    return 'scene';
  }

  if (selectedValues.includes('timeline')) {
    return 'timeline';
  }

  if (selectedValues.includes('emotion')) {
    return 'emotion';
  }

  if (selectedValues.includes('quote')) {
    return 'quote';
  }

  if (selectedValues.includes('object')) {
    return 'object';
  }

  if (selectedValues.includes('place_clear')) {
    return 'scene';
  }

  if (selectedValues.includes('year_range') || selectedValues.includes('life_stage')) {
    return 'timeline';
  }

  return null;
}

function splitSelectedOptions(selectedOption: string | null): string[] {
  if (!selectedOption) {
    return [];
  }

  return selectedOption
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean);
}

function calculateShouldSuggestPreview(
  answeredQuestionIds: string[],
  stageCounts: Record<(typeof STAGE_PRIORITY)[number], number>
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
  // 检查是否覆盖了三个核心主题（不强制婚姻，对未婚/丧偶用户友好）
  const coreStages = ['童年', '工作', '晚年'];
  const hasCoreStages = coreStages.every((stage) => stageCounts[stage as (typeof STAGE_PRIORITY)[number]] > 0);
  if (!hasCoreStages) {
    return false;
  }

  return true;
}
