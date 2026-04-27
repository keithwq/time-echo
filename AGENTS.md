# AGENTS.md - 《时光回响》项目契约

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

### 0. 文档优先级与会话启动检查（最高优先级）

#### 强制读取顺序
在开始任何实施工作前，必须按以下顺序读取文档：
1. **IMPLEMENTATION_PLAN.md**（如果存在）- 实施计划，最高优先级
2. **AGENTS.md** - 项目契约
3. **PRD** - 产品需求文档

#### 会话启动检查清单
每次新会话开始时，AI 必须执行：
1. 使用 `Glob` 工具搜索 `**/IMPLEMENTATION_PLAN.md`
2. 如果存在，读取并确认当前 Phase 和剩余任务
3. 如果不存在，询问用户是否需要创建
4. 向用户确认："当前应该执行 [Phase X] 的 [Task Y]，是否继续？"

#### 执行纪律
- 如果 IMPLEMENTATION_PLAN.md 存在，所有工作必须严格按照其中的 Phase 和任务列表执行
- **禁止跳过、合并或重排任务顺序**，除非经过用户明确同意
- **禁止自作主张**建议"先做 X 再做 Y"，必须按 PLAN 顺序
- 如果发现 PLAN 与实际状态不符，必须先询问用户是否更新 PLAN

### 1. 严禁跳步
在执行任何依赖环境的指令前，必须引导馆长进行环境核验：
- 数据库是否启动？(`docker ps`)
- 依赖是否安装？(`node_modules` 是否存在)
- Prisma 是否同步？(`prisma generate` 是否执行)

### 2. 物理路径透明
任何命令必须明确物理位置：
```bash
# ✅ 正确
cd d:\DB\projects\time_echo && npm run dev

# ❌ 错误（位置不明）
npm run dev
```

### 3. 环境隔离检查
在操作数据库前，必须询问馆长：
- 是"本地 Docker"还是"云端 Sealos"？
- 环境变量 `.env` 是否正确配置？

### 4. 拒绝向导
严禁推荐使用 VS Code 的自动配置向导，必须保持手写配置的纯净度。

### 5. 后端优先原则
- **严禁在后端完成前修改前端代码**
- 数据模型、API 路由、数据库迁移必须全部完成并验证
- 前端 UI 改造必须基于已验证的后端接口
- 这样可以避免前后端不匹配导致的返工

---

## 当前工程状态

### ✅ 已完成
- [x] 项目初始化 (npm init)
- [x] Next.js 14 框架安装
- [x] Prisma Schema 定义（完整动态访谈引擎模型）
- [x] Tailwind 主题配置（水墨色系 + 适老化设计令牌）
- [x] 核心 API 路由（用户、墨水、任务）
- [x] 工具函数库（墨水计费、生命周期、图片压缩）
- [x] 测试框架（Jest + 计费公式验证）
- [x] 首页（入馆序言页面）
- [x] Docker Compose 配置（PostgreSQL）
- [x] Phase 1: 数据库迁移（InterviewSession, InterviewAnswer, MemoryProfile）
- [x] Phase 2: 核心业务逻辑（实体抽取、MemoryProfile 更新、调度器）
- [x] Phase 5: 前端骨架题池（80+ 题目，支持选择题）
- [x] Phase 3 部分：访谈启动、回答保存、跳题、获取下一题

### 🚧 进行中（Phase 3：API 接口开发）
- [ ] `/api/interview/extend` - 增加问题接口（1 水滴增加 2 个问题位）
- [ ] `/api/interview/generate` - 生成回忆录接口

### 📋 待开发
- [ ] Phase 4: 前端页面开发（完善 `/interview` 页面）
- [ ] Phase 6: 回忆录生成逻辑优化
- [ ] Phase 7: 测试与优化
- [ ] 主题聚合导出（回忆录生成）
- [ ] 图片上传与压缩
- [ ] 生命周期定时任务
- [ ] 微信订阅消息集成
- [ ] 互助广场页面
- [ ] 我的书房页面

---

## 核心技术约束

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

// 增加问题计费
const addQuestionsCost = 1;  // 1 水滴增加 2 个问题
```

**重要变更**：
- ❌ 不再按字数计费
- ❌ 不再按题目单独扣费
- ✅ 进入基础访谈时冻结 40 水滴
- ✅ 基础访谈内所有回答不额外扣费
- ✅ 仅扩展操作（润色、增题）消耗可操作水滴

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
cd d:\DB\projects\time_echo && docker-compose up -d

# 2. 安装依赖（如果尚未安装）
cd d:\DB\projects\time_echo && npm install

# 3. 同步数据库
cd d:\DB\projects\time_echo && npm run db:push

# 4. 生成 Prisma Client
cd d:\DB\projects\time_echo && npm run db:generate

# 5. 启动开发服务器
cd d:\DB\projects\time_echo && npm run dev
```

