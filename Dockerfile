# 时光回响 - Sealos 部署 Dockerfile
# 使用简单模式，不启用 standalone

FROM node:18-alpine

# 安装必要依赖
RUN apk add --no-cache libc6-compat openssl postgresql-client

WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./
RUN npm ci

# 复制项目文件
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动命令（普通模式）
CMD ["npm", "start"]
