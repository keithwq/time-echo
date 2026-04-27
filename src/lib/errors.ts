/**
 * 自定义错误类
 * 用于 API 路由的错误处理，区分不同类型的错误
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class InsufficientBalanceError extends Error {
  constructor(message: string = '墨水余额不足') {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = '未授权访问') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = '请求过于频繁，请稍后再试') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class BudgetExceededError extends Error {
  constructor(message: string = '本月算力预算已耗尽') {
    super(message);
    this.name = 'BudgetExceededError';
  }
}

/**
 * 统一的错误响应处理函数
 */
export function handleApiError(error: unknown): { status: number; body: { error: string; code: string } } {
  if (error instanceof ValidationError) {
    return {
      status: 400,
      body: { error: error.message, code: 'VALIDATION_ERROR' },
    };
  }

  if (error instanceof UnauthorizedError) {
    return {
      status: 401,
      body: { error: error.message, code: 'UNAUTHORIZED' },
    };
  }

  if (error instanceof InsufficientBalanceError) {
    return {
      status: 402,
      body: { error: error.message, code: 'INSUFFICIENT_BALANCE' },
    };
  }

  if (error instanceof NotFoundError) {
    return {
      status: 404,
      body: { error: error.message, code: 'NOT_FOUND' },
    };
  }

  if (error instanceof ConflictError) {
    return {
      status: 409,
      body: { error: error.message, code: 'CONFLICT' },
    };
  }

  if (error instanceof RateLimitError) {
    return {
      status: 429,
      body: { error: error.message, code: 'RATE_LIMIT_EXCEEDED' },
    };
  }

  if (error instanceof BudgetExceededError) {
    return {
      status: 503,
      body: { error: error.message, code: 'BUDGET_EXCEEDED' },
    };
  }

  // 默认返回 500 内部错误
  console.error('Unhandled error:', error);
  return {
    status: 500,
    body: { error: 'Internal server error', code: 'INTERNAL_ERROR' },
  };
}
