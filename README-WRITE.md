# AI 模型切换指南

## 设计原则

- **配置化切换**：只需修改环境变量，无需改代码
- **OpenAI 兼容**：支持所有 OpenAI 格式的模型（国产、国外、第三方中转）
- **成本优先**：哪个便宜用哪个，随时切换
- **降级策略**：AI 调用失败时自动回退到本地规则

---

## 快速切换流程

### 1. 编辑 `.env.local`

```bash
# ============ 当前使用的模型 ============
# 只需修改这 4 行，即可切换模型

AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_API_KEY=your_api_key_here
AI_MODEL=glm-4-flash
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

### 2. 重启服务

```bash
npm run dev
```

### 3. 完成！

---

## 支持的模型配置

### GLM-4-Flash（智谱 AI）- 免费

```bash
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_API_KEY=your_glm_api_key
AI_MODEL=glm-4-flash
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

**特点**：
- 免费额度：100 万 tokens/天
- 适合：内测阶段
- 限制：60 次/分钟

---

### 豆包（字节跳动）

```bash
AI_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
AI_API_KEY=your_doubao_api_key
AI_MODEL=doubao-lite-4k
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

**特点**：
- 价格：0.0003 元/1k tokens
- 适合：正式运营
- 性价比高

---

### 通义千问（阿里云）

```bash
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_API_KEY=your_qwen_api_key
AI_MODEL=qwen-turbo
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

**特点**：
- 价格：0.0008 元/1k tokens
- 免费额度：100 万 tokens
- 适合：备选方案

---

### DeepSeek

```bash
AI_BASE_URL=https://api.deepseek.com/v1
AI_API_KEY=your_deepseek_api_key
AI_MODEL=deepseek-chat
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

**特点**：
- 价格：0.0001 元/1k tokens（最便宜）
- 推理能力较强
- 适合：成本敏感场景

---

### OpenAI（或第三方中转）

```bash
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_openai_api_key
AI_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

**特点**：
- 价格：较贵
- 质量稳定
- 适合：对质量要求高的场景

---

### 第三方中转（如 OpenRouter）

```bash
AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=your_openrouter_api_key
AI_MODEL=meta-llama/llama-3-8b-instruct
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

**特点**：
- 价格：根据模型不同
- 支持多种开源模型
- 适合：寻找最便宜的方案

---

## 实现代码

### 核心文件：`src/lib/ai.ts`

```typescript
interface AIConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

// 从环境变量读取
const config: AIConfig = {
  baseURL: process.env.AI_BASE_URL!,
  apiKey: process.env.AI_API_KEY!,
  model: process.env.AI_MODEL!,
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
};

