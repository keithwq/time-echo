# 时光回响 - Sealos 极简部署指南（新人友好版）

## 为什么选择这个方案？

✅ **无需 Docker 知识** - Sealos 自动帮你构建  
✅ **无需 Docker Hub** - 直接从 GitHub 部署  
✅ **调试方便** - 改代码 → 推送到 GitHub → 自动重新部署  
✅ **成本最低** - 按量付费，不用时暂停不收费  

---

## 准备工作（5分钟）

### 1. 注册账号

你需要注册两个账号（都是免费的）：

| 平台 | 用途 | 注册地址 |
|------|------|----------|
| **GitHub** | 存储代码 | https://github.com |
| **Sealos** | 部署应用 | https://cloud.sealos.io |

### 2. 把代码上传到 GitHub

#### 步骤A：在 GitHub 创建仓库

1. 登录 GitHub
2. 点击右上角 `+` → `New repository`
3. 填写：
   - Repository name: `time-echo`
   - Description: `时光回响 - 适老化公益回忆录平台`
   - 选择 `Public`（公开）
   - 勾选 `Add a README file`
4. 点击 `Create repository`

#### 步骤B：上传代码

打开 PowerShell，执行以下命令：

```powershell
# 进入项目目录
cd d:\DB\20_PROJECTS\time_echo

# 初始化 Git（如果还没初始化）
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit for Sealos deployment"

# 连接 GitHub 仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/time-echo.git

# 推送代码
git push -u origin main
```

**完成！** 你的代码现在在 GitHub 上了。

---

## 在 Sealos 部署（3分钟）

### 步骤1：创建项目

1. 登录 [Sealos 控制台](https://cloud.sealos.io)
2. 点击「创建项目」
3. 项目名称：`time-echo`
4. 点击「创建」

### 步骤2：部署应用

1. 进入项目，点击「应用管理」
2. 点击「部署应用」
3. 选择 **「从 Git 仓库部署」**
4. 填写信息：
   - **Git 仓库地址**: `https://github.com/YOUR_USERNAME/time-echo`
   - **分支**: `main`
   - **Dockerfile 路径**: `./Dockerfile`（保持默认）
   - **应用名称**: `time-echo`
   - **容器端口**: `3000`
5. 点击「下一步」

### 步骤3：配置环境变量

点击「添加环境变量」，逐个添加：

```
DATABASE_URL=postgresql://postgres:你的密码@db:5432/time_echo
OPENAI_API_KEY=sk-你的DeepSeekAPI密钥
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-v4-flash
NODE_ENV=production
```

**注意**：先不要填 `DATABASE_URL`，等创建数据库后再回来修改！

### 步骤4：创建数据库

1. 在 Sealos 控制台，点击「数据库」
2. 点击「创建数据库」
3. 选择 **PostgreSQL**
4. 配置：
   - **数据库名称**: `time-echo-db`
   - **用户名**: `postgres`
   - **密码**: 设置一个强密码（记下来！）
   - **版本**: 14
   - **规格**: 1核1G（约36元/月）
5. 点击「创建」

创建完成后，会显示数据库连接信息：
- 主机：`postgresql-db.time-echo.svc.cluster.local`
- 端口：`5432`

### 步骤5：更新环境变量

回到你的应用，更新 `DATABASE_URL`：

```
DATABASE_URL=postgresql://postgres:你的密码@postgresql-db.time-echo.svc.cluster.local:5432/time_echo
```

### 步骤6：启动应用

1. 点击「部署」
2. 等待 2-3 分钟（首次构建需要时间较长）
3. 看到状态变为「运行中」就成功了！

---

## 访问你的应用

部署成功后，Sealos 会给你一个访问地址：

```
https://time-echo-xxx.cloud.sealos.io
```

点击即可访问！

---

## 如何更新代码？（超级简单！）

当你修改了代码，想要更新线上版本：

```powershell
# 进入项目目录
cd d:\DB\20_PROJECTS\time_echo

# 添加修改的文件
git add .

# 提交修改
git commit -m "修复了xxx问题"

# 推送到 GitHub
git push
```

**完成！** Sealos 会自动检测代码更新，重新构建并部署！

---

## 调试技巧

### 查看日志

如果应用出错了：
1. 进入 Sealos 控制台
2. 点击你的应用
3. 点击「日志」标签
4. 查看错误信息

### 本地测试 vs 线上环境

| 环境 | 用途 | 地址 |
|------|------|------|
| 本地 | 开发调试 | http://localhost:3000 |
| 线上 | 正式使用 | https://time-echo-xxx.cloud.sealos.io |

**建议**：先在本地测试好，再推送到 GitHub 部署线上！

### 暂停应用（省钱）

不用的时候暂停应用，不收费：
1. 进入应用详情
2. 点击「暂停」
3. 需要时再点击「启动」

---

## 成本估算

| 资源 | 月费用 |
|------|--------|
| 应用容器 (1核2G) | ~50元 |
| 数据库 (1核1G) | ~36元 |
| **总计** | **~86元/月** |

**省钱技巧**：
- 开发测试阶段暂停数据库和应用
- 只在需要时启动
- 实际使用可能更低

---

## 常见问题

### Q: 部署失败怎么办？

A: 检查以下几点：
1. GitHub 仓库是否公开？（Sealos 需要访问）
2. 环境变量是否填对？
3. 查看 Sealos 日志，看具体错误

### Q: 如何绑定自己的域名？

A:
1. 在 Sealos 应用详情点击「域名管理」
2. 添加自定义域名
3. 在域名服务商添加 CNAME 记录
4. 等待 SSL 证书自动签发

### Q: 数据库数据会丢失吗？

A: 不会！Sealos 数据库有自动备份。但建议：
1. 定期导出数据备份
2. 重要更新前先备份

---

## 需要帮助？

遇到问题可以：
1. 查看 Sealos 官方文档：https://sealos.io/docs
2. 在 GitHub 提交 Issue
3. 询问我（Codex）

---

**祝你部署顺利！** 🚀
