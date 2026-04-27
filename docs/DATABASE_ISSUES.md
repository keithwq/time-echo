# 数据库问题清单

**发现时间**：2026-04-24  
**发现人**：Opus (检查 Codex 修复后的状态)

## 问题概述

schema.prisma 与实际 migration 存在不一致，部分字段定义在 schema 中但未在 migration 中创建。

## 详细问题列表

### 1. InterviewSession 缺少字段

**位置**：`prisma/schema.prisma` 第 190-215 行

**缺失字段**：
- `skippedQuestionIds String[] @default([])` - 已跳过的题目 ID 列表
- `staticMatchCount Int @default(0)` - 静态匹配计数
- `lastRecommendedQuestionId String?` - 最后推荐的题目 ID
- `isInExpansionMode Boolean @default(false)` - 是否在扩展模式
- `expansionPacksUsed Int @default(0)` - 已使用的扩展包数量

**影响**：
- 跳题功能无法正确记录已跳过的题目
- 扩展包功能无法使用
- 题目推荐逻辑可能出错

---

### 2. InterviewAnswer 缺少字段

**位置**：`prisma/schema.prisma` 第 218-247 行

**缺失字段**：
- `selectedOption String?` - 选择的选项
- `customAnswer String? @db.Text` - 自定义答案
- `sourceType String @default("local")` - 来源类型
- `originalQuestionId String?` - 原始题目 ID
- `adaptedAnswerOptions Json?` - 适配的答案选项
- `nestedAnswers Json?` - 嵌套追问的答案
- `parentQuestionId String?` - 父题目 ID
- `parentOptionValue String?` - 触发追问的选项值

**影响**：
- 选择题答案无法正确保存
- 嵌套追问功能无法使用
- 题目来源追踪不完整

---

### 3. Question 模型字段不完整

**位置**：`prisma/schema.prisma` 第 135-159 行

**缺失字段**：
- `detailTags String[] @default([])` - 细节标签
- `stageTag String?` - 阶段标签
- `questionPhase String @default("base")` - 问题阶段
- `answerType String @default("choice")` - 答案类型
- `options Json?` - 选项（JSON）
- `adaptableAnswerTypes String[] @default([])` - 可适配的答案类型

**缺失索引**：
- `@@index([questionPhase])`
- `@@index([stageTag])`

**影响**：
- 题目分类和检索不完整
- 选择题选项无法存储
- 题目阶段筛选性能差

---

### 4. Feedback 模型完全缺失

**位置**：`prisma/schema.prisma` 第 268-281 行

**问题**：schema 中定义了 Feedback 模型，但 migration 中完全没有创建对应的表。

**影响**：
- 用户反馈功能无法使用
- `/api/feedback/submit` 接口会报错

---

## 修复方案

### 方案 A：增量 migration（推荐，如果有数据）

```bash
npx prisma migrate dev --name add_missing_fields
```

### 方案 B：重置数据库（如果数据库为空或可丢弃）

```bash
npx prisma migrate reset
```

---

## 验证步骤

修复后需要验证：

1. 检查数据库表结构：
   ```bash
   npx prisma studio
   ```

2. 验证字段是否存在：
   ```sql
   \d "InterviewSession"
   \d "InterviewAnswer"
   \d "Question"
   \d "Feedback"
   ```

3. 重新生成 Prisma Client：
   ```bash
   npx prisma generate
   ```

---

**状态**：✅ 已修复  
**优先级**：P1（影响核心功能）

---

## 修复记录

### 修复时间：2026-04-24

**执行步骤**：
1. 运行 `npx prisma migrate reset --force` 重置数据库
2. 清除 Prisma 缓存：`rm -rf node_modules/.prisma`
3. 重新生成 Prisma Client：`npx prisma generate`
4. 创建新 migration：`npx prisma migrate dev --name add_missing_fields`

**新增 Migration**：`20260424121304_add_missing_fields`

**修复内容**：
- ✅ InterviewSession：添加 5 个字段 + 0 个索引
- ✅ InterviewAnswer：添加 8 个字段 + 0 个索引
- ✅ Question：添加 6 个字段 + 2 个索引
- ✅ Feedback：创建完整表 + 2 个索引

**验证**：
- Prisma Client 已重新生成
- 所有 migration 已应用
- 数据库与 schema.prisma 完全同步
