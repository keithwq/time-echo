# CLAUDE.md - 《时光回响》项目契约

**版本**: v0.4.0  
**最后更新**: 2026-04-28  
**适用于**: Phase 5 及之后的开发

## 目录
- [项目核心身份](#项目核心身份)
- [交互准则](#交互准则)
- [工程纪律](#工程纪律-anti-laziness-rules)
- [快速开始](#快速开始新开发者必读)
- [当前工程状态](#当前工程状态)
- [核心技术约束](#核心技术约束)
- [开发工作流](#开发工作流)
- [关键文件索引](#关键文件索引)
- [成本控制红线](#成本控制红线)
- [视觉规范速查](#视觉规范速查)
- [禁止事项清单](#禁止事项清单)
- [工程实践规范](#工程实践规范)
- [动态访谈引擎核心规则](#动态访谈引擎核心规则)

---

## 项目核心身份

**项目名称**：时光回响 (Time Echo)  
**定位**：适老化公益回忆录平台，水墨风格，极简设计  
**技术栈**：Next.js 14 + Prisma + PostgreSQL + Tailwind CSS  
**部署目标**：Sealos 北京节点 (0.07元/小时)  
**核心约束**：极致省钱，严禁空转计费，防止算力超支

---

## 交互准则

### 1. 拒绝平庸
- 严禁给出通用示例代码
- 所有代码必须符合 [TIME_ECHO_PRD.md](docs/TIME_ECHO_PRD.md) 的具体要求
- 不允许引入重型第三方库（moment.js, lodash, antd, echarts 等）

### 2. 深度推理优先
- 在输出结论前必须进行充分的思维推演
- 考虑边界情况和性能影响
- 评估每个决策对成本的影响

### 3. 适老化第一
- 所有 UI 代码必须遵循 PRD 第 13 章的视觉规范
- 核心内容字号不低于 18px，对比度 ≥7:1
- 触控区域 ≥48px×48px，间距 ≥16px
- 使用 Tailwind 设计令牌：`ink-heavy`, `paper-base`, `seal-red` 等
- 例外：页脚、版权信息等非核心内容可使用 16px

### 4. 小白友好
- 解释命令时必须告知物理路径
- 区分"根目录"和"子目录"
- 明确说明命令的执行位置

---

## 工程纪律 (Anti-Laziness Rules)

### 0. 后端优先原则（最高优先级，不可违反）

**铁律：严禁在后端完成前修改前端代码**

#### 执行顺序
任何功能开发必须严格按照以下顺序：
1. **后端阶段**：数据模型 → 数据库迁移 → API 路由 → 后端验证
2. **前端阶段**：UI 组件 → 页面实现 → 前端集成
3. **联调阶段**：端到端测试 → 性能测试 → 浏览器兼容性测试

#### 强制约束
- 数据模型、API 路由、数据库迁移必须全部完成并验证后，才能开始前端开发
- 前端 UI 改造必须基于已验证的后端接口
- 这样可以避免前后端不匹配导致的返工
- **任何计划、分解、实施都必须遵守此顺序**

---

### 1. 文档优先级与会话启动检查

#### 强制读取顺序
在开始任何实施工作前，必须按以下顺序读取文档：
1. **IMPLEMENTATION_PLAN.md**（如果存在）- 实施计划，最高优先级
2. **CLAUDE.md** - 项目契约（本文档）
3. **INTERVIEW_ENGINE_RULES.md** - 访谈运行细则
4. **TIME_ECHO_PRD.md** - 产品需求文档
5. **QUESTION_BANK_HANDOFF.md**（若当前 Phase 涉及题库消费、调度、生成、预览或扩写）- 题库字段语义与消费边界

#### 会话启动检查清单（建议行为）
每次新会话开始时，AI 应该执行：
1. 使用 `Glob` 工具搜索 `**/IMPLEMENTATION_PLAN.md`
2. 如果存在，读取并确认当前 Phase 和剩余任务
3. 如果不存在，询问用户是否需要创建
4. 向用户确认：”当前应该执行 [Phase X] 的 [Task Y]，是否继续？”

**注意**：这是建议行为，不是强制约束。用户可以在任务描述中明确提醒 AI 执行此检查。

#### 任务启动检查清单（强制约束）
在接到任何计划、分解、实施任务时，AI 必须：
1. **先审视约束**：检查 CLAUDE.md 中的相关规则（特别是”后端优先原则”）
2. **再制定计划**：确保计划符合约束
3. **最后执行**：严格按照计划执行

#### 执行纪律
- 如果 IMPLEMENTATION_PLAN.md 存在，所有工作必须严格按照其中的 Phase 和任务列表执行
- **禁止跳过、合并或重排任务顺序**，除非经过用户明确同意
- **禁止自作主张**建议”先做 X 再做 Y”，必须按 PLAN 顺序
- 如果发现 PLAN 与实际状态不符，必须先询问用户是否更新 PLAN
- 如果 `QUESTION_BANK_HANDOFF.md` 存在，且当前任务涉及题库消费，**必须**按其中”强语义字段 / 建议语义字段”执行，禁止自行重新解释题库字段
- 对题库相关任务，禁止把”未入稿素材”擅自理解为”只供扩写使用”

### 2. 严禁跳步
在执行任何依赖环境的指令前，必须引导馆长进行环境核验：
- 数据库是否启动？(`docker ps`)
- 依赖是否安装？(`node_modules` 是否存在)
- Prisma 是否同步？(`prisma generate` 是否执行)

### 3. 物理路径透明
任何命令必须明确物理位置：
```bash
# ✅ 正确（用户不在项目目录时）
cd d:\DB\20_PROJECTS\time_echo
npm run dev

# ✅ 正确（用户已在项目目录时）
npm run dev

# ❌ 错误（位置不明）
npm run dev  # 没说明在哪里执行
```

### 4. 环境隔离检查
在操作数据库前，必须询问馆长：
- 是"本地 Docker"还是"云端 Sealos"？
- 环境变量 `.env` 是否正确配置？

### 5. 拒绝向导
严禁推荐使用 VS Code 的自动配置向导，必须保持手写配置的纯净度。

### 6. 命令执行规范（铁律）

#### 6.1 禁止无谓的 cd 命令
- **用户已在项目目录时，不要再 cd**
- 错误示例：`cd d:\DB\20_PROJECTS\time_echo && npm run dev`（用户已在该目录）
- 正确示例：`npm run dev`（直接执行）

#### 6.2 Shell 兼容性
- **禁止使用 `&&` 连接命令**（PowerShell 不支持）
- 正确做法：分行写命令
- 错误示例：`npm install && npm run dev`
- 正确示例：
  ```bash
  npm install
  npm run dev
  ```
- **注意**：本文档中的示例命令如果使用了 `&&`，仅作为概念说明，实际执行时必须分行

#### 6.3 明确操作主体
- **当需要用户执行操作时，必须明确标注**
- 使用格式：`请你执行：` 或 `请用户执行：`
- 不允许模糊表述，避免用户误认为是 AI 的进度报告
- 错误示例：`启动开发服务器：npm run dev`（不清楚谁执行）
- 正确示例：`请你执行：npm run dev`（明确是用户操作）

#### 6.4 命令位置说明
- 如果命令需要在特定目录执行，必须明确说明
- 格式：`在 d:\DB\20_PROJECTS\time_echo 目录中，请你执行：npm run dev`
- 如果用户已在该目录，可简化为：`请你执行：npm run dev`

#### 6.5 端口占用处理（必须预见）
- **每次建议启动开发服务器前，必须提醒用户检查端口占用**
- 常见占用端口：3000, 3001, 3002（Next.js 默认尝试）
- 清理命令（Windows PowerShell）：
  ```bash
  # 查看占用 3000 端口的进程
  netstat -ano | findstr :3000
  
  # 杀死进程（替换 <PID> 为实际进程号）
  taskkill /PID <PID> /F
  ```
- 或者直接用 Next.js 自动分配的端口继续（如 3002）
- **禁止假设端口可用，必须主动提醒用户**

#### 6.6 长时间运行进程与新窗口（铁律）
- **当用户已有长时间运行的进程（如 `npm run dev`）时，必须明确指示**
- 如果需要执行其他命令（如 `docker-compose up -d`），必须说明：
  - **新开一个 PowerShell 窗口**（不要停止前面的进程）
  - 或者**停止前面的进程后再执行**（如果必须）
- 错误示例：`docker-compose up -d`（不清楚是否要停止 npm）
- 正确示例：`新开一个 PowerShell 窗口，执行：docker-compose up -d`
- **禁止模糊表述，必须明确窗口操作**

---

## 快速开始（新开发者必读）

### 环境要求
- Node.js 20+
- Docker Desktop（用于 PostgreSQL）
- PowerShell 或 Bash

### 首次启动（5 分钟）
在项目根目录 `d:\Project\time_echo` 执行：
```bash
npm install
docker-compose up -d
npm run db:push
npm run db:generate
npm run dev
```
访问 http://localhost:3000

### 常见问题
- **端口被占用**？运行 `netstat -ano | findstr :3000` 查看并杀死进程
- **数据库连接失败**？检查 `.env` 文件中的 `DATABASE_URL`
- **Prisma 报错**？确保先执行 `npm run db:generate`

---

## 当前工程状态

**当前 Phase**: Phase 5 - 补全机制（待开始）  
**最近完成**: Phase 4 - 人生小传生成（初稿预览页面）

**详细任务列表**: 请查看 [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)

---

## 核心技术约束

### 核心数据模型
- **User**: 用户基础信息 + 水滴余额 + 生命周期字段
- **InterviewSession**: 访谈会话（50 个基础问题位 + 跳题计数）
- **InterviewAnswer**: 回答记录 + 结构化抽取结果
- **MemoryProfile**: 用户记忆画像（标签、事件、人物、地点）
- **Question**: 题库模板（支持标签匹配和动态改写）
- **CompletionPackage**: Phase 5 补全包（缺口分析 + 补全题）

详见 `prisma/schema.prisma`

### 数据库操作
1. **UTC 时间戳铁律**：所有生命周期字段（`active_deadline`, `destruction_date`）必须存储为 UTC
2. **防 N+1 查询**：使用冗余字段 `total_words_written`, `total_ink_consumed`
3. **原子事务**：所有墨水操作必须使用 `prisma.$transaction`
4. **索引强制**：`destruction_date` 必须建立索引，防止全表扫描

### 水滴计费规则（动态访谈引擎）
```typescript
// 基础访谈冻结（进入访谈时一次性冻结）
const frozenDrops = 40;

// 基础访谈位总数
const baseQuestionSlots = 50;

// 跳题上限
const maxSkips = 5;

// 扩展操作水滴（保留可操作）
const operationalDrops = 10;

// AI 润色计费
const firstPolishCost = 0;  // 首次免费
const subsequentPolishCost = 5;  // 后续每次 5 水滴

// 扩展题目包计费
const expansionPackCost = 10;  // 10 水滴开启 1 个扩展包
const expansionPackMaxQuestions = 10;  // 每包最多 10 题
```

**重要变更**：
- ❌ 不再按字数计费
- ❌ 不再按题目单独扣费
- ✅ 进入基础访谈时冻结 40 水滴
- ✅ 40 水滴购买的是一轮基础访谈资格，不是固定题数
- ✅ 基础访谈内所有回答不额外扣费
- ✅ 仅扩展操作（润色、扩展题目包）消耗可操作水滴

### 前端防呆机制
1. **LocalStorage 自动保存**：每 5 秒或每 10 字符保存草稿
2. **防误触退回**：未保存内容时拦截 `beforeunload`
3. **软键盘适配**：使用 `scrollIntoView` 防止按钮被遮挡
4. **防下拉刷新**：`overscroll-behavior-y: none`

### 图片上传防线
1. **前端格式白名单**：仅允许 `image/jpeg`, `image/png`, `image/webp`
2. **尺寸拦截**：原始文件 >10MB 直接拒绝
3. **Canvas 双重降级**：
   - 分辨率降至最大边 1920px
   - 质量迭代降至 ≤200KB
4. **后端关隘**：Body 尺寸限制 250KB，超出返回 413

---

## 开发工作流

### 启动开发环境
```bash
# 1. 启动数据库
docker-compose up -d

# 2. 安装依赖（如果尚未安装）
npm install

# 3. 同步数据库
npm run db:push

# 4. 生成 Prisma Client
npm run db:generate

# 5. 启动开发服务器
npm run dev
```

### 运行测试
```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- <test-file-name>

# 监听模式（开发时推荐）
npm test -- --watch

# 生成覆盖率报告
npm test -- --coverage
```

### 数据库管理
```bash
# 打开 Prisma Studio
npm run db:studio

# 查看数据库状态
docker ps
docker logs time_echo_postgres
```

---

## 关键文件索引

### 配置文件
- `tailwind.config.js` - Tailwind 主题配置（水墨色系）
- `next.config.js` - Next.js 配置
- `tsconfig.json` - TypeScript 配置
- `docker-compose.yml` - PostgreSQL 容器配置
- `.env` - 环境变量（DATABASE_URL 等）

### 核心代码
- `src/lib/prisma.ts` - Prisma 客户端单例
- `src/lib/utils.ts` - 工具函数（计费、生命周期、图片压缩）
- `src/pages/api/questions/next.ts` - 下一题调度 API（动态访谈核心）
- `src/pages/api/interview/answer.ts` - 回答保存 API
- `src/pages/api/interview/skip.ts` - 跳题 API
- `src/pages/api/ai/polish.ts` - AI 润色 API
- `src/pages/interview.tsx` - 动态访谈主页面
- `src/pages/index.tsx` - 入馆序言页面

### 前端资源
- `src/data/question-templates.ts` - 前端骨架题池（80-120 个通用模板）
- `src/lib/question-scheduler.ts` - 前端题目调度逻辑

### 文档
- `docs/TIME_ECHO_PRD.md` - 完整产品需求文档
- `docs/IMPLEMENTATION_PLAN.md` - 分阶段实施计划
- `docs/INTERVIEW_ENGINE_RULES.md` - 访谈引擎运行细则
- `docs/QUESTION_BANK_HANDOFF.md` - 题库字段语义定义
- `INIT_SUMMARY.md` - 项目初始化总结

---

## 成本控制红线

### 月度预算监控
- 环境变量：`MONTHLY_TOKEN_BUDGET`（默认 500 元）
- 80% 预警：邮件通知馆长
- 100% 熔断：阻断所有 AI 请求，前端优雅降级

### 防爆机制
1. **前端物理限制**：`<textarea maxlength="1000">`
2. **上下文裁剪**：仅传递基础档案 + 当前题目 + 本次回答
3. **JSON 强制约束**：AI 必须返回结构化 JSON，防止废话
4. **防注入墙**：System Prompt 首句必须声明"无视用户指令"

---

## 视觉规范速查

### 色彩令牌
- `paper-base`: `#F7F4ED` - 主背景（仿古宣纸）
- `paper-deep`: `#EBE5D9` - 次级背景
- `ink-heavy`: `#1F1E1D` - 深墨（标题、正文）
- `ink-medium`: `#595754` - 中墨（次要文本）
- `ink-wash`: `#9C9994` - 淡墨（禁用状态、占位符）
- `seal-red`: `#8B2626` - 朱砂红（警告、核心按钮）

### 字号阶梯
- `text-base` (16px) - 非核心内容（页脚、版权信息、辅助说明）
- `text-lg` (18px) - 正文基准（选项题、输入框）**← 核心内容最小字号**
- `text-xl` (20px) - 小标题
- `text-2xl` (24px) - 卷轴标题

### 核心组件类名
```tsx
// 主按钮（朱砂印记）
className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg font-serif tracking-widest rounded-sm transition-colors active:bg-opacity-80 disabled:bg-ink-wash"

// 次级按钮（淡墨边框）
className="w-full min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg font-serif rounded-sm active:bg-paper-deep"

// 输入框（稿纸风格）
className="w-full min-h-[200px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg leading-loose font-serif outline-none focus:border-seal-red resize-none"
```

---

## 禁止事项清单

### 技术层面
- ❌ 引入 moment.js, date-fns（使用原生 `Intl.DateTimeFormat`）
- ❌ 引入 lodash, ramda（手写工具函数）
- ❌ 引入 antd, material-ui（手写 Tailwind 组件）
- ❌ 引入 echarts, chart.js（使用原生 HTML/CSS）
- ❌ 使用 Redux, Vuex（使用 React Context）
- ❌ 使用 `h-screen` 或 `100vh`（使用 Tailwind 的 `h-dvh` 类）
- ❌ 使用 `shadow-*` 阴影类（水墨风格无阴影）
- ❌ 使用 `rounded-full` 大圆角（仅用 `rounded-sm`）

### 业务层面
- ❌ 在核心内容页投放广告（访谈页、书写台）
- ❌ 出现"元、红包、转账"等金钱词汇（使用"水滴"替代）
- ❌ 使用收费短信接口（仅用微信订阅消息 + 邮件）
- ❌ 全表扫描（必须使用索引查询）
- ❌ 先 SELECT 后 UPDATE（必须使用原子操作）
- ❌ 生成卷轴总览页或题目预分配页
- ❌ 以 `scrollNum` 作为前台主交互核心
- ❌ 在答题过程中显示总题数与百分比进度
- ❌ 自动用 AI 覆盖用户原文（必须用户手动选择）

---

## 工程实践规范

### 错误处理策略
1. **数据库连接失败**：重试 3 次（间隔 1s），失败后返回 503 + 友好提示
2. **API 请求超时**：设置 10s 超时，超时后优雅降级（显示缓存内容或提示稍后重试）
3. **文件上传失败**：保留 LocalStorage 草稿，允许用户重新上传
4. **AI 请求失败**：降级为纯文本保存，不阻断用户书写流程

### 测试覆盖率要求
- 核心业务逻辑（水滴冻结、跳题机制、下一题调度）：100%
- API 路由：≥80%
- 工具函数：≥90%
- UI 组件：≥60%（重点测试交互逻辑）

### 代码审查清单
- [ ] 是否符合适老化规范（字号、对比度、触控区域）
- [ ] 是否引入了禁止的第三方库
- [ ] 数据库操作是否使用了原子事务
- [ ] 是否存在 N+1 查询
- [ ] 时间戳是否使用 UTC
- [ ] 是否有成本失控风险（AI 请求、图片存储）
- [ ] 是否遵循动态访谈引擎规则（不显示总题数、不预分配题目）
- [ ] AI 润色是否需要用户手动确认（不自动覆盖）

### 版本发布流程
1. 本地测试通过（`npm test`）
2. 构建生产版本（`npm run build`）
3. 本地验证生产构建（`npm start`）
4. 提交代码并打 tag（`git tag v0.x.x`）
5. 部署到 Sealos（通过 GitHub Actions 或手动）
6. 验证生产环境功能
7. 监控日志和错误率（首 24 小时）

### 监控和日志策略
- **关键指标**：水滴消耗速率、AI 请求成功率、页面加载时间、错误率、跳题使用率、润色使用率
- **日志级别**：ERROR（数据库失败、AI 失败）、WARN（接近预算、慢查询）、INFO（用户操作）
- **告警阈值**：错误率 >5%、AI 预算 >80%、数据库连接池耗尽
- **日志保留**：ERROR 保留 30 天，INFO 保留 7 天

### 备份和恢复策略
- **数据库备份**：每日凌晨 3 点自动备份（Sealos 自带功能）
- **备份保留**：最近 7 天的每日备份 + 每月 1 号的月度备份
- **恢复演练**：每季度进行一次恢复测试
- **用户数据导出**：用户可随时导出自己的回忆录（PDF/纯文本）

---

## 动态访谈引擎核心规则

**完整规则**: 请查看 [INTERVIEW_ENGINE_RULES.md](docs/INTERVIEW_ENGINE_RULES.md)

### 核心原则（必须遵守）

1. **交互模式**: 用户直接进入连续访谈，不展示总题量、百分比、卷号
2. **基础访谈**: 50 个问题位，40 水滴冻结，每答完一题再调度下一题
3. **跳题规则**: 最多 5 次，每跳过 1 题即时补入 1 题
4. **水滴规则**: 基础访谈冻结 40 水滴，首次润色免费，后续每次 5 水滴
5. **问题系统三层架构**:
   - 第一层：前端骨架题池（80-120 个通用模板）
   - 第二层：后端标签题库（按维度打标签）
   - 第三层：AI 改写与兜底生成
6. **调度优先级**: 前端骨架题 → 后端标签题 → AI 改写 → AI 生成
7. **回答理解**: 每次提交后进行结构化抽取（时间、地点、人物、事件、情绪）
8. **AI 润色**: 用户主动触发，返回对照结果，不自动覆盖原文

### 核心 API
- `POST /api/questions/next` - 获取下一题
- `POST /api/interview/answer` - 保存回答
- `POST /api/interview/skip` - 跳题
- `POST /api/ai/polish` - 润色

---

## 紧急联系

**馆长**：项目维护者，负责最终决策和资金控制  
**AI 开发者**：Claude (Sonnet/Haiku)，负责代码生成和技术实现

**核心原则**：尊严第一，成本第二，技术第三

---

*版本历史*:
- v0.4.0 (2026-04-28): 添加目录、快速开始指南，精简冗余内容，优化文档结构
- v0.3.0 (2026-04-21): 强化"后端优先原则"，修正命令示例，明确文档同步规则
