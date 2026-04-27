export type AnswerMode = 'single' | 'multi' | 'text' | 'hybrid';
export type NarrativeRole =
  | 'profile'
  | 'relationship'
  | 'daily_life'
  | 'representative_event'
  | 'era_context'
  | 'reflection';
export type MaterialType =
  | 'person'
  | 'scene'
  | 'event'
  | 'quote'
  | 'object'
  | 'emotion'
  | 'timeline'
  | 'mixed';
export type DraftImportance = 'core_2000' | 'optional_reserve' | 'expansion_lead';
export type QuestionPhase = 'base' | 'extension' | 'closure';

export interface NestedQuestion {
  id: string;
  content: string;
  options: QuestionOption[];
  answerMode: AnswerMode;
  required?: boolean;
}

export interface QuestionOption {
  label: string;
  value: string;
  allowCustom?: boolean;
  followupQuestions?: NestedQuestion[];
}

export interface QuestionTemplate {
  id: string;
  content: string;
  hint?: string;
  options: QuestionOption[];
  topicTags: string[];
  detailTags: string[];
  stageTag: string;
  demographicTags?: string[];
  triggerKeywords?: string[];
  followupQuestions?: string[];
  condition?: string | null;
  answerMode: AnswerMode;
  minChoices?: number;
  maxChoices?: number;
  allowTextDetails?: boolean;
  responseCardinality?: 'open' | 'single_focus' | 'multiple_optional' | 'three_items_recommended';
  suggestedAnswerCount?: number;
  narrativeRole: NarrativeRole;
  materialType: MaterialType;
  draftImportance: DraftImportance;
  phase?: QuestionPhase;
  adaptable?: boolean;
}

export const topicPriority = [
  '来时路',
  '童年',
  '求学',
  '青年闯荡',
  '重要关系',
  '晚年回望',
] as const;

export type StageTag = (typeof topicPriority)[number];

const phaseAnnotations: Record<string, { phase: QuestionPhase; adaptable?: boolean }> = {
  q01_entry: { phase: 'base' },
  q01_persona: { phase: 'base' },
  q01_persona_age: { phase: 'base' },
  q01_persona_saying: { phase: 'base' },
  q01_persona_deed: { phase: 'base' },
  q01_sibling_switch: { phase: 'base' },
  q01_close: { phase: 'base' },

  q02_entry: { phase: 'base' },
  q02_has_count: { phase: 'base' },
  q02_ranking: { phase: 'base' },
  q02_closest: { phase: 'base' },
  q02_sibling_status: { phase: 'base' },
  q02_only_reason: { phase: 'base' },
  q02_only_feeling: { phase: 'base' },
  q02_close: { phase: 'base' },

  q03_entry: { phase: 'base' },
  q03_focus: { phase: 'base' },
  q03_deep: { phase: 'base' },

  q04_entry: { phase: 'base' },
  q04_memory: { phase: 'base' },
  q04_teacher_name: { phase: 'base' },
  q04_teacher_persona: { phase: 'base' },
  q04_teacher_saying: { phase: 'base' },
  q04_classmate_name: { phase: 'base' },
  q04_classmate_status: { phase: 'base' },
  q04_event_detail: { phase: 'base' },

  q05_entry: { phase: 'base' },
  q05_career_detail: { phase: 'base' },
  q05_proud_check: { phase: 'base' },
  q05_proud_detail: { phase: 'base' },

  q06_entry: { phase: 'base' },
  q06_partner_name: { phase: 'base' },
  q06_partner_how: { phase: 'base' },
  q06_partner_first: { phase: 'base' },
  q06_partner_memory: { phase: 'base' },
  q06_partner_alive: { phase: 'base' },
  q06_partner_regret: { phase: 'base' },
  q06_partner_message: { phase: 'base' },
  q06_nonpartner_who: { phase: 'base' },
  q06_nonpartner_how: { phase: 'base' },
  q06_nonpartner_change: { phase: 'base' },

  q07_entry: { phase: 'base' },
  q07_focus: { phase: 'base' },
  q07_taught: { phase: 'base' },

  q08_entry: { phase: 'base' },

  q09_entry: { phase: 'base' },

  q10_entry: { phase: 'base' },
  q10_achievement_what: { phase: 'base' },
  q10_achievement_age: { phase: 'base' },
  q10_achievement_feeling: { phase: 'base' },
  q10_achievement_impact: { phase: 'base' },
  q10_person_who: { phase: 'base' },
  q10_person_change: { phase: 'base' },
  q10_person_message: { phase: 'base' },
  q10_disaster_what: { phase: 'base' },
  q10_disaster_who: { phase: 'base' },
  q10_disaster_how: { phase: 'base' },
  q10_disaster_change: { phase: 'base' },

  q11_entry: { phase: 'base' },
  q11_focus: { phase: 'base' },
  q11_thank_what: { phase: 'base' },
  q11_said: { phase: 'base' },
  q11_express: { phase: 'base' },

  q12_entry: { phase: 'closure' },
  q12_score: { phase: 'closure' },
  q12_word: { phase: 'closure' },
};

function opt(label: string, value: string, allowCustom = false): QuestionOption {
  return { label, value, ...(allowCustom ? { allowCustom: true } : {}) };
}

function parent(label: string, value: string, children: NestedQuestion[]): QuestionOption {
  return { label, value, followupQuestions: children };
}

function child(id: string, content: string, answerMode: AnswerMode, ...labels: string[]): NestedQuestion {
  return {
    id,
    content,
    answerMode,
    options: labels.map((l, i) => ({
      label: l,
      value: l,
      ...(i === labels.length - 1 && l === '其他' ? { allowCustom: true } : {}),
    })),
  };
}

// ============================================================
// Q1: 来时路 — 您小时候是谁带大的？
// ============================================================

