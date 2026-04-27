/**
 * 缺口分析器
 * 分析已生成的回忆录，识别缺失的关键内容
 * 返回缺口类型和建议补全问题
 */

interface InterviewAnswer {
  id: string;
  questionContent: string;
  content: string;
  topicTag: string | null;
  stageTag?: string;
  narrativeRole?: string;
}

interface Memoir {
  title: string;
  sections: Array<{
    stage: string;
    title: string;
    content: string;
  }>;
  wordCount: number;
  generatedAt: string;
}

interface GapAnalysis {
  gaps: GapType[];
  completionQuestions: CompletionQuestion[];
  summary: string;
}

type GapType = 'missing_people' | 'missing_places' | 'missing_transitions' | 'missing_era_context' | 'missing_daily_life';

interface CompletionQuestion {
  type: GapType;
  question: string;
  hint: string;
  priority: number;
}

/**
 * 分析回忆录缺口
 */
export function analyzeGaps(
  memoir: Memoir,
  answers: InterviewAnswer[]
): GapAnalysis {
  const gaps: GapType[] = [];
  const completionQuestions: CompletionQuestion[] = [];

  // 检查缺失的关键人物
  if (hasMissingPeople(memoir, answers)) {
    gaps.push('missing_people');
    completionQuestions.push({
      type: 'missing_people',
      question: '您生活中还有哪位重要的人，是您特别想记得的？',
      hint: '可以是家人、朋友、老师、同事，或者任何对您有影响的人。',
      priority: 1,
    });
  }

  // 检查缺失的重要地点
  if (hasMissingPlaces(memoir, answers)) {
    gaps.push('missing_places');
    completionQuestions.push({
      type: 'missing_places',
      question: '您人生中最重要的地方是哪里？为什么对您来说很特别？',
      hint: '可以是您长大的地方、工作过的城市、或者某个让您印象深刻的地方。',
      priority: 2,
    });
  }

  // 检查缺失的人生转折
  if (hasMissingTransitions(memoir, answers)) {
    gaps.push('missing_transitions');
    completionQuestions.push({
      type: 'missing_transitions',
      question: '您人生中最大的转折是什么时候？那时发生了什么？',
      hint: '可能是搬家、换工作、结婚、或其他改变了您人生轨迹的事件。',
      priority: 1,
    });
  }

  // 检查缺失的时代背景
  if (hasMissingEraContext(memoir, answers)) {
    gaps.push('missing_era_context');
    completionQuestions.push({
      type: 'missing_era_context',
      question: '您最记得那个时代的什么？当时的日子是什么样的？',
      hint: '可以说说当时的物价、工作、娱乐、或者社会风气。',
      priority: 3,
    });
  }

  // 检查缺失的日常气质
  if (hasMissingDailyLife(memoir, answers)) {
    gaps.push('missing_daily_life');
    completionQuestions.push({
      type: 'missing_daily_life',
      question: '您日常生活中最常做的事是什么？那时候的日子是怎么过的？',
      hint: '可以说说工作、家务、娱乐、或者和家人相处的日常。',
      priority: 2,
    });
  }

  // 按优先级排序，取前 3-5 题
  const sortedQuestions = completionQuestions.sort((a, b) => a.priority - b.priority).slice(0, 5);

  const summary = generateGapSummary(gaps);

  return {
    gaps,
    completionQuestions: sortedQuestions,
    summary,
  };
}

/**
 * 检查是否缺失关键人物
 * 标志：memoir 中人物提及少于 3 个，且没有 relationship 类型的回答
 */
function hasMissingPeople(memoir: Memoir, answers: InterviewAnswer[]): boolean {
  const peopleCount = countMentions(memoir, ['父', '母', '妻', '夫', '子', '女', '兄', '弟', '姐', '妹', '朋友', '同学', '同事', '老师']);
  const relationshipAnswers = answers.filter((a) => a.narrativeRole === 'relationship');

  return peopleCount < 3 && relationshipAnswers.length < 2;
}

/**
 * 检查是否缺失重要地点
 * 标志：memoir 中地点提及少于 2 个
 */
function hasMissingPlaces(memoir: Memoir, _answers: InterviewAnswer[]): boolean {
  const placeKeywords = ['北京', '上海', '广州', '深圳', '城市', '乡村', '农村', '县', '镇', '村', '家', '学校', '工厂', '公司', '单位'];
  const placeCount = countMentions(memoir, placeKeywords);

  return placeCount < 2;
}

/**
 * 检查是否缺失人生转折
 * 标志：没有 representative_event 类型的回答，且转折事件少于 1 个
 */
function hasMissingTransitions(memoir: Memoir, answers: InterviewAnswer[]): boolean {
  const eventAnswers = answers.filter((a) => a.narrativeRole === 'representative_event');
  const transitionKeywords = ['转折', '改变', '搬家', '换工作', '结婚', '生孩子', '参军', '下岗', '退休', '生病', '去世'];
  const transitionCount = countMentions(memoir, transitionKeywords);

  return eventAnswers.length === 0 && transitionCount < 1;
}

/**
 * 检查是否缺失时代背景
 * 标志：没有 era_context 类型的回答，或时代关键词少于 1 个
 */
function hasMissingEraContext(memoir: Memoir, answers: InterviewAnswer[]): boolean {
  const eraAnswers = answers.filter((a) => a.narrativeRole === 'era_context');
  const eraKeywords = ['年代', '时代', '改革', '开放', '文革', '建国', '建设', '发展', '变化', '当时'];
  const eraCount = countMentions(memoir, eraKeywords);

  return eraAnswers.length === 0 || eraCount < 1;
}

/**
 * 检查是否缺失日常气质
 * 标志：daily_life 类型的回答少于 2 个
 */
function hasMissingDailyLife(_memoir: Memoir, answers: InterviewAnswer[]): boolean {
  const dailyLifeAnswers = answers.filter((a) => a.narrativeRole === 'daily_life');

  return dailyLifeAnswers.length < 2;
}

/**
 * 计算 memoir 中特定关键词的出现次数
 */
function countMentions(memoir: Memoir, keywords: string[]): number {
  const text = memoir.sections.map((s) => s.content).join(' ');
  let count = 0;

  for (const keyword of keywords) {
    const regex = new RegExp(keyword, 'g');
    const matches = text.match(regex);
    if (matches) {
      count += matches.length;
    }
  }

  return count;
}

/**
 * 生成缺口总结
 */
function generateGapSummary(gaps: GapType[]): string {
  if (gaps.length === 0) {
    return '您的回忆录内容已经很完整了。';
  }

  const gapLabels: Record<GapType, string> = {
    missing_people: '关键人物',
    missing_places: '重要地点',
    missing_transitions: '人生转折',
    missing_era_context: '时代背景',
    missing_daily_life: '日常气质',
  };

  const labels = gaps.map((g) => gapLabels[g]);
  return `您的回忆录还可以补充：${labels.join('、')}。`;
}