export async function callAI(prompt: string): Promise<string> {
  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// 带降级策略的调用
export async function callAIWithFallback(prompt: string): Promise<string> {
  try {
    return await callAI(prompt);
  } catch (error) {
    console.error('AI call failed:', error);
    
    // 降级到本地规则
    return fallbackToLocalRules(prompt);
  }
}

function fallbackToLocalRules(prompt: string): string {
  // 简单的规则引擎
  return JSON.stringify({
    shouldDeepDive: false,
    nextTopic: '童年',
    reason: 'AI 调用失败，使用本地规则'
  });
}
```

---

## 使用示例

### 在 API 路由中调用

```typescript
// src/pages/api/questions/next.ts

import { callAIWithFallback } from '@/lib/ai';

async function generateInterviewPlan(context: any) {
  const prompt = `
    用户已回答 ${context.answeredCount} 题
    当前阶段：${context.currentStage}
    最近回答：${JSON.stringify(context.recentAnswers)}
    用户画像：${JSON.stringify(context.memoryProfile)}
    
    请生成接下来 5 题的调度计划：
    1. 每题是否需要深挖？
    2. 深挖题的具体问题是什么？
    3. 下一题应该选择哪个主题？
    
    返回 JSON 数组，每个元素包含：
    {
      questionIndex: number,
      shouldDeepDive: boolean,
      deepDiveQuestion?: string,
      nextTopic: string,
      reason: string
    }
  `;
  
  const response = await callAIWithFallback(prompt);
  return JSON.parse(response);
}
```

---

## 成本监控（可选）

### 添加用量记录

```typescript
// src/lib/ai.ts

export async function callAI(prompt: string): Promise<string> {
  const startTime = Date.now();
  const estimatedInputTokens = Math.ceil(prompt.length / 4);
  
  const response = await callOpenAICompatible(prompt);
  
  const estimatedOutputTokens = Math.ceil(response.length / 4);
  const duration = Date.now() - startTime;
  
  // 记录到数据库
  await prisma.aiUsageLog.create({
    data: {
      model: config.model,
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      duration,
      timestamp: new Date(),
    },
  });
  
  return response;
}
```

### 数据库表结构

```prisma
model AIUsageLog {
  id           String   @id @default(cuid())
  model        String
  inputTokens  Int
  outputTokens Int
  duration     Int      // 毫秒
  timestamp    DateTime @default(now())
}
```

---

## 批量调用策略

为了降低成本和调用次数，采用**批量调用**策略：

### 每 5 题调用一次 AI

```typescript
// 生成接下来 5 题的调度计划
async function generateInterviewPlan(userId: string, sessionId: string) {
  const context = await getInterviewContext(userId, sessionId);
  
  const plan = await callAIWithFallback(`
    生成接下来 5 题的调度计划...
  `);
  
  // 将计划缓存到数据库
  await prisma.interviewPlan.create({
    data: {
      sessionId,
      plan: JSON.parse(plan),
      validUntil: context.answeredCount + 5
    }
  });
}

// 获取下一题时，先查本地缓存
async function getNextQuestion(sessionId: string) {
  const plan = await prisma.interviewPlan.findFirst({
    where: {
      sessionId,
      validUntil: { gte: currentAnsweredCount }
    }
  });
  
  if (plan) {
    // 使用缓存的计划，不调用 AI
    return executeFromPlan(plan);
  }
  
  // 缓存失效，重新生成计划
  await generateInterviewPlan(userId, sessionId);
  return getNextQuestion(sessionId);
}
```

### 成本对比

| 策略 | 调用次数 | Token 消耗 | 成本（豆包） |
|------|----------|------------|--------------|
| 每题调用 | 50 次 | 37,500 | 0.011 元/用户 |
| 每 5 题调用 | 10 次 | 25,000 | 0.0075 元/用户 |
| 每 10 题调用 | 5 次 | 20,000 | 0.006 元/用户 |

**推荐**：每 5 题调用一次（平衡灵活性和成本）

---

## 注意事项

### 1. API Key 安全

- **不要**将 API Key 提交到 Git
- 使用 `.env.local`（已在 `.gitignore` 中）
- 生产环境使用环境变量

### 2. 错误处理

- 所有 AI 调用都应使用 `callAIWithFallback`
- 确保有降级策略，避免 AI 故障导致服务不可用

### 3. 速率限制

- GLM-4-Flash：60 次/分钟
- 豆包：根据套餐不同
- 建议：批量调用 + 本地缓存

### 4. 模型兼容性

- 大部分模型支持 OpenAI 格式
- 如遇到不兼容，可在 `ai.ts` 中添加特殊处理

---

## 故障排查

### AI 调用失败

1. 检查 `.env.local` 配置是否正确
2. 检查 API Key 是否有效
3. 检查网络连接
4. 查看控制台错误日志

### 成本超支

1. 检查 `AIUsageLog` 表，查看用量
2. 调整批量调用策略（每 10 题调用一次）
3. 切换到更便宜的模型

### 响应质量差

1. 调整 `AI_TEMPERATURE`（降低随机性）
2. 优化 Prompt（更明确的指令）
3. 切换到推理能力更强的模型

---

## 未来优化

- [ ] 支持多模型并行调用（A/B 测试）
- [ ] 自动成本监控和预警
- [ ] Prompt 优化和版本管理
- [ ] 模型响应质量评估

---

**最后更新**：2026-04-22
