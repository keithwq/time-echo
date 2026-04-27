# 时光回响 - Sealos 部署 Dockerfile
# 使用多阶段构建优化镜像大小

# 阶段1：依赖安装
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# 阶段2：构建
FROM node:18-alpine AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# 阶段3：运行
FROM node:18-alpine AS runner
WORKDIR /app

# 安装必要的运行时依赖
RUN apk add --no-cache postgresql-client

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 设置环境变量
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 复制必要文件
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# 复制构建输出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# 静态资源需要放在 standalone/.next/static 目录下
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/standalone/.next/static

# 复制 node_modules（包含 Prisma 依赖）
COPY --from=builder /app/node_modules ./node_modules

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动命令
CMD ["node", "server.js"]
