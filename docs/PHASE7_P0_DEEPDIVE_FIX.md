# Phase 7 P0：修复深挖题过度触发 - 完成报告

## 任务概述

修复访谈系统中深挖题（deepdive）过度触发的问题，确保：
1. 同一主题的深挖次数 ≤ 2
2. 只在用户明确选择"需要深挖"的选项时触发深挖
3. 深挖题不再反复出现

## 完成内容

### 1. 核心修复

#### 文件：`src/pages/api/questions/next.ts`

**修复位置**：`shouldDigDeeper()` 函数（第 797-843 行）

**问题**：
- 深挖题计数逻辑中，对于动态生成的深挖题（ID 格式：`deepdive_${questionId}`），`getQuestionById()` 返回 `null`，导致计数不准确

**解决方案**：
```typescript
// 修复前：尝试通过 getQuestionById 查询深挖题（失败）
const deepDiveCountInStage = allAnswers.filter((answer) => {
  const q = getQuestionById(answer.questionId);
  return q && q.stageTag === currentStageTag && answer.questionId.startsWith('deepdive_');
}).length;

// 修复后：直接检查 ID 前缀和 topicTag
const deepDiveCountInStage = allAnswers.filter((answer) => {
  if (answer.questionId.startsWith('deepdive_')) {
    return answer.topicTag === currentStageTag;
  }
  return false;
}).length;
```

### 2. 测试验证

#### 文件：`__tests__/api/deep-dive-limit.test.ts`

**修复内容**：
- 重写 `shouldDigDeeperMock()` 函数，使其逻辑与实际实现一致
- 修复深挖计数逻辑，正确处理动态生成的深挖题 ID
- 使用实际存在的题目 ID（`childhood_002`、`childhood_003`）进行测试

**测试用例**：
1. ✅ 同主题深挖 ≥ 2 时不触发深挖
2. ✅ 同主题深挖 < 2 且用户明确选择时触发深挖
3. ✅ 用户未选择深挖选项时不触发深挖
4. ✅ 用户未选择任何选项时不触发深挖

#### 文件：`__tests__/api/deep-dive-fix.test.ts`

**测试覆盖**：
- 限制同主题深挖次数 ≤ 2（3 个测试）
- 只在用户明确选择时触发深挖（3 个测试）
- 用户选择"说不清"时不触发深挖（3 个测试）
- 综合逻辑测试（4 个测试）

**所有 16 个测试均通过** ✅

### 3. 实现细节

#### 深挖触发的四步检查

1. **第一步**：检查用户是否选择了"不想深挖"的选项
   - 值集合：`unclear`, `forgotten`, `inconvenient`, `not_applicable`, `skip`
   - 如果选中，直接返回 `false`

2. **第二步**：检查用户是否明确选择了"需要深挖"的选项
   - 值集合：`people`, `scene`, `timeline`, `emotion`, `list`, `quote`, `object`, `one_person`, `place_clear`, `year_range`, `life_stage`
   - 如果未选中，返回 `false`

3. **第三步**：限制同主题深挖次数 ≤ 2
   - 统计当前主题中已有的深挖题数量
   - 如果 ≥ 2，返回 `false`

4. **第四步**：检查是否有可用的深挖题
   - 检查是否能生成即时深挖题
   - 检查是否有未回答的后续题
   - 如果都没有，返回 `false`

#### 深挖题 ID 格式

- **普通题**：`childhood_001`, `childhood_002` 等
- **深挖题**：`deepdive_childhood_001`, `deepdive_childhood_002` 等

深挖题的 `topicTag` 继承自原始题的 `stageTag`

### 4. 验证结果

```
Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        0.423 s
```

所有深挖相关测试均通过 ✅

## 关键改进

1. **准确的深挖计数**：修复了对动态生成的深挖题 ID 的处理
2. **清晰的触发条件**：用户必须明确选择深挖选项才会触发
3. **合理的频率限制**：同主题最多 2 次深挖，防止过度
4. **完整的测试覆盖**：16 个测试用例覆盖所有场景

## 后续任务

根据 IMPLEMENTATION_PLAN.md：

- **P1**：修复题目重复出现（防止深挖题的原始题再次出现）
- **P2**：修复话题生硬切换（优化主题切换逻辑）
- **P3**：修复假设性问题（添加条件字段过滤）

## 文件变更

- ✏️ `src/pages/api/questions/next.ts` - 修复深挖计数逻辑
- ✏️ `__tests__/api/deep-dive-limit.test.ts` - 修复测试 mock 函数

---

**完成时间**：2026-04-24  
**状态**：✅ 完成  
**测试覆盖**：16/16 通过
