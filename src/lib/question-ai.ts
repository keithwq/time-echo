/**
 * AI 动态追问模块
 *
 * 职责：
 * 1. 当用户完成 L1-L2 静态选项后，根据上下文动态生成 L3+ 追问选项
 * 2. 根据用户输入字数自适应追问策略
 * 3. 判断某条线索是否已够用，决定收束或继续深挖
 */

interface DeepFollowupContext {
  entryQuestionId: string;
  personaName?: string; // Q1 逐人追问时当前人物名（"爸爸"/"妈妈"等）
  previousAnswers: { questionId: string; selectedOptions: string[]; textAnswer: string }[];
  totalInputLength: number;
}

interface DeepFollowupResult {
  content: string;
  options: { label: string; value: string; allowCustom?: boolean }[];
  shouldContinue: boolean; // false = 这条线索够了，建议收束
  strategy: 'deepen' | 'light_followup' | 'close';
}

const ADAPTIVE_THRESHOLDS = {
  shallow: 16,     // <= 16 字 → 选项追问
  medium: 50,      // 17-50 字 → 轻改写追问
  rich: 51,        // > 50 字 → 收束
};

/**
 * 根据用户输入的总字数决定追问策略
 */
function determineStrategy(totalLength: number): DeepFollowupResult['strategy'] {
  if (totalLength <= ADAPTIVE_THRESHOLDS.shallow) return 'deepen';
  if (totalLength <= ADAPTIVE_THRESHOLDS.medium) return 'light_followup';
  return 'close';
}

/**
 * Q1 逐人追问（q01_persona → q01_persona_age → q01_persona_saying → q01_persona_deed）
 * 根据当前已追到哪一层，返回下一层应该问什么
 */
function q01PersonaFollowup(ctx: DeepFollowupContext, currentLayer: string): DeepFollowupResult {
  const { personaName, totalInputLength } = ctx;
  const strategy = determineStrategy(totalInputLength);

  if (strategy === 'close') {
    return {
      content: `您说的这些关于${personaName}的事，已经很好了。`,
      options: [
        { label: '还想说说其他人', value: 'next_person' },
        { label: '够了，往下聊', value: 'enough' },
      ],
      shouldContinue: false,
      strategy: 'close',
    };
  }

  switch (currentLayer) {
    case 'q01_persona':
      return {
        content: `有没有一件具体的事，让您觉得${personaName}真像您说的那样？`,
        options: [
          { label: '有', value: 'yes' },
          { label: '一时想不起来', value: 'forgot' },
          { label: '好像没有', value: 'none' },
        ],
        shouldContinue: true,
        strategy: 'light_followup',
      };
    default:
      return {
        content: `关于${personaName}，还有没有什么想说的？`,
        options: [
          { label: '有', value: 'yes' },
          { label: '没有了，聊下一个', value: 'next' },
        ],
        shouldContinue: false,
        strategy: 'close',
      };
  }
}

/**
 * Q3 童年记忆深挖
 */
function q03DeepFollowup(ctx: DeepFollowupContext, focusType: string): DeepFollowupResult {
  const strategy = determineStrategy(ctx.totalInputLength);
  const prompt = (() => {
    switch (focusType) {
      case 'happy': return '是什么事？那年多大？谁跟您一起？';
      case 'proud': return '是什么事让您觉得得意？有人夸您了吗？';
      case 'wronged': return '被谁，因为什么事？后来有人帮您了吗？';
      case 'sad': return '是什么事？那时候谁在身边？';
      default: return '能多说说吗？';
    }
  })();

  return {
    content: prompt,
    options: [
      { label: '想说几句', value: 'share' },
      { label: '算了，不说了', value: 'skip' },
    ],
    shouldContinue: strategy !== 'close',
    strategy,
  };
}

/**
 * Q4 学校记忆深挖（老师/同学/事件/场景）
 */
function q04DeepFollowup(ctx: DeepFollowupContext, memoryType: string): DeepFollowupResult {
  const strategy = determineStrategy(ctx.totalInputLength);

  const prompts: Record<string, string> = {
    teacher: 'ta姓什么？教什么？是个什么样的人？最让您记得的是哪一点？',
    classmate: 'ta叫什么？为什么对您这么重要？还记得最开心的一回吗？',
    event: '是什么事？多大？后来怎么样了？',
    scene: '学校什么样？上学的路是什么样的？冬天冷不冷？',
  };

  return {
    content: prompts[memoryType] || '能多说说吗？',
    options: [
      { label: '想说几句', value: 'share' },
    ],
    shouldContinue: strategy !== 'close',
    strategy,
  };
}

/**
 * Q5 青年闯荡深挖（职业细节 + 得意之事）
 */
