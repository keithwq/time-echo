/**
 * 结构化实体抽取模块
 * 从用户回答中提取：时间、地点、人物、事件、情绪等
 * P0 阶段使用基于规则的关键词匹配，避免 AI 成本
 */

export interface ExtractedEntities {
  timeInfo: {
    years: number[];           // 提取的年份
    ageStages: string[];       // 年龄段：童年、青年、中年、晚年
    eraMarkers: string[];      // 时代标记：文革、改革开放、恢复高考等
  };
  placeInfo: {
    birthPlace: string[];      // 出生地
    residences: string[];      // 居住地
    workPlaces: string[];      // 工作地
    migrations: string[];      // 迁徙地
  };
  peopleInfo: {
    family: string[];          // 家人：父母、配偶、子女
    colleagues: string[];      // 同事、师傅、领导
    friends: string[];         // 朋友、同学
  };
  identityInfo: {
    occupations: string[];     // 职业
    socialRoles: string[];     // 社会角色
    familyRoles: string[];     // 家庭角色
  };
  eventInfo: {
    education: string[];       // 求学事件
    career: string[];          // 职业事件
    family: string[];          // 家庭事件
    turningPoints: string[];   // 人生转折
  };
  objectInfo: {
    eraObjects: string[];      // 时代物件
    tools: string[];           // 工具
    dailyItems: string[];      // 日常用品
  };
  emotionInfo: {
    positive: string[];        // 正面情绪
    negative: string[];        // 负面情绪
    complex: string[];         // 复杂情绪
  };
}

// 时代标记词典
const ERA_MARKERS = [
  '文革', '文化大革命', '大跃进', '三年困难时期', '上山下乡',
  '恢复高考', '改革开放', '下海', '下岗', '国企改制',
  '计划经济', '票证时代', '粮票', '布票',
  '抗美援朝', '参军', '复员', '转业',
  '人民公社', '生产队', '供销社', '集体户',
];

// 地点关键词
const PLACE_KEYWORDS = {
  birthPlace: ['出生', '生在', '老家', '祖籍', '籍贯'],
  residence: ['住在', '住过', '搬到', '迁到', '定居', '落户'],
  workPlace: ['工作在', '上班', '单位在', '厂里', '公司在'],
};

// 人物关系词典
const PEOPLE_RELATIONS = {
  family: [
    '父亲', '爸爸', '爹', '母亲', '妈妈', '娘',
    '妻子', '丈夫', '爱人', '老伴',
    '儿子', '女儿', '孩子', '孙子', '孙女',
    '哥哥', '姐姐', '弟弟', '妹妹', '兄弟姐妹',
    '爷爷', '奶奶', '外公', '外婆',
  ],
  colleagues: [
    '师傅', '徒弟', '同事', '领导', '厂长', '主任',
    '车间主任', '班长', '组长', '经理', '老板',
  ],
  friends: [
    '同学', '朋友', '战友', '老乡', '邻居',
    '发小', '玩伴', '知己',
  ],
};

// 职业词典
const OCCUPATIONS = [
  '工人', '农民', '教师', '医生', '护士', '军人',
  '干部', '职员', '技术员', '工程师', '会计',
  '售货员', '司机', '厨师', '裁缝', '木匠',
  '电工', '钳工', '车工', '焊工', '铆工',
];

// 事件关键词
const EVENT_KEYWORDS = {
  education: ['上学', '读书', '考试', '毕业', '辍学', '复学', '高考', '中考'],
  career: ['参加工作', '入职', '调动', '提拔', '下岗', '退休', '离休'],
  family: ['结婚', '生子', '生女', '离婚', '丧偶', '分家', '搬家'],
  turningPoints: ['转折', '改变', '决定', '选择', '机会', '挫折', '困难'],
};

// 情绪词典
const EMOTION_KEYWORDS = {
  positive: [
    '高兴', '开心', '快乐', '幸福', '满足', '骄傲', '自豪',
    '温暖', '感动', '欣慰', '光荣', '荣耀',
  ],
  negative: [
    '难过', '伤心', '痛苦', '遗憾', '后悔', '害怕', '恐惧',
    '辛苦', '艰难', '困难', '委屈', '无奈',
  ],
  complex: [
    '复杂', '矛盾', '纠结', '五味杂陈', '百感交集',
    '又喜又忧', '苦中有甜',
  ],
};

// 时代物件词典
const ERA_OBJECTS = [
  '粮票', '布票', '油票', '肉票', '煤票',
  '自行车', '缝纫机', '手表', '收音机', '电视机',
  '大哥大', '传呼机', 'BP机',
  '搪瓷缸', '暖水瓶', '蒲扇', '煤油灯', '手电筒',
];