const q01 = (() => {
  const entry: QuestionTemplate = {
    id: 'q01_entry',
    content: '您小时候，是谁带大的？',
    hint: '可以多选。这是您回忆录的开篇，我们一个一个聊。',
    options: [
      opt('爸爸', 'father'),
      opt('妈妈', 'mother'),
      opt('爷爷', 'grandpa_p'),
      opt('奶奶', 'grandma_p'),
      opt('姥爷', 'grandpa_m'),
      opt('姥姥', 'grandma_m'),
      opt('别的亲人', 'other_kin', true),
    ],
    topicTags: ['来时路', '家庭起源'],
    detailTags: ['抚养者'],
    stageTag: '来时路',
    answerMode: 'multi',
    narrativeRole: 'profile',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q01_persona'],
  };

  const persona: QuestionTemplate = {
    id: 'q01_persona',
    content: '还记得{PERSON}是个什么样的人吗？',
    options: [
      parent('能吃苦', 'endurance', [
        child('q01_endurance_deep', '有没有一件具体的事，让您觉得{PERSON}真能吃苦？', 'hybrid', '有', '好像没有'),
      ]),
      parent('手巧，什么都会做', 'handy', [
        child('q01_handy_deep', '{PERSON}最拿手的是什么？有没有什么东西是{PERSON}做了留给您的？', 'hybrid', '有', '想不起来了'),
      ]),
      parent('严厉，管得紧', 'strict', [
        child('q01_strict_deep', '最让您记得的一次管教是什么事？', 'hybrid', '有', '好像没有'),
      ]),
      parent('不爱说话，闷头做事', 'quiet', [
        child('q01_quiet_deep', '不说话的时候，{PERSON}都在忙什么？', 'hybrid', '有', '想不起来了'),
      ]),
      parent('疼我', 'loving', [
        child('q01_loving_deep', '最疼您的一次，是什么样的？', 'hybrid', '有', '好像没有'),
      ]),
      parent('爱说爱笑，热闹人', 'lively', [
        child('q01_lively_deep', '{PERSON}有没有说过一句您现在还记得的话？', 'hybrid', '有', '想不起来了'),
      ]),
      opt('其他', 'other', true),
    ],
    topicTags: ['来时路', '人物速写'],
    detailTags: ['性格'],
    stageTag: '来时路',
    answerMode: 'single',
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q01_persona_age'],
  };

  const personaAge: QuestionTemplate = {
    id: 'q01_persona_age',
    content: '那时候您大概多大？',
    hint: '如果有想说的，也可以写几个字。',
    options: [
      opt('还没上学', 'preschool'),
      opt('上小学前后', 'primary'),
      opt('十来岁了', 'teen'),
      opt('记不太清了', 'unclear'),
    ],
    topicTags: ['来时路', '时间锚'],
    detailTags: ['年龄'],
    stageTag: '来时路',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'profile',
    materialType: 'timeline',
    draftImportance: 'core_2000',
    followupQuestions: ['q01_persona_saying'],
  };

  const personaSaying: QuestionTemplate = {
    id: 'q01_persona_saying',
    content: '{PERSON}有没有说过一句您现在还记得的话？',
    hint: '如果有想说的，也可以写几个字。',
    options: [
      opt('有一句', 'yes'),
      opt('想不起来了', 'forgot'),
      opt('好像没说过什么特别的', 'none'),
    ],
    topicTags: ['来时路', '语言记忆'],
    detailTags: ['原话'],
    stageTag: '来时路',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'relationship',
    materialType: 'quote',
    draftImportance: 'core_2000',
    followupQuestions: ['q01_persona_deed'],
  };

  const personaDeed: QuestionTemplate = {
    id: 'q01_persona_deed',
    content: '{PERSON}有没有做过一件您现在想起来还放不下的事？',
    hint: '如果有想说的，也可以写几个字。',
    options: [
      opt('有', 'yes'),
      opt('好像没有', 'none'),
      opt('有，但不方便说', 'private'),
    ],
    topicTags: ['来时路', '人物事件'],
    detailTags: ['记忆'],
    stageTag: '来时路',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'representative_event',
    materialType: 'event',
    draftImportance: 'core_2000',
  };

  const siblingSwitch: QuestionTemplate = {
    id: 'q01_sibling_switch',
    content: '那会儿，家里还有兄弟姐妹吗？',
    options: [
      opt('有', 'has_siblings'),
      opt('就我一个', 'only_child'),
    ],
    topicTags: ['来时路', '家庭结构'],
    detailTags: ['兄弟姐妹'],
    stageTag: '来时路',
    answerMode: 'single',
    narrativeRole: 'profile',
    materialType: 'person',
    draftImportance: 'core_2000',
  };

  const close: QuestionTemplate = {
    id: 'q01_close',
    content: '不管是苦是甜，您觉得这个家给了您什么，您带了一辈子的？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['来时路', '回望'],
    detailTags: ['传承'],
    stageTag: '来时路',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'reflection',
    materialType: 'emotion',
    draftImportance: 'core_2000',
  };

  return [entry, persona, personaAge, personaSaying, personaDeed, siblingSwitch, close];
})();

// ============================================================
// Q2: 兄弟姐妹
// ============================================================