### 运行测试
```bash
# 运行所有测试
cd d:\DB\projects\time_echo && npm test

# 运行特定测试
cd d:\DB\projects\time_echo && npm test -- verify-billing-formula
cd d:\DB\projects\time_echo && npm test -- ink-concurrency-lock
cd d:\DB\projects\time_echo && npm test -- lifecycle-utc-check
```

### 数据库管理
```bash
# 打开 Prisma Studio
cd d:\DB\projects\time_echo && npm run db:studio

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
- `docs/TIME_ECHO_PRD.md` - 完整产品需求文档（4 部分）
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

### 1. 交互模式
- **默认进入访谈**：用户进入产品后直接开始连续访谈，不展示卷轴结构
- **不展示元素**：总题量、完成百分比、当前第几题、卷号
- **仅展示**：当前问题、回答区域、跳过按钮、整理按钮、保存状态

### 2. 基础访谈机会
- **基础访谈位总数**：50（代表 50 个基础问题位，不是预生成的 50 道固定题）
- **每次只展示**：1 个问题
- **问题不预先固定**：每答完一题，再调度下一题

### 3. 跳题规则
- **跳题上限**：5 次
- **跳题机制**：每跳过 1 题，系统即时补入 1 题
- **被跳过的问题**：永久移出当前任务流，不自动回流
- **上限用尽后**：隐藏跳过按钮
- **前台提示**：允许轻提示"还可跳过 N 次"

### 4. 水滴规则
- **基础冻结**：用户开始基础访谈时冻结 40 个水滴，中途退出不退回
- **扩展操作预算**：保留 10 个可操作水滴
  - 第一次 AI 润色：免费
  - 第二次及以后每次润色：5 个水滴
  - 增加问题：1 个水滴增加 2 个问题
- **前台展示规则**：不以"余额中心化"方式持续展示水滴，仅在触发动作时明确显示成本

### 5. 问题系统三层架构
#### 第一层：前端基础骨架题池
- 前端本地内置 80-120 个通用模板
- 用于首屏快速启动、弱网兜底、降低请求成本
- 覆盖：童年、家庭、求学、工作、婚姻、子女、迁徙、时代记忆、晚年感悟

#### 第二层：后端标签题库
- 按维度打标签：出生年代、性别、地域、城乡背景、职业、社会角色、教育背景、家庭结构、时代事件、主题分类、追问线索
- 示例标签：`#东北`、`#农村成长`、`#工厂`、`#教师`、`#恢复高考`、`#参军`、`#供销社`、`#婚育`、`#迁徙`、`#改革开放初期`

#### 第三层：AI 题目改写与兜底生成
- 改写候选题目，使其更贴近当前上下文
- 当本地骨架题与标签题库都无法给出合适结果时，生成新题
- 控制语气统一、适老、温和、不命令式
- **AI 不作为默认每轮出题主来源**

### 6. 下一题调度器
#### 调度原则
根据以下输入决定下一题：
- 当前题目、当前回答
- 用户画像、历史回答摘要
- 已覆盖主题、已提取的重要人物/地点/事件/情绪
- 跳题次数、已使用基础问题位数量

#### 下一题来源模式（四选一）
- **A. 深挖当前回答**：用户回答中出现具体人物、地点、职业、事件、时代线索时，继续追问
- **B. 延展当前主题**：围绕当前主题横向展开，不立即换主题
- **C. 切换相邻主题**：当前主题已获得足够内容时，切换到相邻人生阶段或相邻主题
- **D. 生成新题**：本地骨架题与标签题库均不足时，由 AI 生成自然承接的新题

#### 调度优先级（固定顺序）
1. 优先使用前端骨架题池
2. 骨架题不足时召回后端标签题库
3. 对候选题可调用 AI 轻改写
4. 无可用候选题时，AI 兜底生成

### 7. 回答理解层
#### 结构化抽取字段
每次用户提交回答后，系统必须进行结构化抽取：
- **时间信息**：年份、年龄段、时代阶段
- **地点信息**：出生地、迁徙地、工作地、长期居住地
- **人物信息**：父母、师傅、配偶、同学、子女、领导、朋友
- **身份信息**：职业、社会角色、家庭角色
- **事件信息**：求学、就业、参军、婚育、搬迁、转折、灾难、荣誉
- **物件信息**：时代物件、劳动工具、生活用品、学习用品
- **情绪信息**：骄傲、遗憾、辛苦、温暖、光荣、害怕、思念

