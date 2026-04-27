# Phase 3 P1 - 扩展题库三层机制实现完成

## 实现概述

成功实现了扩展阶段的三层调度机制，使系统能够根据用户上下文智能选择、改写和生成题目。

## 核心改造

### 1. 修改 `/api/questions/next.ts`

#### 新增类型
- 更新 `QuestionResponse` 类型，支持 `source: 'local' | 'rewritten' | 'generated'`
- 新增 `originalContent` 和 `isAdaptedForContext` 字段

#### 新增函数

**标签匹配函数** (`matchExtensionQuestionByTags`)
- 优先级 1：同主题深化
- 优先级 2：相邻主题扩展
- 优先级 3：缺口补齐（按未覆盖的 detailTags）
- 优先级 4：阶段均衡

**改写判断函数** (`shouldRewriteQuestion`)
- 条件：`adaptable: true` 且已回答 ≥ 5 题

**用户上下文摘要函数** (`buildUserContextSummary`)
- 提取最近 3 条回答
- 统计已覆盖的人生阶段

**三层调度主函数** (`selectExtensionQuestion`)
- 第一层：标签匹配
- 第二层：AI 改写（如果 `adaptable: true`）
- 第三层：AI 生成（如果没有匹配的题）
- 完善的错误处理和降级策略

#### 修改 handler 函数
- 扩展阶段调用异步的 `selectExtensionQuestion`
- 基础阶段继续使用原有的 `selectNextQuestion`
- 返回题目来源信息给前端

#### 修改 `toQuestionResponse` 函数
- 新增 `source` 参数（默认 `'local'`）
- 支持返回改写和生成的题目

### 2. 修复相关文件

- `src/lib/aiUtils.ts`：移除未使用的 `InterviewAnswer` 接口
- `src/lib/aiClient.ts`：修复 OpenAI 类型和模型名称
- `src/lib/gapAnalyzer.ts`：修复未使用的参数
- `src/pages/api/interview/completion.ts`：修复 User 字段名（`name` → `real_name`）
- `src/pages/api/interview/update-memoir.ts`：修复 User 字段名和缺失的 `createdAt` 字段

### 3. 新增测试

创建 `__tests__/api/questions-next-extension.test.ts`，包含 17 个测试用例：

✅ 题库结构验证
- 扩展题库存在性
- `adaptable` 字段分布
- `detailTags` 覆盖
- 阶段分布（base: 161, extension: 276, closure: 3）

✅ 标签系统验证
- 所有题目有 `stageTag`
- 所有题目有 `narrativeRole`
- 所有题目有 `materialType`
- 所有题目有 `draftImportance`
- 所有题目有 `phase`

✅ 一致性验证
- 相邻主题关系
- 叙事角色分布
- 素材类型分布
- 初稿重要性分布

**测试结果**：17/17 通过 ✅

## 题库现状

根据 QUESTION_BANK_HANDOFF.md 的标注：

| 指标 | 数值 |
|------|------|
| 总题数 | 440 |
| Base 题 | 161 |
| Extension 题 | 276 |
| Closure 题 | 3 |
| Adaptable 题（Extension 中） | 246 (89%) |
| 不可适配题（Extension 中） | 30 (11%) |

## 关键特性

### 1. 智能标签匹配
- 根据已覆盖的 `detailTags` 自动补齐缺口
- 优先保持话题连贯性（同主题 → 相邻主题）
- 自动平衡各阶段的覆盖度

### 2. AI 改写
- 仅对 `adaptable: true` 的题目触发
- 需要足够的上下文（≥5 条回答）
- 失败时自动降级到原题

### 3. AI 生成
- 当题库无法满足时触发
- 需要足够的上下文（≥10 条回答）
- 失败时随机选择一道 extension 题

### 4. 错误处理
- 改写失败 → 使用原题
- 生成失败 → 随机选择
- 网络超时 → 提示用户稍后重试

## 前端响应格式

```typescript
{
  questionId: string;
  content: string;
  source: 'local' | 'rewritten' | 'generated';
  originalContent?: string;  // 改写前的原文
  isAdaptedForContext?: boolean;
  // ... 其他字段
}
```

## 构建状态

✅ 构建成功
- 无 TypeScript 错误
- 无 ESLint 警告
- 所有测试通过

## 后续工作

### Phase 3 P2
- 优化标签匹配算法
- 支持更细颗粒度的用户画像
- 增加题目相关性评分

### Phase 4
- 持久化 AI 改写/生成的题目
- 建立题目质量反馈机制
- 优化 AI 改写和生成的 prompt

### Phase 5
- 基于用户反馈动态调整策略
- 建立题目推荐排序算法
- 支持用户自定义题目偏好

## 文件变更清单

| 文件 | 变更 |
|------|------|
| `src/pages/api/questions/next.ts` | 新增三层调度逻辑 |
| `src/lib/aiUtils.ts` | 修复类型定义 |
| `src/lib/aiClient.ts` | 修复 OpenAI 类型 |
| `src/lib/gapAnalyzer.ts` | 修复未使用参数 |
| `src/pages/api/interview/completion.ts` | 修复字段名 |
| `src/pages/api/interview/update-memoir.ts` | 修复字段名和缺失字段 |
| `__tests__/api/questions-next-extension.test.ts` | 新增测试用例 |

## 验证清单

- [x] 构建成功
- [x] 所有测试通过
- [x] 题库标注完整
- [x] 三层调度逻辑实现
- [x] 错误处理完善
- [x] 前端响应格式更新
- [x] 代码审查通过

---

**完成时间**：2026-04-22  
**实现者**：Haiku  
**状态**：✅ 完成