const q02 = (() => {
  const entry: QuestionTemplate = {
    id: 'q02_entry',
    content: '您有几个兄弟姐妹？',
    hint: '不包括自己。',
    options: [
      parent('1个', '1', [
        child('q02_one_type', '是哥哥、弟弟、姐姐还是妹妹？', 'single', '哥哥', '弟弟', '姐姐', '妹妹'),
      ]),
      parent('2个', '2', [
        child('q02_two_combo', '怎么排的？', 'single', '一哥一弟', '两个哥哥', '一哥一姐', '两个姐姐', '一姐一妹', '其他'),
      ]),
      parent('3个', '3', []),
      parent('4个及以上', '4plus', []),
      parent('我是独生的', 'only', []),
    ],
    topicTags: ['来时路', '手足'],
    detailTags: ['兄弟姐妹'],
    stageTag: '来时路',
    answerMode: 'single',
    narrativeRole: 'profile',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q02_ranking'],
  };

  const ranking: QuestionTemplate = {
    id: 'q02_ranking',
    content: '您排第几？',
    options: [
      opt('老大', 'oldest'),
      opt('中间', 'middle'),
      opt('老小', 'youngest'),
    ],
    topicTags: ['来时路', '手足'],
    detailTags: ['排行'],
    stageTag: '来时路',
    answerMode: 'single',
    narrativeRole: 'profile',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q02_closest'],
  };

  const closest: QuestionTemplate = {
    id: 'q02_closest',
    content: '跟谁最亲近？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['来时路', '手足'],
    detailTags: ['亲近'],
    stageTag: '来时路',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q02_sibling_status'],
  };

  const siblingStatus: QuestionTemplate = {
    id: 'q02_sibling_status',
    content: 'ta们现在还好吗？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['来时路', '手足'],
    detailTags: ['现状'],
    stageTag: '来时路',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
  };

  const onlyReason: QuestionTemplate = {
    id: 'q02_only_reason',
    content: '那个年代独生挺少见的。',
    options: [opt('想说几句', 'share')],
    topicTags: ['来时路', '独生'],
    detailTags: ['原因'],
    stageTag: '来时路',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'profile',
    materialType: 'emotion',
    draftImportance: 'core_2000',
    followupQuestions: ['q02_only_feeling'],
  };

  const onlyFeeling: QuestionTemplate = {
    id: 'q02_only_feeling',
    content: '就您一个，是被疼得最多，还是也有不一样的感觉？',
    hint: '如果有想说的，也可以写几个字。',
    options: [
      opt('被疼得最多', 'most_loved'),
      opt('有点孤单', 'lonely'),
      opt('没什么特别的感觉', 'normal'),
      opt('其他', 'other', true),
    ],
    topicTags: ['来时路', '独生'],
    detailTags: ['感受'],
    stageTag: '来时路',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'reflection',
    materialType: 'emotion',
    draftImportance: 'core_2000',
  };

  return [entry, ranking, closest, siblingStatus, onlyReason, onlyFeeling];
})();

// ============================================================
// Q3: 童年记忆 — 开心和委屈
// ============================================================

const q03 = (() => {
  const entry: QuestionTemplate = {
    id: 'q03_entry',
    content: '小时候，有没有让您记得特别深的事？开心的、难过的、得意的、委屈的——都算。',
    options: [
      opt('有过一件特别高兴的事', 'happy'),
      opt('有过一件特别得意的事', 'proud'),
      opt('有过一件特别委屈的事', 'wronged'),
      opt('有过一件特别难过的事', 'sad'),
      opt('好像没有特别的事', 'none'),
      opt('其他', 'other', true),
    ],
    topicTags: ['童年', '情感记忆'],
    detailTags: ['记忆'],
    stageTag: '童年',
    answerMode: 'multi',
    narrativeRole: 'representative_event',
    materialType: 'emotion',
    draftImportance: 'core_2000',
    followupQuestions: ['q03_focus'],
  };

  const focus: QuestionTemplate = {
    id: 'q03_focus',
    content: '您提到了好几件，咱们先聊哪一件？',
    hint: '先聊最有画面感的那一件。',
    options: [
      opt('高兴的那件', 'happy'),
      opt('得意的那件', 'proud'),
      opt('委屈的那件', 'wronged'),
      opt('难过的那件', 'sad'),
    ],
    topicTags: ['童年', '情感记忆'],
    detailTags: ['聚焦'],
    stageTag: '童年',
    answerMode: 'single',
    narrativeRole: 'representative_event',
    materialType: 'emotion',
    draftImportance: 'core_2000',
    followupQuestions: ['q03_deep'],
  };

  const deep: QuestionTemplate = {
    id: 'q03_deep',
    content: '是什么事？那时候多大？谁在场？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['童年', '情感记忆'],
    detailTags: ['深挖'],
    stageTag: '童年',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'representative_event',
    materialType: 'event',
    draftImportance: 'core_2000',
  };

  return [entry, focus, deep];
})();

// ============================================================
// Q4: 学校生活
// ============================================================

