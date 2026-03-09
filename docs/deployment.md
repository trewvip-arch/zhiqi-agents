# 部署指南

本文档介绍 AI 数字员工平台的部署流程。

## 部署架构

```
┌─────────────────────────────────────────────┐
│                 阿里云 ECS                    │
│  ┌─────────────────────────────────────────┐ │
│  │            Docker Compose                │ │
│  │  ┌─────────────┐  ┌─────────────────┐  │ │
│  │  │   Next.js   │  │     MongoDB     │  │ │
│  │  │   (Node)    │  │    (Port 27017) │  │ │
│  │  └─────────────┘  └─────────────────┘  │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 前置条件

1. **服务器**: 阿里云 ECS (推荐 2C4G 以上)
2. **软件**: Docker + Docker Compose
3. **域名**: 已备案域名 (可选)

## 环境变量

在服务器上创建 `.env` 文件：

```bash
# 百炼 API
DASHSCOPE_API_KEY=your_api_key_here

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/agents-gallery

# Agent APP_IDs
NEXT_PUBLIC_HIRELY_APP_ID=your_app_id
NEXT_PUBLIC_ATLAS_APP_ID=your_app_id
```

## 服务端部署

### 方式一：使用部署脚本 (推荐)

```bash
# 进入项目目录
cd /path/to/agents_gallery

# 执行部署脚本
./scripts/deploy.sh
```

脚本会自动完成：
1. 拉取最新代码 (`git pull origin main`)
2. 停止当前容器
3. 重新构建并启动容器
4. 显示容器状态

### 方式二：手动部署

```bash
# 拉取最新代码
git pull origin main

# 构建并启动
docker compose down
docker compose up -d --build

# 查看日志
docker compose logs -f
```

## 验证部署

```bash
# 查看容器状态
docker compose ps

# 检查应用日志
docker compose logs -f app

# 测试访问
curl http://localhost:3000
```

## 常用操作

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看日志
docker compose logs -f

# 进入容器 (调试)
docker compose exec app sh
```

## 回滚

如果部署出现问题，可以回滚到上一个版本：

```bash
# 查看 git 历史
git log --oneline -10

# 切换到上一个稳定版本
git checkout <commit_hash>

# 重新部署
docker compose up -d --build
```

## 监控

- 检查容器健康状态: `docker compose ps`
- 查看资源使用: `docker stats`
- 应用日志: `docker compose logs app -n 100`