/**
 * 提取年份（1900-2030）
 */
function extractYears(text: string): number[] {
  const yearPattern = /\b(19\d{2}|20[0-2]\d|2030)\b/g;
  const matches = text.match(yearPattern);
  if (!matches) return [];
  return [...new Set(matches.map(y => parseInt(y)))].sort();
}

/**
 * 提取年龄段
 */
function extractAgeStages(text: string): string[] {
  const stages: string[] = [];
  if (/童年|小时候|幼年|儿时/.test(text)) stages.push('童年');
  if (/少年|中学|初中|高中/.test(text)) stages.push('少年');
  if (/青年|年轻|刚工作|刚参加工作/.test(text)) stages.push('青年');
  if (/中年|四五十岁|人到中年/.test(text)) stages.push('中年');
  if (/晚年|老年|退休后|现在/.test(text)) stages.push('晚年');
  return [...new Set(stages)];
}

/**
 * 提取时代标记
 */
function extractEraMarkers(text: string): string[] {
  return ERA_MARKERS.filter(marker => text.includes(marker));
}

/**
 * 提取地点信息
 */
function extractPlaceInfo(text: string) {
  const placeInfo = {
    birthPlace: [] as string[],
    residences: [] as string[],
    workPlaces: [] as string[],
    migrations: [] as string[],
  };

  // 简单的地名提取（省、市、县、村）
  // 根据上下文分类
  PLACE_KEYWORDS.birthPlace.forEach(keyword => {
    const regex = new RegExp(`${keyword}[^。，,；;]{0,20}([\u4e00-\u9fa5]{2,}(?:省|市|县|区|镇|乡|村))`, 'g');
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(m => {
        const place = m.match(/([\u4e00-\u9fa5]{2,}(?:省|市|县|区|镇|乡|村))/);
        if (place) placeInfo.birthPlace.push(place[1]);
      });
    }
  });

  PLACE_KEYWORDS.residence.forEach(keyword => {
    const regex = new RegExp(`${keyword}[^。，,；;]{0,20}([\u4e00-\u9fa5]{2,}(?:省|市|县|区|镇|乡|村|街道))`, 'g');
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(m => {
        const place = m.match(/([\u4e00-\u9fa5]{2,}(?:省|市|县|区|镇|乡|村|街道))/);
        if (place) placeInfo.residences.push(place[1]);
      });
    }
  });

  PLACE_KEYWORDS.workPlace.forEach(keyword => {
    const regex = new RegExp(`${keyword}[^。，,；;]{0,20}([\u4e00-\u9fa5]{2,}(?:省|市|县|区|镇|乡|村|街道))`, 'g');
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(m => {
        const place = m.match(/([\u4e00-\u9fa5]{2,}(?:省|市|县|区|镇|乡|村|街道))/);
        if (place) placeInfo.workPlaces.push(place[1]);
      });
    }
  });

  // 去重
  placeInfo.birthPlace = [...new Set(placeInfo.birthPlace)];
  placeInfo.residences = [...new Set(placeInfo.residences)];
  placeInfo.workPlaces = [...new Set(placeInfo.workPlaces)];

  return placeInfo;
}

/**
 * 提取人物信息
 */
function extractPeopleInfo(text: string) {
  const peopleInfo = {
    family: [] as string[],
    colleagues: [] as string[],
    friends: [] as string[],
  };

  PEOPLE_RELATIONS.family.forEach(relation => {
    if (text.includes(relation)) {
      peopleInfo.family.push(relation);
    }
  });

  PEOPLE_RELATIONS.colleagues.forEach(relation => {
    if (text.includes(relation)) {
      peopleInfo.colleagues.push(relation);
    }
  });

  PEOPLE_RELATIONS.friends.forEach(relation => {
    if (text.includes(relation)) {
      peopleInfo.friends.push(relation);
    }
  });

  // 去重
  peopleInfo.family = [...new Set(peopleInfo.family)];
  peopleInfo.colleagues = [...new Set(peopleInfo.colleagues)];
  peopleInfo.friends = [...new Set(peopleInfo.friends)];

  return peopleInfo;
}

/**
 * 提取身份信息
 */