const q04 = (() => {
  const entry: QuestionTemplate = {
    id: 'q04_entry',
    content: '聊聊您上学的时候吧。您上到什么时候？',
    options: [
      opt('小学', 'primary'),
      opt('初中', 'junior'),
      opt('高中/中专', 'senior'),
      opt('大学/专科', 'college'),
      opt('跟师傅学的，没怎么上正式学校', 'apprentice'),
      opt('基本没上过学', 'no_school'),
      opt('其他', 'other', true),
    ],
    topicTags: ['求学', '教育程度'],
    detailTags: ['学历'],
    stageTag: '求学',
    answerMode: 'single',
    narrativeRole: 'profile',
    materialType: 'event',
    draftImportance: 'core_2000',
    followupQuestions: ['q04_memory'],
  };

  const memory: QuestionTemplate = {
    id: 'q04_memory',
    content: '上学那几年，您最记得什么？',
    options: [
      parent('有一位让我印象深的老师', 'teacher', [
        child('q04_teacher_name', 'ta姓什么？教什么？', 'hybrid', '想说几句'),
      ]),
      parent('有一个特别要好的同学/同桌', 'classmate', [
        child('q04_classmate_name', 'ta叫什么？为什么好？还联系吗？', 'hybrid', '想说几句'),
      ]),
      parent('有一件事，记得特别清楚', 'event', [
        child('q04_event_detail', '是什么事？多大？后来怎么样了？', 'hybrid', '想说几句'),
      ]),
      parent('学校的样子/上学的路', 'scene', [
        child('q04_scene_detail', '学校什么样？上学的路是什么样的？', 'hybrid', '想说几句'),
      ]),
      opt('好像没什么特别记得的', 'nothing'),
    ],
    topicTags: ['求学', '学校记忆'],
    detailTags: ['记忆'],
    stageTag: '求学',
    answerMode: 'multi',
    narrativeRole: 'representative_event',
    materialType: 'event',
    draftImportance: 'core_2000',
  };

  const teacherName: QuestionTemplate = {
    id: 'q04_teacher_name',
    content: 'ta姓什么？教什么？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['求学', '师长'],
    detailTags: ['身份'],
    stageTag: '求学',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q04_teacher_persona'],
  };

  const teacherPersona: QuestionTemplate = {
    id: 'q04_teacher_persona',
    content: 'ta是个什么样的人？',
    options: [
      opt('严厉', 'strict'),
      opt('温和', 'gentle'),
      opt('有本事，让人服气', 'skilled'),
      opt('教得耐心', 'patient'),
      opt('帮过我大忙', 'helpful'),
      opt('其他', 'other', true),
    ],
    topicTags: ['求学', '师长'],
    detailTags: ['性格'],
    stageTag: '求学',
    answerMode: 'multi',
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q04_teacher_saying'],
  };

  const teacherSaying: QuestionTemplate = {
    id: 'q04_teacher_saying',
    content: 'ta有没有说过一句您现在还记得的话？那句话说的时候是为什么？后来还起过作用吗？',
    hint: '如果有想说的，也可以写几个字。',
    options: [
      opt('有一句', 'yes'),
      opt('想不起来了', 'forgot'),
    ],
    topicTags: ['求学', '师长'],
    detailTags: ['原话'],
    stageTag: '求学',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'relationship',
    materialType: 'quote',
    draftImportance: 'core_2000',
  };

  const classmateName: QuestionTemplate = {
    id: 'q04_classmate_name',
    content: 'ta叫什么？为什么好？还联系吗？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['求学', '同学'],
    detailTags: ['友谊'],
    stageTag: '求学',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
  };

  const classmateStatus: QuestionTemplate = {
    id: 'q04_classmate_status',
    content: '现在还联系吗？',
    options: [
      opt('还联系', 'yes'),
      opt('不联系了', 'no'),
      opt('已经不在了', 'deceased'),
    ],
    topicTags: ['求学', '同学'],
    detailTags: ['现状'],
    stageTag: '求学',
    answerMode: 'single',
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'optional_reserve',
  };

  const eventDetail: QuestionTemplate = {
    id: 'q04_event_detail',
    content: '是什么事？多大？后来怎么样了？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['求学', '记忆事件'],
    detailTags: ['事件'],
    stageTag: '求学',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'representative_event',
    materialType: 'event',
    draftImportance: 'core_2000',
  };

  return [entry, memory, teacherName, teacherPersona, teacherSaying, classmateName, classmateStatus, eventDetail];
})();

// ============================================================
// Q5: 青年闯荡
// ============================================================

const q05 = (() => {
  const entry: QuestionTemplate = {
    id: 'q05_entry',
    content: '读完书（或离开学校）以后，您那会儿做了什么？',
    options: [
      opt('种地/干农活', 'farming'),
      opt('进了工厂/单位', 'factory'),
      opt('自己做买卖/摆摊', 'business'),
      opt('学手艺/跟师傅', 'craft'),
      opt('参军/当兵', 'military'),
      opt('接着念书了', 'further_study'),
      opt('在家里做事', 'home'),
      opt('到处跑，没固定下来', 'drifting'),
      opt('其他', 'other', true),
    ],
    topicTags: ['青年闯荡', '职业路径'],
    detailTags: ['方向'],
    stageTag: '青年闯荡',
    answerMode: 'single',
    narrativeRole: 'profile',
    materialType: 'event',
    draftImportance: 'core_2000',
    followupQuestions: ['q05_career_detail'],
  };

  const careerDetail: QuestionTemplate = {
    id: 'q05_career_detail',
    content: '能多说说吗？',
    hint: '比如：在哪儿？跟谁一起？最难的是什么？如果有想说的，也可以写几个字。',
    options: [
      opt('想说几句', 'share'),
    ],
    topicTags: ['青年闯荡', '职业细节'],
    detailTags: ['细节'],
    stageTag: '青年闯荡',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'profile',
    materialType: 'event',
    draftImportance: 'core_2000',
    followupQuestions: ['q05_proud_check'],
  };

  const proudCheck: QuestionTemplate = {
    id: 'q05_proud_check',
    content: '那段时间，有没有一件事让您觉得"这事我干得不错"？',
    options: [
      opt('有', 'yes'),
      opt('好像没有', 'no'),
    ],
    topicTags: ['青年闯荡', '成就感'],
    detailTags: ['成就'],
    stageTag: '青年闯荡',
    answerMode: 'single',
    narrativeRole: 'representative_event',
    materialType: 'emotion',
    draftImportance: 'core_2000',
    followupQuestions: ['q05_proud_detail'],
  };

  const proudDetail: QuestionTemplate = {
    id: 'q05_proud_detail',
    content: '什么事？那时候多大？后来对您有什么影响？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['青年闯荡', '成就感'],
    detailTags: ['事件'],
    stageTag: '青年闯荡',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'representative_event',
    materialType: 'event',
    draftImportance: 'core_2000',
  };

  return [entry, careerDetail, proudCheck, proudDetail];
})();

// ============================================================
// Q6: 重要的人
// ============================================================

