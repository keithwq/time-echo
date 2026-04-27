# 选择题改造计划

## 需求概述
将访谈页面从开放式输入框改为选择题 + 最后一个"其他"选项可自定义。

## 实现顺序（后端优先）

### ✅ 已完成
- [x] **任务 2**：修改 question-templates.ts
  - 为每个题目添加 `options` 字段（3-4 个选项）
  - 最后一个选项固定为 `{ label: "其他", value: "other", allowCustom: true }`
  - 所有 100 个题目已更新

- [x] **任务 4**：修改 schema.prisma
  - InterviewAnswer 表新增 `selectedOption` 字段（选择的选项值）
  - InterviewAnswer 表新增 `customAnswer` 字段（自定义回答）
  - 保留 `content` 字段（存储最终答案）

- [x] **任务 5**：修改 answer.ts API
  - 接收 `selectedOption` 和 `customAnswer` 参数
  - 保存到数据库

### 🚧 进行中
- [ ] **数据库迁移**
  - 命令：`cd d:\DB\projects\time_echo && npm run db:push`
  - 状态：等待馆长执行

### ⏳ 待开发（后端完成后）
- [ ] **任务 3**：修改前端 UI（interview.tsx）
  - 显示选项按钮（单选）
  - 点击选项后高亮显示
  - 选择"其他"时显示输入框
  - 适老化设计：按钮 ≥48px，间距 ≥16px，字号 ≥18px

- [ ] **任务 1**：修改"稍后继续"逻辑
  - 保存草稿到 LocalStorage（包含选择状态）
  - 提示"进度已保存"
  - 跳转到首页
  - 下次进入时自动恢复进度

## 关键约束
- ✅ 后端优先：前端改造必须基于已验证的后端接口
- ✅ 适老化第一：字号 ≥18px，对比度 ≥7:1，触控区域 ≥48px
- ✅ 水墨风格：使用 Tailwind 设计令牌（ink-heavy, paper-base, seal-red）
- ✅ 不显示总题数和进度

## 下一步
1. 馆长执行数据库迁移命令
2. 迁移完成后，开始任务 3（前端 UI）
3. 最后完成任务 1（稍后继续逻辑）