function q05CareerDeepFollowup(ctx: DeepFollowupContext, careerType: string): DeepFollowupResult {
  const strategy = determineStrategy(ctx.totalInputLength);

  const careerPrompts: Record<string, { question: string; options: string[] }> = {
    farming: { question: '种什么？自家地还是给别人干？最难的是什么？', options: ['想说几句'] },
    factory: { question: '什么厂？做什么岗位？谁带您进去的？', options: ['想说几句'] },
    business: { question: '做什么买卖？第一笔买卖是什么？最难的是什么？', options: ['想说几句'] },
    craft: { question: '学什么手艺？学了多久？第一个活是什么？', options: ['想说几句'] },
    military: { question: '在哪儿当兵？当了几年？最记得的一件事？', options: ['想说几句'] },
    further_study: { question: '接着念的是什么？最难的是哪一步？', options: ['想说几句'] },
    home: { question: '在家里主要做什么？累吗？有奔头吗？', options: ['想说几句'] },
    drifting: { question: '都去过哪儿？怎么养活自己的？', options: ['想说几句'] },
  };

  const prompt = careerPrompts[careerType] || { question: '能多说说吗？', options: ['想说几句'] };

  return {
    content: prompt.question,
    options: prompt.options.map((label) => ({ label, value: label })),
    shouldContinue: strategy !== 'close',
    strategy,
  };
}

/**
 * Q6 伴侣深追链（逐步深入：初见 → 记忆 → 现状 → 遗憾 → 寄语）
 */
function q06PartnerFollowup(ctx: DeepFollowupContext, currentLayer: string): DeepFollowupResult {
  const strategy = determineStrategy(ctx.totalInputLength);

  if (strategy === 'close') {
    return {
      content: '您说的这些真让人感动。',
      options: [
        { label: '我还想多说几句', value: 'continue' },
        { label: '够了，往下聊', value: 'enough' },
      ],
      shouldContinue: false,
      strategy: 'close',
    };
  }

  const layers: Record<string, DeepFollowupResult> = {
    q06_partner_how: {
      content: '还记得第一次见面是什么样子吗？在哪儿？ta什么样？您什么感觉？',
      options: [{ label: '想说几句', value: 'share' }, { label: '记不清了', value: 'forgot' }],
      shouldContinue: true,
      strategy: 'deepen',
    },
    q06_partner_first: {
      content: '在一起最让您记得的一段日子是什么时候？',
      options: [
        { label: '刚在一起那阵子', value: 'early' },
        { label: '最难的时候', value: 'hardship' },
        { label: '有了孩子之后', value: 'children' },
        { label: '老了以后', value: 'old' },
      ],
      shouldContinue: true,
      strategy: 'deepen',
    },
    q06_partner_alive: {
      content: 'ta现在还在吗？',
      options: [
        { label: '在', value: 'alive' },
        { label: '不在了', value: 'deceased' },
      ],
      shouldContinue: true,
      strategy: 'deepen',
    },
  };

  return layers[currentLayer] || {
    content: '对ta最想说什么？',
    options: [
      { label: '谢谢你', value: 'thanks' },
      { label: '对不起', value: 'sorry' },
      { label: '不用担心我', value: 'dont_worry' },
      { label: '其他', value: 'other' },
    ],
    shouldContinue: false,
    strategy: 'close',
  };
}

/**
 * Q7 子女深追
 */
function q07ChildrenFollowup(ctx: DeepFollowupContext, focusType: string): DeepFollowupResult {
  const strategy = determineStrategy(ctx.totalInputLength);

  const prompts: Record<string, string> = {
    all_fine: '孩子们各有各的好，有没有让您特别欣慰的一件事？',
    struggles: '最难的是哪一个？为什么？',
    worried: '最放心不下的是什么？',
    proud: 'ta做了什么让您特别骄傲？',
    mixed_distance: '走得近的和走得远的，有什么不一样？',
  };

  return {
    content: prompts[focusType] || '能多说说吗？',
    options: [
      { label: '想说几句', value: 'share' },
    ],
    shouldContinue: strategy !== 'close',
    strategy,
  };
}

/**
 * Q10 最深追链——分三大分支
 */