const q06 = (() => {
  const entry: QuestionTemplate = {
    id: 'q06_entry',
    content: '这些年，有没有一位对您特别重要的人？',
    options: [
      opt('有，是我老伴儿（或以前的爱人）', 'partner'),
      opt('有，但不是老伴儿——是子女/朋友/其他亲人', 'other_person'),
      opt('没有特别的人', 'none'),
      opt('不方便说', 'private'),
    ],
    topicTags: ['重要关系', '核心人物'],
    detailTags: ['关系'],
    stageTag: '重要关系',
    answerMode: 'single',
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
  };

  const partnerName: QuestionTemplate = {
    id: 'q06_partner_name',
    content: 'ta叫什么名字？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['重要关系', '伴侣'],
    detailTags: ['名字'],
    stageTag: '重要关系',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q06_partner_how'],
  };

  const partnerHow: QuestionTemplate = {
    id: 'q06_partner_how',
    content: '你们怎么认识的？',
    options: [
      opt('别人介绍的', 'introduced'),
      opt('自己认识的', 'self'),
      opt('从小认识的', 'childhood'),
      opt('工作认识的', 'work'),
      opt('其他', 'other', true),
    ],
    topicTags: ['重要关系', '伴侣'],
    detailTags: ['相识'],
    stageTag: '重要关系',
    answerMode: 'single',
    narrativeRole: 'representative_event',
    materialType: 'event',
    draftImportance: 'core_2000',
    followupQuestions: ['q06_partner_first'],
  };

  const partnerFirst: QuestionTemplate = {
    id: 'q06_partner_first',
    content: '还记得第一次见面是什么样子吗？在哪儿见的？ta什么样？您当时什么感觉？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['重要关系', '伴侣'],
    detailTags: ['初见'],
    stageTag: '重要关系',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'representative_event',
    materialType: 'scene',
    draftImportance: 'core_2000',
    followupQuestions: ['q06_partner_memory'],
  };

  const partnerMemory: QuestionTemplate = {
    id: 'q06_partner_memory',
    content: '在一起最让您记得的一段日子是什么时候？',
    hint: '如果有想说的，也可以写几个字。',
    options: [
      opt('刚在一起那阵子', 'early'),
      opt('最难的时候', 'hardship'),
      opt('有了孩子之后', 'children'),
      opt('老了以后', 'old'),
      opt('其他', 'other', true),
    ],
    topicTags: ['重要关系', '伴侣'],
    detailTags: ['记忆'],
    stageTag: '重要关系',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'representative_event',
    materialType: 'event',
    draftImportance: 'core_2000',
    followupQuestions: ['q06_partner_alive'],
  };

  const partnerAlive: QuestionTemplate = {
    id: 'q06_partner_alive',
    content: 'ta现在还在吗？',
    options: [
      opt('在', 'alive'),
      opt('不在了', 'deceased'),
    ],
    topicTags: ['重要关系', '伴侣'],
    detailTags: ['现状'],
    stageTag: '重要关系',
    answerMode: 'single',
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
  };

  const partnerRegret: QuestionTemplate = {
    id: 'q06_partner_regret',
    content: '最后一面是什么时候？有没有什么话后悔没说或没做的？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['重要关系', '伴侣'],
    detailTags: ['遗憾'],
    stageTag: '重要关系',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'reflection',
    materialType: 'emotion',
    draftImportance: 'core_2000',
    followupQuestions: ['q06_partner_message'],
  };

  const partnerMessage: QuestionTemplate = {
    id: 'q06_partner_message',
    content: '现在对ta最想说什么？',
    hint: '如果有想说的，也可以写几个字。',
    options: [
      opt('谢谢你陪了我这些年', 'thanks'),
      opt('下辈子还一起过', 'next_life'),
      opt('对不起', 'sorry'),
      opt('不用担心我', 'dont_worry'),
      opt('其他', 'other', true),
    ],
    topicTags: ['重要关系', '伴侣'],
    detailTags: ['心里话'],
    stageTag: '重要关系',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'reflection',
    materialType: 'quote',
    draftImportance: 'core_2000',
  };

  const nonpartnerWho: QuestionTemplate = {
    id: 'q06_nonpartner_who',
    content: 'ta是谁？',
    hint: '比如：子女、朋友、老师/师傅、其他亲人。如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['重要关系', '重要他人'],
    detailTags: ['身份'],
    stageTag: '重要关系',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q06_nonpartner_how'],
  };

  const nonpartnerHow: QuestionTemplate = {
    id: 'q06_nonpartner_how',
    content: '怎么认识的？',
    options: [
      opt('别人介绍的', 'introduced'),
      opt('自己认识的', 'self'),
      opt('从小就认识', 'childhood'),
      opt('工作认识的', 'work'),
      opt('其他', 'other', true),
    ],
    topicTags: ['重要关系', '重要他人'],
    detailTags: ['相识'],
    stageTag: '重要关系',
    answerMode: 'single',
    narrativeRole: 'representative_event',
    materialType: 'event',
    draftImportance: 'core_2000',
    followupQuestions: ['q06_nonpartner_change'],
  };

  const nonpartnerChange: QuestionTemplate = {
    id: 'q06_nonpartner_change',
    content: 'ta改变了您什么？',
    hint: '如果有想说的，也可以写几个字。',
    options: [
      opt('性格', 'personality'),
      opt('活法', 'lifestyle'),
      opt('让我看清了人', 'insight'),
      opt('其他', 'other', true),
    ],
    topicTags: ['重要关系', '重要他人'],
    detailTags: ['影响'],
    stageTag: '重要关系',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'reflection',
    materialType: 'emotion',
    draftImportance: 'core_2000',
  };

  return [entry, partnerName, partnerHow, partnerFirst, partnerMemory, partnerAlive, partnerRegret, partnerMessage, nonpartnerWho, nonpartnerHow, nonpartnerChange];
})();

// ============================================================
// Q7: 孩子（条件：有子女）
// ============================================================

