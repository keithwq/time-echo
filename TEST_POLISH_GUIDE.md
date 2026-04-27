## AI 润色功能测试指南

本目录包含两种测试脚本来验证 AI 润色（Polish）功能：

### 1. 单元测试 (`__tests__/api/ai-polish.test.ts`)

**用途**：测试数据库操作、业务逻辑、状态管理

**测试场景**：
- ✅ 首次润色免费
- ✅ 后续润色扣费 5 水滴
- ✅ 水滴不足时拒绝
- ✅ 文本改写逻辑（去空格、加句号、词汇替换）
- ✅ 用户状态追踪

**运行方式**：

```bash
# 运行所有测试
npm test

# 仅运行 AI 润色测试
npm test -- ai-polish

# 运行并显示详细输出
npm test -- ai-polish --verbose

# 运行并生成覆盖率报告
npm test -- ai-polish --coverage
```

**前置条件**：
- PostgreSQL 数据库已启动（`docker-compose up -d`）
- Prisma 已同步（`npm run db:push`）

---

### 2. HTTP 集成测试 (`scripts/test-polish-api.ts`)

**用途**：测试完整的 API 端点、HTTP 请求/响应、实际服务器行为

**测试场景**：
- ✅ 首次润色免费
- ✅ 第二次润色扣费 5 水滴
- ✅ 水滴不足时拒绝
- ✅ 文本改写逻辑
- ✅ 缺少必需字段时拒绝

**运行方式**：

```bash
# 步骤 1: 启动开发服务器（在一个终端）
npm run dev

# 步骤 2: 在另一个终端运行测试脚本
npx ts-node scripts/test-polish-api.ts
```

**预期输出**：

```
🚀 开始 AI 润色 API 集成测试
📍 API 地址: http://localhost:3000/api

📝 创建测试用户...
✅ 用户创建成功: user-xxx

🧪 测试 1: 首次润色免费
✅ 首次润色免费成功
   原文: 我觉得那个时候挺困难的，特别是在工厂里工作
   润色: 我认为那个时候很困难的，非常是在工厂里工作。
   成本: 0 水滴 (免费)
   剩余: 50 水滴

🧪 测试 2: 第二次润色扣费 5 水滴
✅ 第二次润色扣费成功
   原文: 我觉得挺好的，特别是那段时间
   润色: 我认为很好的，非常是那段时间。
   成本: 5 水滴
   剩余: 45 水滴

...

============================================================
📊 测试总结
============================================================
✅ 首次润色免费
✅ 第二次润色扣费
✅ 水滴不足拒绝
✅ 文本改写逻辑
✅ 缺少必需字段
============================================================
总计: 5/5 测试通过
============================================================
```

---

### 3. 手动测试（使用 curl）

如果你想手动测试 API，可以使用 curl 命令：

```bash
# 创建测试用户
curl -X POST http://localhost:3000/api/users/create \
  -H "Content-Type: application/json" \
  -d '{"role":"USER"}'

# 测试首次润色（免费）
curl -X POST http://localhost:3000/api/ai/polish \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-xxx",
    "answerId": "answer-1",
    "originalText": "我觉得那个时候挺困难的，特别是在工厂里工作"
  }'

# 测试第二次润色（扣费）
curl -X POST http://localhost:3000/api/ai/polish \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-xxx",
    "answerId": "answer-2",
    "originalText": "我觉得挺好的，特别是那段时间"
  }'
```

---

### 4. 测试覆盖的功能点

| 功能 | 单元测试 | 集成测试 | 说明 |
|------|---------|---------|------|
| 首次润色免费 | ✅ | ✅ | 验证 `freePolishUsed` 标记和成本 |
| 后续润色扣费 | ✅ | ✅ | 验证 5 水滴扣费和墨水流水记录 |
| 水滴不足拒绝 | ✅ | ✅ | 验证余额检查逻辑 |
| 文本改写 | ✅ | ✅ | 验证词汇替换、空格处理、句号补全 |
| 用户状态追踪 | ✅ | ✅ | 验证数据库状态更新 |
| 原子事务 | ✅ | ❌ | 仅在单元测试中验证 |
| HTTP 错误处理 | ❌ | ✅ | 验证 400/404/500 响应 |
| 缺少字段验证 | ❌ | ✅ | 验证请求参数校验 |

---

### 5. 常见问题

**Q: 运行测试时出现 "Cannot find module" 错误**

A: 确保已安装依赖：
```bash
npm install
npm run db:generate
```

**Q: 集成测试连接不到服务器**

A: 确保开发服务器已启动：
```bash
npm run dev
```

**Q: 测试失败，显示 "User not found"**

A: 检查数据库是否正确启动：
```bash
docker ps
docker-compose up -d
```

**Q: 如何只运行特定的测试用例？**

A: 使用 Jest 的 `-t` 选项：
```bash
npm test -- ai-polish -t "首次润色免费"
```

---

### 6. 调试技巧

**启用详细日志**：

```bash
# 单元测试
DEBUG=* npm test -- ai-polish

# 集成测试
DEBUG=* npx ts-node scripts/test-polish-api.ts
```

**查看数据库状态**：

```bash
# 打开 Prisma Studio
npm run db:studio

# 然后访问 http://localhost:5555
```

**检查墨水流水记录**：

```bash
# 在 Prisma Studio 中查看 InkLog 表
# 或使用 SQL 查询
SELECT * FROM "InkLog" WHERE "userId" = 'user-xxx' ORDER BY "createdAt" DESC;
```

---

### 7. 下一步

- [ ] 集成真实 AI 服务（Claude/GPT）替换 `mockPolishText`
- [ ] 添加性能测试（响应时间、并发处理）
- [ ] 添加边界情况测试（超长文本、特殊字符）
- [ ] 添加 E2E 测试（前端 UI 集成）