#### MemoryProfile 维护
系统维护用户记忆画像，建议字段：
- `demographic_tags`、`covered_topics`、`key_life_events`
- `people_mentions`、`place_mentions`、`emotion_tags`
- `current_interview_state`、`free_polish_used`
- `skipped_count`、`base_slots_used`

### 8. AI 润色规则
- **调用规则**：用户主动动作，不自动覆盖原文
- **计费**：首次免费，后续每次 5 个水滴
- **输出格式**：返回对照结果（original_text + polished_text），用户手动决定是否采用
- **语气要求**：保留用户原意，不编造经历，不新增事实，不改变人物关系/时间顺序，仅进行表达整理与书面化提升

### 9. 生成回忆录
#### 生成条件（满足任一）
- 基础访谈位已使用完毕
- 用户主动点击"生成当前版本"
- 用户已通过扩展机制补充额外问题后，主动结束访谈

#### 导出结构
不再按"卷一、卷二……"组织，统一按主题聚合：
- 成长与童年
- 求学与初入社会
- 工作与本事
- 婚姻与家庭
- 所处时代的日常
- 人生中的重要人和地方
- 留给后人的话

导出时综合：原始回答、结构化线索、已采用的润色版本、主题覆盖情况、时间顺序与主题顺序

### 10. 核心 API 规范
#### `POST /api/questions/next` - 获取下一题
请求：`{ userId, currentQuestionId?, previousAnswer?, skippedCount, baseQuestionSlotsUsed }`
响应：`{ questionId, content, hint?, source: "local"|"db"|"ai", mode: "dig_deeper"|"extend_topic"|"switch_topic"|"generated" }`

#### `POST /api/interview/answer` - 保存回答
请求：`{ userId, questionId, answer }`
处理：保存回答 → 执行结构化抽取 → 更新 MemoryProfile

#### `POST /api/interview/skip` - 跳题
请求：`{ userId, questionId }`
处理：校验剩余跳题次数 → 移除当前题 → `skippedCount + 1` → 调度下一题

#### `POST /api/ai/polish` - 润色
请求：`{ userId, answerId, originalText, currentQuestion }`
响应：`{ original_text, polished_text, is_free, cost }`

### 11. 数据模型
#### User（新增字段）
- `free_polish_used: boolean`
- `base_interview_frozen_drops: number`
- `extension_drops_remaining: number`

#### InterviewSession（新增表）
- `id`, `user_id`, `base_slots_total`, `base_slots_used`
- `skipped_count`, `is_completed`, `is_generated`
- `started_at`, `updated_at`

#### InterviewAnswer（新增表）
- `id`, `user_id`, `session_id`, `question_id`, `content`
- `source_question_mode`, `extracted_entities`, `topic_tag`, `emotion_tag`
- `created_at`

#### MemoryProfile（新增表）
- `user_id`, `demographic_tags`, `covered_topics`, `key_life_events`
- `people_mentions`, `place_mentions`, `emotion_tags`, `current_state_summary`

#### Question（调整为模板化结构）
- `id`, `content_template`, `hint_template`
- `topic_tags`, `demographic_tags`, `trigger_tags`, `followup_tags`
- `tone_style`, `difficulty_level`, `source_type`

### 12. 开发优先级
#### P0（Phase 2 核心）
- `/interview` 页面
- 40 水滴冻结逻辑
- 50 个基础问题位
- 跳题 5 次机制
- 前端骨架题池
- `/api/questions/next`
- `/api/interview/answer`
- 首次润色免费

#### P1（Phase 3）
- 后端标签题库
- 回答理解层
- MemoryProfile
- AI 改写候选题
- 主题聚合导出

#### P2（Phase 4+）
- 更细颗粒度地域/职业/时代题库
- 更高质量 AI 兜底生成
- 更强的导出编排能力

---

## 紧急联系

**馆长**：项目维护者，负责最终决策和资金控制  
**AI 开发者**：Codex (Sonnet/Haiku)，负责代码生成和技术实现

**核心原则**：尊严第一，成本第二，技术第三

---

*最后更新：2026-04-17*  
*版本：v0.2.0 - 从"十二卷轴"迁移到"动态访谈引擎"*