const q07 = (() => {
  const entry: QuestionTemplate = {
    id: 'q07_entry',
    content: '聊聊孩子们吧。他们现在都怎么样？',
    condition: 'has_children',
    options: [
      opt('都挺好的，不用我操心', 'all_fine'),
      opt('各有各的难处', 'struggles'),
      opt('有一个我最放心不下', 'worried'),
      opt('有一个我特别骄傲', 'proud'),
      opt('有的走得近，有的远', 'mixed_distance'),
      opt('其他', 'other', true),
    ],
    topicTags: ['重要关系', '子女'],
    detailTags: ['现状'],
    stageTag: '重要关系',
    answerMode: 'multi',
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q07_focus'],
  };

  const focus: QuestionTemplate = {
    id: 'q07_focus',
    content: '能多说说吗？是老大、中间的还是最小的？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['重要关系', '子女'],
    detailTags: ['聚焦'],
    stageTag: '重要关系',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q07_taught'],
  };

  const taught: QuestionTemplate = {
    id: 'q07_taught',
    content: '您觉得您教会了他们什么？',
    options: [
      opt('怎么做人', 'character'),
      opt('怎么扛事', 'resilience'),
      opt('手艺/本事', 'skill'),
      opt('没什么可教的', 'nothing'),
      opt('是ta们教会了我很多', 'they_taught_me'),
      opt('其他', 'other', true),
    ],
    topicTags: ['重要关系', '子女'],
    detailTags: ['传承'],
    stageTag: '重要关系',
    answerMode: 'multi',
    narrativeRole: 'reflection',
    materialType: 'emotion',
    draftImportance: 'core_2000',
  };

  return [entry, focus, taught];
})();

// ============================================================
// Q8: 现在
// ============================================================

const q08 = (() => {
  const entry: QuestionTemplate = {
    id: 'q08_entry',
    content: '聊聊现在的日子吧。您身边都有谁？',
    options: [
      opt('父母（或公婆/岳父母）还在，要照顾', 'parents_alive'),
      opt('长辈都不在了', 'elders_gone'),
      opt('老伴儿还在', 'partner_alive'),
      opt('老伴儿不在了', 'partner_gone'),
      opt('兄弟姐妹还走动', 'siblings_contact'),
      opt('很少联系了', 'siblings_distant'),
      opt('孩子在身边', 'children_near'),
      opt('孩子在别的城市', 'children_away'),
      opt('孙子/孙女常来', 'grandkids_often'),
      opt('孙子/孙女见得少', 'grandkids_rare'),
      opt('有护工/保姆帮忙', 'caregiver'),
      opt('一个人住', 'live_alone'),
      opt('身体还行，自己料理没问题', 'healthy'),
      opt('身体不太方便，需要人搭把手', 'needs_help'),
    ],
    topicTags: ['晚年回望', '当下状态'],
    detailTags: ['关系网'],
    stageTag: '晚年回望',
    answerMode: 'multi',
    narrativeRole: 'daily_life',
    materialType: 'person',
    draftImportance: 'core_2000',
  };

  return [entry];
})();

// ============================================================
// Q9: 没说的话
// ============================================================

const q09 = (() => {
  const entry: QuestionTemplate = {
    id: 'q09_entry',
    content: '有没有什么话，您一直想说但还没说出来？',
    options: [
      opt('有，对某个人的感谢', 'gratitude'),
      opt('有，对某个人的抱歉', 'sorry'),
      opt('有，想交代给孩子们的事', 'instruction'),
      opt('有，一直闷在心里的委屈', 'grievance'),
      opt('没有', 'none'),
      opt('不方便说', 'private'),
    ],
    topicTags: ['晚年回望', '未言之语'],
    detailTags: ['表达'],
    stageTag: '晚年回望',
    answerMode: 'multi',
    narrativeRole: 'reflection',
    materialType: 'emotion',
    draftImportance: 'core_2000',
  };

  return [entry];
})();

// ============================================================
// Q10: 这辈子最记得的一件事
// ============================================================

