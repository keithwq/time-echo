#!/bin/bash

# 时光回响 - Sealos 部署脚本
# 使用方法: ./deploy-to-sealos.sh [版本号]

set -e

# 配置
DOCKER_USERNAME=${DOCKER_USERNAME:-"your-dockerhub-username"}
IMAGE_NAME="time-echo"
VERSION=${1:-"latest"}
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$VERSION"

echo "========================================"
echo "  时光回响 - Sealos 部署脚本"
echo "========================================"
echo ""

# 检查必要工具
echo "[1/6] 检查必要工具..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo "⚠️  kubectl 未安装，将跳过 Kubernetes 部署步骤"
fi

echo "✅ 工具检查通过"
echo ""

# 构建 Docker 镜像
echo "[2/6] 构建 Docker 镜像..."
echo "镜像名称: $FULL_IMAGE_NAME"
docker build -t $FULL_IMAGE_NAME .

echo "✅ 镜像构建完成"
echo ""

# 推送镜像到 Docker Hub
echo "[3/6] 推送镜像到 Docker Hub..."
echo "请确保已登录 Docker Hub: docker login"
docker push $FULL_IMAGE_NAME

echo "✅ 镜像推送完成"
echo ""

# 更新部署文件中的镜像版本
echo "[4/6] 更新部署配置..."
sed -i "s|image: your-dockerhub-username/time-echo:latest|image: $FULL_IMAGE_NAME|g" sealos-deploy.yaml

echo "✅ 部署配置更新完成"
echo ""

# 显示部署信息
echo "[5/6] 部署信息:"
echo "----------------------------------------"
echo "镜像: $FULL_IMAGE_NAME"
echo "配置文件: sealos-deploy.yaml"
echo "----------------------------------------"
echo ""

# 提示下一步操作
echo "[6/6] 下一步操作:"
echo ""
echo "1. 登录 Sealos 控制台: https://cloud.sealos.io"
echo "2. 创建新项目或选择现有项目"
echo "3. 在应用管理中点击「部署应用」"
echo "4. 选择「从 YAML 部署」"
echo "5. 上传或粘贴 sealos-deploy.yaml 内容"
echo "6. 配置环境变量（DATABASE_URL, OPENAI_API_KEY 等）"
echo "7. 点击部署"
echo ""
echo "或者使用 kubectl 部署（需要配置 kubeconfig）:"
echo "  kubectl apply -f sealos-deploy.yaml"
echo ""
echo "========================================"
echo "  部署准备完成！"
echo "========================================"