function q10BranchFollowup(ctx: DeepFollowupContext, branch: string, currentLayer: string): DeepFollowupResult {
  const strategy = determineStrategy(ctx.totalInputLength);

  if (strategy === 'close') {
    return {
      content: '这一段已经很完整了。',
      options: [
        { label: '还想再补几句', value: 'add' },
        { label: '够了，继续', value: 'enough' },
      ],
      shouldContinue: false,
      strategy: 'close',
    };
  }

  // Achievement branch
  const achievementLayers: Record<string, DeepFollowupResult> = {
    q10_achievement_what: {
      content: '那时候您大概多大？',
      options: [
        { label: '二三十岁', value: 'young' },
        { label: '四十来岁', value: 'mid' },
        { label: '更往后了', value: 'later' },
      ],
      shouldContinue: true,
      strategy: 'deepen',
    },
    q10_achievement_age: {
      content: '当时心里什么感觉？',
      options: [
        { label: '痛快', value: 'thrilled' },
        { label: '松了口气', value: 'relieved' },
        { label: '觉得自己挺了不起', value: 'proud' },
        { label: '说不清', value: 'unclear' },
      ],
      shouldContinue: true,
      strategy: 'deepen',
    },
    q10_achievement_feeling: {
      content: '有人为您高兴吗？后来对您有什么影响？',
      options: [
        { label: '有，很多人', value: 'many' },
        { label: '就一两个人', value: 'few' },
        { label: '好像没有', value: 'none' },
      ],
      shouldContinue: false,
      strategy: 'close',
    },
  };

  // Person branch
  const personLayers: Record<string, DeepFollowupResult> = {
    q10_person_who: {
      content: 'ta改变了您什么？',
      options: [
        { label: '性格', value: 'personality' },
        { label: '活法', value: 'lifestyle' },
        { label: '让我看清了人', value: 'insight' },
      ],
      shouldContinue: true,
      strategy: 'deepen',
    },
    q10_person_change: {
      content: '您最想对ta说的一句话是什么？',
      options: [
        { label: '想说几句', value: 'share' },
      ],
      shouldContinue: false,
      strategy: 'close',
    },
  };

  // Disaster branch
  const disasterLayers: Record<string, DeepFollowupResult> = {
    q10_disaster_what: {
      content: '当时谁在身边？',
      options: [
        { label: '家人', value: 'family' },
        { label: '朋友', value: 'friend' },
        { label: '就自己', value: 'alone' },
      ],
      shouldContinue: true,
      strategy: 'deepen',
    },
    q10_disaster_who: {
      content: '怎么熬过来的？',
      options: [
        { label: '硬扛', value: 'endure' },
        { label: '有人帮', value: 'helped' },
        { label: '不知道怎么就过了', value: 'unclear' },
      ],
      shouldContinue: true,
      strategy: 'deepen',
    },
    q10_disaster_how: {
      content: '之后对日子的看法变了吗？',
      options: [
        { label: '更珍惜了', value: 'cherish' },
        { label: '看淡了', value: 'detached' },
        { label: '没什么变化', value: 'unchanged' },
      ],
      shouldContinue: false,
      strategy: 'close',
    },
  };

  if (branch === 'achievement') return achievementLayers[currentLayer] || { content: '', options: [], shouldContinue: false, strategy: 'close' };
  if (branch === 'person') return personLayers[currentLayer] || { content: '', options: [], shouldContinue: false, strategy: 'close' };
  return disasterLayers[currentLayer] || { content: '', options: [], shouldContinue: false, strategy: 'close' };
}

/**
 * 主入口：根据当前题目 ID 和上下文生成下一层动态追问
 */
export function generateDeepFollowup(
  questionId: string,
  ctx: DeepFollowupContext,
): DeepFollowupResult | null {
  // Q1 逐人追问
  if (questionId === 'q01_persona' || questionId.startsWith('q01_persona_')) {
    return q01PersonaFollowup(ctx, questionId);
  }

  // Q3 童年记忆深挖
  if (questionId === 'q03_focus') {
    const focusAnswer = ctx.previousAnswers.find((a) => a.questionId === 'q03_focus');
    return q03DeepFollowup(ctx, focusAnswer?.selectedOptions[0] || '');
  }

  // Q4 学校记忆深挖
  if (questionId === 'q04_memory') {
    const memoryAnswer = ctx.previousAnswers.find((a) => a.questionId === 'q04_memory');
    return q04DeepFollowup(ctx, memoryAnswer?.selectedOptions[0] || '');
  }

  // Q5 职业深挖
  if (questionId === 'q05_entry') {
    const careerAnswer = ctx.previousAnswers.find((a) => a.questionId === 'q05_entry');
    return q05CareerDeepFollowup(ctx, careerAnswer?.selectedOptions[0] || '');
  }

  // Q6 伴侣深追
  if (questionId.startsWith('q06_partner')) {
    return q06PartnerFollowup(ctx, questionId);
  }

  // Q7 子女深追
  if (questionId === 'q07_entry') {
    const focusAnswer = ctx.previousAnswers.find((a) => a.questionId === 'q07_entry');
    return q07ChildrenFollowup(ctx, focusAnswer?.selectedOptions[0] || '');
  }

  // Q10 最深追
  if (questionId.startsWith('q10_achievement')) {
    return q10BranchFollowup(ctx, 'achievement', questionId);
  }
  if (questionId.startsWith('q10_person')) {
    return q10BranchFollowup(ctx, 'person', questionId);
  }
  if (questionId.startsWith('q10_disaster')) {
    return q10BranchFollowup(ctx, 'disaster', questionId);
  }

  return null;
}

/**
 * 判断当前追问链是否可以收束
 */
export function shouldCloseChain(ctx: DeepFollowupContext): boolean {
  return ctx.totalInputLength > ADAPTIVE_THRESHOLDS.rich;
}