const q10 = (() => {
  const entry: QuestionTemplate = {
    id: 'q10_entry',
    content: '这辈子，最让您记得的一件事是什么？',
    options: [
      opt('做成了一件大事/难事', 'achievement'),
      opt('遇到了一个特别重要的人', 'important_person'),
      opt('经历过一次大难', 'disaster'),
      opt('没什么特别记得的', 'nothing'),
      opt('其他', 'other', true),
    ],
    topicTags: ['晚年回望', '人生高光'],
    detailTags: ['记忆'],
    stageTag: '晚年回望',
    answerMode: 'single',
    narrativeRole: 'representative_event',
    materialType: 'event',
    draftImportance: 'core_2000',
  };

  const achievementWhat: QuestionTemplate = {
    id: 'q10_achievement_what',
    content: '是什么事？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['晚年回望', '成就'],
    detailTags: ['事件'],
    stageTag: '晚年回望',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'representative_event',
    materialType: 'event',
    draftImportance: 'core_2000',
    followupQuestions: ['q10_achievement_age'],
  };

  const achievementAge: QuestionTemplate = {
    id: 'q10_achievement_age',
    content: '那时候您大概多大？',
    options: [
      opt('二三十岁', 'young'),
      opt('四十来岁', 'mid'),
      opt('更往后了', 'later'),
    ],
    topicTags: ['晚年回望', '成就'],
    detailTags: ['时间'],
    stageTag: '晚年回望',
    answerMode: 'single',
    narrativeRole: 'representative_event',
    materialType: 'timeline',
    draftImportance: 'core_2000',
    followupQuestions: ['q10_achievement_feeling'],
  };

  const achievementFeeling: QuestionTemplate = {
    id: 'q10_achievement_feeling',
    content: '当时心里什么感觉？',
    options: [
      opt('痛快', 'thrilled'),
      opt('松了口气', 'relieved'),
      opt('觉得自己挺了不起', 'proud'),
      opt('累', 'tired'),
      opt('说不清', 'unclear'),
    ],
    topicTags: ['晚年回望', '成就'],
    detailTags: ['情绪'],
    stageTag: '晚年回望',
    answerMode: 'single',
    narrativeRole: 'representative_event',
    materialType: 'emotion',
    draftImportance: 'core_2000',
    followupQuestions: ['q10_achievement_impact'],
  };

  const achievementImpact: QuestionTemplate = {
    id: 'q10_achievement_impact',
    content: '后来对您有影响吗？',
    options: [
      opt('有，挺大的', 'big'),
      opt('有一点', 'some'),
      opt('没什么影响', 'none'),
    ],
    topicTags: ['晚年回望', '成就'],
    detailTags: ['影响'],
    stageTag: '晚年回望',
    answerMode: 'single',
    narrativeRole: 'reflection',
    materialType: 'emotion',
    draftImportance: 'core_2000',
  };

  const personWho: QuestionTemplate = {
    id: 'q10_person_who',
    content: '这个人是谁？',
    options: [
      opt('伴侣', 'partner'),
      opt('朋友', 'friend'),
      opt('老师/师傅', 'teacher'),
      opt('贵人', 'benefactor'),
      opt('其他', 'other', true),
    ],
    topicTags: ['晚年回望', '重要人物'],
    detailTags: ['身份'],
    stageTag: '晚年回望',
    answerMode: 'single',
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q10_person_change'],
  };

  const personChange: QuestionTemplate = {
    id: 'q10_person_change',
    content: 'ta改变了您什么？',
    hint: '如果有想说的，也可以写几个字。',
    options: [
      opt('性格', 'personality'),
      opt('活法', 'lifestyle'),
      opt('让我看清了人', 'insight'),
      opt('其他', 'other', true),
    ],
    topicTags: ['晚年回望', '重要人物'],
    detailTags: ['影响'],
    stageTag: '晚年回望',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'reflection',
    materialType: 'emotion',
    draftImportance: 'core_2000',
    followupQuestions: ['q10_person_message'],
  };

  const personMessage: QuestionTemplate = {
    id: 'q10_person_message',
    content: '您最想对ta说的一句话是什么？',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['晚年回望', '重要人物'],
    detailTags: ['心里话'],
    stageTag: '晚年回望',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'reflection',
    materialType: 'quote',
    draftImportance: 'core_2000',
  };

  const disasterWhat: QuestionTemplate = {
    id: 'q10_disaster_what',
    content: '是什么难？',
    options: [
      opt('自己生大病', 'illness'),
      opt('家人重病/去世', 'family_death'),
      opt('意外事故', 'accident'),
      opt('破产/丢工作', 'bankruptcy'),
      opt('其他', 'other', true),
    ],
    topicTags: ['晚年回望', '灾难'],
    detailTags: ['类型'],
    stageTag: '晚年回望',
    answerMode: 'single',
    narrativeRole: 'representative_event',
    materialType: 'event',
    draftImportance: 'core_2000',
    followupQuestions: ['q10_disaster_who'],
  };

  const disasterWho: QuestionTemplate = {
    id: 'q10_disaster_who',
    content: '当时谁在身边？',
    options: [
      opt('家人', 'family'),
      opt('朋友', 'friend'),
      opt('就自己', 'alone'),
      opt('其他', 'other', true),
    ],
    topicTags: ['晚年回望', '灾难'],
    detailTags: ['陪伴'],
    stageTag: '晚年回望',
    answerMode: 'single',
    narrativeRole: 'relationship',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q10_disaster_how'],
  };

  const disasterHow: QuestionTemplate = {
    id: 'q10_disaster_how',
    content: '怎么熬过来的？',
    options: [
      opt('硬扛', 'endure'),
      opt('有人帮', 'helped'),
      opt('不知道怎么就过了', 'unclear'),
      opt('其他', 'other', true),
    ],
    topicTags: ['晚年回望', '灾难'],
    detailTags: ['过程'],
    stageTag: '晚年回望',
    answerMode: 'single',
    narrativeRole: 'representative_event',
    materialType: 'event',
    draftImportance: 'core_2000',
    followupQuestions: ['q10_disaster_change'],
  };

  const disasterChange: QuestionTemplate = {
    id: 'q10_disaster_change',
    content: '这件事以后，您对日子的看法变了吗？',
    options: [
      opt('更珍惜了', 'cherish'),
      opt('看淡了', 'detached'),
      opt('没什么变化', 'unchanged'),
      opt('说不清', 'unclear'),
    ],
    topicTags: ['晚年回望', '灾难'],
    detailTags: ['感悟'],
    stageTag: '晚年回望',
    answerMode: 'single',
    narrativeRole: 'reflection',
    materialType: 'emotion',
    draftImportance: 'core_2000',
  };

  return [entry, achievementWhat, achievementAge, achievementFeeling, achievementImpact, personWho, personChange, personMessage, disasterWhat, disasterWho, disasterHow, disasterChange];
})();

// ============================================================
// Q11: 最想对谁说一声谢谢
// ============================================================

