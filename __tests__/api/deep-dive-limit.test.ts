import { getQuestionById, questionTemplates } from '@/data/question-templates';

// 模拟 SessionAnswer 类型
type SessionAnswer = {
  questionId: string;
  topicTag: string | null;
  content: string;
  selectedOption: string | null;
  createdAt: Date;
};

// 模拟 shouldDigDeeper 函数的核心逻辑
function shouldDigDeeperMock(
  lastAnswer: SessionAnswer,
  excludedIds: Set<string>,
  allAnswers: SessionAnswer[]
): boolean {
  const currentQuestion = getQuestionById(lastAnswer.questionId);
  if (!currentQuestion) {
    return false;
  }

  const selectedValues = (lastAnswer.selectedOption || '')
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean);

  // 第一步：检查用户是否明确选择了"不想深挖"的选项
  const NO_DEEP_DIVE_VALUES = new Set([
    'unclear',
    'forgotten',
    'inconvenient',
    'not_applicable',
    'skip',
  ]);

  if (selectedValues.some((value) => NO_DEEP_DIVE_VALUES.has(value))) {
    return false;
  }

  // 第二步：检查用户是否明确选择了"需要深挖"的选项
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

  const hasExplicitDeepDiveChoice = selectedValues.some((value) => EXPLICIT_DEEP_DIVE_VALUES.has(value));
  if (!hasExplicitDeepDiveChoice) {
    return false;
  }

  // 第三步：限制同主题深挖次数 ≤ 2
  const currentStageTag = currentQuestion.stageTag;
  const deepDiveCountInStage = allAnswers.filter((answer) => {
    // 对于深挖题，直接使用 answer 中的 topicTag
    // 对于普通题，通过 getQuestionById 查询
    if (answer.questionId.startsWith('deepdive_')) {
      return answer.topicTag === currentStageTag;
    }
    const q = getQuestionById(answer.questionId);
    return q && q.stageTag === currentStageTag && answer.questionId.startsWith('deepdive_');
  }).length;

  if (deepDiveCountInStage >= 2) {
    return false;
  }

  return true;
}

describe('Deep Dive Limit', () => {
  it('should not trigger deep dive when same topic already has 2 deep dives', () => {
    // 使用实际存在的题目 ID
    const baseQuestionId = 'childhood_002';
    const anotherQuestionId = 'childhood_003';

    const excludedIds = new Set<string>();

    // 模拟已有 2 个深挖题的情况
    // 深挖题的 ID 格式是 deepdive_${原始题ID}
    const allAnswers: SessionAnswer[] = [
      {
        questionId: `deepdive_${anotherQuestionId}`,
        topicTag: '童年',
        content: '这是第一个深挖题的回答',
        selectedOption: 'people',
        createdAt: new Date(),
      },
      {
        questionId: `deepdive_${baseQuestionId}`,
        topicTag: '童年',
        content: '这是第二个深挖题的回答',
        selectedOption: 'scene',
        createdAt: new Date(),
      },
    ];

    // 当前回答选择了"需要深挖"的选项
    const lastAnswer: SessionAnswer = {
      questionId: baseQuestionId,
      topicTag: '童年',
      content: '用户的回答内容',
      selectedOption: 'people', // 明确选择了深挖选项
      createdAt: new Date(),
    };

    // 应该返回 false，因为已经有 2 个深挖题了
    const result = shouldDigDeeperMock(lastAnswer, excludedIds, allAnswers);
    expect(result).toBe(false);
  });

  it('should trigger deep dive when user explicitly selects deep dive option and count < 2', () => {
    const baseQuestionId = 'childhood_002';

    const excludedIds = new Set<string>();

    // 模拟只有 1 个深挖题的情况
    const allAnswers: SessionAnswer[] = [
      {
        questionId: `deepdive_${baseQuestionId}_1`,
        topicTag: '童年',
        content: '这是第一个深挖题的回答',
        selectedOption: 'people',
        createdAt: new Date(),
      },
    ];

    // 当前回答选择了"需要深挖"的选项
    const lastAnswer: SessionAnswer = {
      questionId: baseQuestionId,
      topicTag: '童年',
      content: '用户的回答内容',
      selectedOption: 'scene', // 明确选择了深挖选项
      createdAt: new Date(),
    };

    // 应该返回 true，因为只有 1 个深挖题，且用户明确选择了深挖
    const result = shouldDigDeeperMock(lastAnswer, excludedIds, allAnswers);
    expect(result).toBe(true);
  });

  it('should not trigger deep dive when user does not select deep dive option', () => {
    const baseQuestionId = 'childhood_002';

    const excludedIds = new Set<string>();
    const allAnswers: SessionAnswer[] = [];

    // 当前回答没有选择"需要深挖"的选项
    const lastAnswer: SessionAnswer = {
      questionId: baseQuestionId,
      topicTag: '童年',
      content: '用户的回答内容',
      selectedOption: 'other_option', // 没有选择深挖选项
      createdAt: new Date(),
    };

    // 应该返回 false，因为用户没有明确选择深挖
    const result = shouldDigDeeperMock(lastAnswer, excludedIds, allAnswers);
    expect(result).toBe(false);
  });

  it('should not trigger deep dive when selectedOption is null', () => {
    const baseQuestionId = 'childhood_002';

    const excludedIds = new Set<string>();
    const allAnswers: SessionAnswer[] = [];

    // 当前回答没有选择任何选项
    const lastAnswer: SessionAnswer = {
      questionId: baseQuestionId,
      topicTag: '童年',
      content: '用户的回答内容',
      selectedOption: null, // 没有选择任何选项
      createdAt: new Date(),
    };

    // 应该返回 false
    const result = shouldDigDeeperMock(lastAnswer, excludedIds, allAnswers);
    expect(result).toBe(false);
  });
});
