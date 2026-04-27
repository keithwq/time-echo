/**
 * 输入验证函数
 * 用于验证 API 请求的输入数据
 */

import { ValidationError } from './errors';

/**
 * 验证用户创建输入
 */
export function validateUserInput(data: {
  real_name?: string;
  birth_year?: number;
  gender?: string;
  birth_place?: string;
}) {
  // 验证姓名长度
  if (data.real_name && data.real_name.length > 50) {
    throw new ValidationError('姓名长度不能超过 50 个字符');
  }

  // 验证出生年份范围
  if (data.birth_year !== undefined) {
    const currentYear = new Date().getFullYear();
    if (data.birth_year < 1920 || data.birth_year > currentYear - 10) {
      throw new ValidationError(`出生年份必须在 1920 到 ${currentYear - 10} 之间`);
    }
  }

  // 验证性别
  if (data.gender && !['男', '女', '其他'].includes(data.gender)) {
    throw new ValidationError('性别必须是：男、女或其他');
  }

  // 验证出生地长度
  if (data.birth_place && data.birth_place.length > 100) {
    throw new ValidationError('出生地长度不能超过 100 个字符');
  }
}

/**
 * 验证墨水交易输入
 */
export function validateInkTransaction(data: {
  userId?: string;
  amount?: number;
  reason?: string;
}) {
  if (!data.userId) {
    throw new ValidationError('用户 ID 不能为空');
  }

  if (data.amount === undefined || data.amount === null) {
    throw new ValidationError('墨水数量不能为空');
  }

  if (typeof data.amount !== 'number' || isNaN(data.amount)) {
    throw new ValidationError('墨水数量必须是有效数字');
  }

  // 验证墨水数量范围（防止异常大的数值）
  if (data.amount < -1000 || data.amount > 1000) {
    throw new ValidationError('单次墨水变动不能超过 ±1000');
  }

  if (!data.reason || data.reason.trim().length === 0) {
    throw new ValidationError('变动原因不能为空');
  }

  if (data.reason.length > 100) {
    throw new ValidationError('变动原因长度不能超过 100 个字符');
  }
}

/**
 * 验证任务创建输入
 */
export function validateTaskCreation(data: {
  clientId?: string;
  locked_ink?: number;
  requirement_desc?: string;
}) {
  if (!data.clientId) {
    throw new ValidationError('用户 ID 不能为空');
  }

  if (!data.locked_ink || data.locked_ink <= 0) {
    throw new ValidationError('悬赏墨水必须大于 0');
  }

  if (data.locked_ink > 500) {
    throw new ValidationError('单次悬赏墨水不能超过 500');
  }

  if (!data.requirement_desc || data.requirement_desc.trim().length === 0) {
    throw new ValidationError('求助描述不能为空');
  }

  if (data.requirement_desc.length > 1000) {
    throw new ValidationError('求助描述长度不能超过 1000 个字符');
  }

  // 敏感词检查
  const sensitiveWords = [
    '微信',
    'wx',
    '转账',
    '红包',
    '支付宝',
    '银行卡',
    '打款',
    '汇款',
    '现金',
    '元',
    '块钱',
  ];

  const lowerDesc = data.requirement_desc.toLowerCase();
  for (const word of sensitiveWords) {
    if (lowerDesc.includes(word)) {
      throw new ValidationError(
        '为保护您的财产安全，广场内禁止留下联系方式与金钱交易暗示'
      );
    }
  }
}

/**
 * 验证卷轴内容输入
 */
export function validateScrollContent(data: {
  content?: string;
  scrollNum?: number;
}) {
  if (!data.content || data.content.trim().length === 0) {
    throw new ValidationError('回忆内容不能为空');
  }

  // PRD 4.3 要求：前端输入框 maxlength="1000"
  if (data.content.length > 1000) {
    throw new ValidationError('回忆内容长度不能超过 1000 个字符');
  }

  if (data.scrollNum !== undefined) {
    if (data.scrollNum < 1 || data.scrollNum > 12) {
      throw new ValidationError('卷轴编号必须在 1-12 之间');
    }
  }
}

/**
 * 验证 UUID 格式
 */
export function validateUUID(id: string, fieldName: string = 'ID'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError(`${fieldName} 格式无效`);
  }
}