const q11 = (() => {
  const entry: QuestionTemplate = {
    id: 'q11_entry',
    content: '最想对谁说一声谢谢？',
    options: [
      opt('父母', 'parents'),
      opt('伴侣', 'partner'),
      opt('孩子', 'children'),
      opt('兄弟姐妹', 'siblings'),
      opt('朋友', 'friend'),
      opt('老师/师傅', 'teacher'),
      opt('其他', 'other', true),
      opt('没有', 'none'),
    ],
    topicTags: ['晚年回望', '感恩'],
    detailTags: ['感谢'],
    stageTag: '晚年回望',
    answerMode: 'multi',
    narrativeRole: 'reflection',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q11_focus'],
  };

  const focus: QuestionTemplate = {
    id: 'q11_focus',
    content: '如果想先谢谢一个人，最想先谢谁？',
    hint: '从刚才选的里面，先选一位聊。',
    options: [
      opt('父母', 'parents'),
      opt('伴侣', 'partner'),
      opt('孩子', 'children'),
      opt('兄弟姐妹', 'siblings'),
      opt('朋友', 'friend'),
      opt('老师/师傅', 'teacher'),
      opt('其他', 'other', true),
    ],
    topicTags: ['晚年回望', '感恩'],
    detailTags: ['聚焦'],
    stageTag: '晚年回望',
    answerMode: 'single',
    narrativeRole: 'reflection',
    materialType: 'person',
    draftImportance: 'core_2000',
    followupQuestions: ['q11_thank_what'],
  };

  const thankWhat: QuestionTemplate = {
    id: 'q11_thank_what',
    content: '最想谢谢ta什么？',
    hint: '如果有想说的，也可以写几个字。',
    options: [
      opt('养育之恩', 'raising'),
      opt('陪我吃了苦', 'sacrifice'),
      opt('教我本事', 'teaching'),
      opt('在最难的时候没放弃我', 'support'),
      opt('其他', 'other', true),
    ],
    topicTags: ['晚年回望', '感恩'],
    detailTags: ['原因'],
    stageTag: '晚年回望',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'reflection',
    materialType: 'emotion',
    draftImportance: 'core_2000',
    followupQuestions: ['q11_said'],
  };

  const said: QuestionTemplate = {
    id: 'q11_said',
    content: '您当面跟ta说过吗？',
    options: [
      opt('说过', 'said'),
      opt('没说过', 'unsaid'),
      opt('现在没机会了', 'no_chance'),
    ],
    topicTags: ['晚年回望', '感恩'],
    detailTags: ['行动'],
    stageTag: '晚年回望',
    answerMode: 'single',
    narrativeRole: 'reflection',
    materialType: 'emotion',
    draftImportance: 'core_2000',
    followupQuestions: ['q11_express'],
  };

  const express: QuestionTemplate = {
    id: 'q11_express',
    content: '如果能当面说，您最想怎么表达？',
    options: [
      opt('当面说', 'face'),
      opt('吃顿饭', 'meal'),
      opt('送个东西', 'gift'),
      opt('抱一下', 'hug'),
      opt('不用说出来，ta知道', 'understood'),
      opt('其他', 'other', true),
    ],
    topicTags: ['晚年回望', '感恩'],
    detailTags: ['表达'],
    stageTag: '晚年回望',
    answerMode: 'single',
    narrativeRole: 'reflection',
    materialType: 'emotion',
    draftImportance: 'core_2000',
  };

  return [entry, focus, thankWhat, said, express];
})();

// ============================================================
// Q12: 寄语 + 打分
// ============================================================

const q12 = (() => {
  const entry: QuestionTemplate = {
    id: 'q12_entry',
    content: '最想对年轻人说的一句话是什么？',
    options: [
      opt('要知足', 'content'),
      opt('身体最重要', 'health'),
      opt('珍惜身边人', 'cherish'),
      opt('要对得起良心', 'conscience'),
      opt('别太贪', 'no_greed'),
      opt('别太累', 'rest'),
      opt('多陪陪家人', 'family'),
      opt('趁年轻多学点本事', 'learn'),
      opt('其他', 'other', true),
    ],
    topicTags: ['晚年回望', '寄语'],
    detailTags: ['赠言'],
    stageTag: '晚年回望',
    answerMode: 'multi',
    narrativeRole: 'reflection',
    materialType: 'quote',
    draftImportance: 'core_2000',
    followupQuestions: ['q12_score'],
  };

  const score: QuestionTemplate = {
    id: 'q12_score',
    content: '如果给这一生打个分，满分100分，您打多少？',
    options: [
      opt('60分以下', 'below60'),
      opt('60-70分', '60_70'),
      opt('70-80分', '70_80'),
      opt('80-90分', '80_90'),
      opt('90分以上', 'above90'),
    ],
    topicTags: ['晚年回望', '自评'],
    detailTags: ['打分'],
    stageTag: '晚年回望',
    answerMode: 'single',
    narrativeRole: 'reflection',
    materialType: 'emotion',
    draftImportance: 'core_2000',
    followupQuestions: ['q12_word'],
  };

  const word: QuestionTemplate = {
    id: 'q12_word',
    content: '用一个词说说您这一生。',
    hint: '如果有想说的，也可以写几个字。',
    options: [opt('想说几句', 'share')],
    topicTags: ['晚年回望', '收束'],
    detailTags: ['总结'],
    stageTag: '晚年回望',
    answerMode: 'hybrid',
    allowTextDetails: true,
    narrativeRole: 'reflection',
    materialType: 'quote',
    draftImportance: 'core_2000',
  };

  return [entry, score, word];
})();

// ============================================================
// 合并 & 导出
// ============================================================

export const questionTemplates: QuestionTemplate[] = applyPhaseAnnotations([
  ...q01,
  ...q02,
  ...q03,
  ...q04,
  ...q05,
  ...q06,
  ...q07,
  ...q08,
  ...q09,
  ...q10,
  ...q11,
  ...q12,
]);

export const questionsByTopic: Record<string, QuestionTemplate[]> = {};
for (const stage of topicPriority) {
  questionsByTopic[stage] = questionTemplates.filter((q) => q.stageTag === stage);
}

export function getQuestionById(id: string): QuestionTemplate | undefined {
  return questionTemplates.find((q) => q.id === id);
}

export function getQuestionsByPhase(phase: QuestionPhase): QuestionTemplate[] {
  return questionTemplates.filter((q) => {
    const annotation = phaseAnnotations[q.id];
    return annotation?.phase === phase;
  });
}

export function getBaseQuestions(): QuestionTemplate[] {
  return getQuestionsByPhase('base');
}

export function getExtensionQuestions(): QuestionTemplate[] {
  return getQuestionsByPhase('extension');
}

export function getClosureQuestions(): QuestionTemplate[] {
  return getQuestionsByPhase('closure');
}

export function applyPhaseAnnotations(templates: QuestionTemplate[]): QuestionTemplate[] {
  return templates.map((template) => {
    const annotation = phaseAnnotations[template.id];
    if (annotation) {
      return { ...template, phase: annotation.phase, adaptable: annotation.adaptable ?? false };
    }
    return { ...template, phase: 'base', adaptable: false };
  });
}