function extractIdentityInfo(text: string) {
  const identityInfo = {
    occupations: [] as string[],
    socialRoles: [] as string[],
    familyRoles: [] as string[],
  };

  OCCUPATIONS.forEach(occupation => {
    if (text.includes(occupation)) {
      identityInfo.occupations.push(occupation);
    }
  });

  // 社会角色
  const socialRoles = ['党员', '团员', '干部', '代表', '委员', '劳模'];
  socialRoles.forEach(role => {
    if (text.includes(role)) {
      identityInfo.socialRoles.push(role);
    }
  });

  // 家庭角色
  const familyRoles = ['长子', '长女', '独生子', '独生女', '家长', '户主'];
  familyRoles.forEach(role => {
    if (text.includes(role)) {
      identityInfo.familyRoles.push(role);
    }
  });

  // 去重
  identityInfo.occupations = [...new Set(identityInfo.occupations)];
  identityInfo.socialRoles = [...new Set(identityInfo.socialRoles)];
  identityInfo.familyRoles = [...new Set(identityInfo.familyRoles)];

  return identityInfo;
}

/**
 * 提取事件信息
 */
function extractEventInfo(text: string) {
  const eventInfo = {
    education: [] as string[],
    career: [] as string[],
    family: [] as string[],
    turningPoints: [] as string[],
  };

  Object.entries(EVENT_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        eventInfo[category as keyof typeof eventInfo].push(keyword);
      }
    });
  });

  // 去重
  eventInfo.education = [...new Set(eventInfo.education)];
  eventInfo.career = [...new Set(eventInfo.career)];
  eventInfo.family = [...new Set(eventInfo.family)];
  eventInfo.turningPoints = [...new Set(eventInfo.turningPoints)];

  return eventInfo;
}

/**
 * 提取物件信息
 */
function extractObjectInfo(text: string) {
  const objectInfo = {
    eraObjects: [] as string[],
    tools: [] as string[],
    dailyItems: [] as string[],
  };

  ERA_OBJECTS.forEach(obj => {
    if (text.includes(obj)) {
      objectInfo.eraObjects.push(obj);
    }
  });

  // 工具
  const tools = ['锄头', '镰刀', '扁担', '锤子', '扳手', '钳子', '锯子'];
  tools.forEach(tool => {
    if (text.includes(tool)) {
      objectInfo.tools.push(tool);
    }
  });

  // 去重
  objectInfo.eraObjects = [...new Set(objectInfo.eraObjects)];
  objectInfo.tools = [...new Set(objectInfo.tools)];

  return objectInfo;
}

/**
 * 提取情绪信息
 */
function extractEmotionInfo(text: string) {
  const emotionInfo = {
    positive: [] as string[],
    negative: [] as string[],
    complex: [] as string[],
  };

  Object.entries(EMOTION_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        emotionInfo[category as keyof typeof emotionInfo].push(keyword);
      }
    });
  });

  // 去重
  emotionInfo.positive = [...new Set(emotionInfo.positive)];
  emotionInfo.negative = [...new Set(emotionInfo.negative)];
  emotionInfo.complex = [...new Set(emotionInfo.complex)];

  return emotionInfo;
}

/**
 * 主抽取函数
 */
export function extractEntities(text: string): ExtractedEntities {
  return {
    timeInfo: {
      years: extractYears(text),
      ageStages: extractAgeStages(text),
      eraMarkers: extractEraMarkers(text),
    },
    placeInfo: extractPlaceInfo(text),
    peopleInfo: extractPeopleInfo(text),
    identityInfo: extractIdentityInfo(text),
    eventInfo: extractEventInfo(text),
    objectInfo: extractObjectInfo(text),
    emotionInfo: extractEmotionInfo(text),
  };
}

/**
 * 从抽取结果推断主题标签
 */
export function inferTopicTag(entities: ExtractedEntities): string | null {
  // 根据事件和年龄段推断主题
  if (entities.timeInfo.ageStages.includes('童年')) return '童年';
  if (entities.eventInfo.education.length > 0) return '求学';
  if (entities.eventInfo.career.length > 0) return '工作';
  if (entities.eventInfo.family.some(e => ['结婚', '生子', '生女'].includes(e))) return '婚姻';
  if (entities.peopleInfo.family.some(p => ['儿子', '女儿', '孩子'].includes(p))) return '家庭';
  if (entities.placeInfo.migrations.length > 0 || entities.placeInfo.residences.length > 1) return '迁徙';
  if (entities.timeInfo.eraMarkers.length > 0) return '时代记忆';
  if (entities.timeInfo.ageStages.includes('晚年')) return '晚年';

  return null;
}

/**
 * 从抽取结果推断情绪标签
 */
export function inferEmotionTag(entities: ExtractedEntities): string | null {
  const { positive, negative, complex } = entities.emotionInfo;

  if (complex.length > 0) return complex[0];
  if (positive.length > negative.length) return positive[0];
  if (negative.length > 0) return negative[0];

  return null;
}
