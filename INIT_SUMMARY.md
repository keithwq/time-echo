# Time Echo - 项目初始化完成

## 项目结构

```
time_echo/
├── src/
│   ├── pages/
│   │   ├── api/
│   │   │   ├── health.ts                 # 健康检查
│   │   │   ├── users/
│   │   │   │   ├── create.ts             # 用户创建
│   │   │   │   └── [userId].ts           # 用户查询
│   │   │   ├── ink/
│   │   │   │   ├── logs.ts               # 墨水流水查询
│   │   │   │   └── transaction.ts        # 墨水交易
│   │   │   └── tasks/
│   │   │       └── create.ts             # 任务创建
│   │   ├── _app.tsx                      # Next.js App 入口
│   │   ├── _document.tsx                 # HTML 文档结构
│   │   └── index.tsx                     # 首页（入馆序言）
│   ├── lib/
│   │   ├── prisma.ts                     # Prisma 客户端
│   │   └── utils.ts                      # 工具函数
│   └── styles/
│       └── globals.css                   # 全局样式 + Tailwind
├── prisma/
│   └── schema.prisma                     # 数据库模型
├── tests/
│   ├── verify-billing-formula.ts         # 墨水计费验证
│   ├── ink-concurrency-lock.ts           # 并发锁测试
│   └── lifecycle-utc-check.ts            # 生命周期 UTC 检查
├── docker-compose.yml                    # PostgreSQL 容器
├── package.json                          # 项目依赖
├── tsconfig.json                         # TypeScript 配置
├── tailwind.config.js                    # Tailwind 主题配置
├── next.config.js                        # Next.js 配置
├── postcss.config.js                     # PostCSS 配置
├── jest.config.js                        # Jest 测试配置
└── .env.example                          # 环境变量示例
```

## 核心特性已实现

✅ **Prisma Schema** - 完整的数据库模型（User, InkLog, MutualAidTask）
✅ **Tailwind 主题** - 水墨色系 + 适老化设计令牌
✅ **API 路由** - 用户、墨水、任务管理
✅ **工具函数** - 墨水计费、生命周期、图片压缩、LocalStorage 自动保存
✅ **测试框架** - 计费公式、并发锁、UTC 时间戳验证
✅ **首页** - 入馆序言页面（水墨风格）

## 下一步

1. **启动数据库**：`docker-compose up -d`
2. **安装依赖**：`npm install`
3. **同步数据库**：`npm run db:push`
4. **运行测试**：`npm test`
5. **启动开发服务器**：`npm run dev`

## 关键设计决策

- **零依赖**：无 moment.js、lodash、antd 等重型库
- **原子事务**：所有墨水操作使用 Prisma `$transaction`
- **UTC 时间戳**：所有生命周期日期存储为 UTC，前端本地转换
- **前端焦土压制**：图片压缩至 ≤200KB，textarea maxlength="1000"
- **Tailwind 强制**：所有颜色、字号、间距使用设计令牌
