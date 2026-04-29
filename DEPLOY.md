# 时光回响 - Sealos 部署指南

## 概述

本文档指导你如何将《时光回响》项目部署到 Sealos 云平台。

## 部署前准备

### 1. 必要账号

- [Docker Hub](https://hub.docker.com) 账号（用于存储镜像）
- [Sealos](https://cloud.sealos.io) 账号
- 域名（可选，用于自定义域名访问）

### 2. 本地环境

确保本地已安装：
- Docker Desktop
- Git
- Node.js 18+

## 部署步骤

### 步骤1：构建并推送 Docker 镜像

#### 方式A：使用部署脚本（推荐）

```bash
# 进入项目目录
cd d:\DB\20_PROJECTS\time_echo

# 运行部署脚本
./scripts/deploy-to-sealos.sh v1.0.0
```

#### 方式B：手动操作

```bash
# 1. 登录 Docker Hub
docker login

# 2. 构建镜像
docker build -t your-dockerhub-username/time-echo:v1.0.0 .

# 3. 推送镜像
docker push your-dockerhub-username/time-echo:v1.0.0
```

### 步骤2：准备环境变量

在 Sealos 控制台中配置以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://user:pass@host:5432/db` |
| `OPENAI_API_KEY` | DeepSeek API Key | `sk-xxxxxxxxxx` |
| `OPENAI_BASE_URL` | API 基础地址 | `https://api.deepseek.com` |
| `OPENAI_MODEL` | 模型名称 | `deepseek-v4-flash` |
| `NODE_ENV` | 环境模式 | `production` |

### 步骤3：在 Sealos 部署

#### 方式A：使用 Sealos 控制台（推荐）

1. 登录 [Sealos 控制台](https://cloud.sealos.io)
2. 创建新项目，命名为 `time-echo`
3. 进入项目，点击「应用管理」→「部署应用」
4. 选择「从容器镜像部署」
5. 填写信息：
   - 镜像地址：`your-dockerhub-username/time-echo:v1.0.0`
   - 应用名称：`time-echo`
   - 端口：`3000`
   - 实例数：`1`
6. 在「环境变量」中添加步骤2准备的变量
7. 点击「部署」

#### 方式B：使用 YAML 部署

1. 修改 `sealos-deploy.yaml` 中的镜像地址和域名
2. 在 Sealos 控制台选择「从 YAML 部署」
3. 上传修改后的 `sealos-deploy.yaml`
4. 点击部署

### 步骤4：配置数据库

#### 选项A：使用 Sealos 提供的数据库

1. 在 Sealos 控制台点击「数据库」
2. 创建 PostgreSQL 数据库
3. 记录连接信息（主机、端口、用户名、密码）
4. 更新 `DATABASE_URL` 环境变量

#### 选项B：使用外部数据库

如果使用阿里云 RDS、腾讯云等外部数据库：
1. 确保数据库允许 Sealos 应用服务器访问
2. 配置 `DATABASE_URL` 为外部数据库连接字符串

### 步骤5：配置域名和 HTTPS

1. 在 Sealos 控制台进入应用详情
2. 点击「域名管理」
3. 添加自定义域名
4. 在域名服务商处添加 CNAME 记录指向 Sealos 提供的地址
5. 等待 SSL 证书自动签发（约 1-5 分钟）

## 验证部署

部署完成后，访问你的域名验证：

```bash
# 检查健康状态
curl https://your-domain.com/api/health

# 预期返回
{"status":"ok"}
```

## 成本估算

使用 Sealos 北京节点：

| 资源 | 规格 | 价格 |
|------|------|------|
| 应用容器 | 1核2G | ~0.07元/小时 (~50元/月) |
| 数据库 | PostgreSQL 1核1G | ~0.05元/小时 (~36元/月) |
| 存储 | 10GB | ~5元/月 |
| **总计** | | **~90元/月** |

## 监控和维护

### 查看日志

在 Sealos 控制台：
1. 进入应用详情
2. 点击「日志」标签
3. 查看实时日志

### 自动扩缩容

如需配置自动扩缩容：
1. 进入应用详情
2. 点击「自动扩缩容」
3. 配置规则（如 CPU > 70% 时扩容）

### 备份策略

数据库自动备份：
1. 进入数据库管理
2. 配置自动备份（建议每日凌晨3点）
3. 设置备份保留 7 天

## 故障排查

### 应用无法启动

检查日志中的错误信息：
```bash
# 常见原因
1. 环境变量未配置或配置错误
2. 数据库连接失败
3. 端口冲突
```

### 数据库连接失败

1. 检查 `DATABASE_URL` 格式是否正确
2. 确认数据库允许 Sealos 服务器访问
3. 检查网络策略和安全组

### 性能问题

1. 在 Sealos 控制台查看资源使用情况
2. 如 CPU/内存不足，升级容器配置
3. 考虑启用缓存（Redis）

## 更新部署

发布新版本时：

```bash
# 1. 构建新版本镜像
docker build -t your-dockerhub-username/time-echo:v1.1.0 .

# 2. 推送镜像
docker push your-dockerhub-username/time-echo:v1.1.0

# 3. 更新镜像前，先在 Sealos 控制台备份 PostgreSQL
# 备份完成后，在根目录 D:\Project\time_echo 执行数据库结构同步：
npx prisma db push

# 4. 在 Sealos 控制台更新镜像版本
# 进入应用详情 → 编辑 → 修改镜像标签 → 保存
```

> 线上数据库是唯一生产数据源。执行 `npx prisma db push` 前必须先完成 Sealos
> PostgreSQL 备份；不要使用 `--accept-data-loss`，确保本步骤只做加字段、加索引等非破坏性同步。

## 安全建议

1. **不要在代码中提交敏感信息**（API Key、密码等）
2. **使用 Sealos 密钥管理**存储敏感信息
3. **定期更新依赖**防止安全漏洞
4. **启用 HTTPS**确保数据传输安全
5. **配置数据库防火墙**只允许应用服务器访问

## 支持

遇到问题？
- Sealos 官方文档：https://sealos.io/docs
- Sealos 社区：https://forum.sealos.io
- 项目 Issues：https://github.com/your-repo/time-echo/issues

---

**部署日期**: 2026-04-27  
**版本**: v1.0.0  
**维护者**: 时光回响团队
