# AI 数字员工平台

企业AI数字员工门户网站，用户可浏览所有数字员工并点击进入聊天界面获得服务。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 到 `.env.local` 并填写：

```bash
# 百炼 API
DASHSCOPE_API_KEY=your_api_key
MONGODB_URI=mongodb://localhost:27017/agents-gallery

# Agent APP_IDs (在百炼控制台获取)
NEXT_PUBLIC_HIRELY_APP_ID=your_app_id
NEXT_PUBLIC_ATLAS_APP_ID=your_app_id
# ... 其他 agent
```

### 3. 启动 MongoDB

```bash
# 使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# 或使用本地 MongoDB
mongod --dbpath /path/to/data
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 部署

### 阿里云 ECS + PM2

1. 构建项目：
```bash
npm run build
```

2. 使用 PM2 启动：
```bash
pm2 start ecosystem.config.js
```

## 添加新的数字员工

编辑 `src/config/agents.ts`：

```typescript
{
  id: 'new-agent',           // URL slug
  appId: process.env.NEXT_PUBLIC_NEW_AGENT_APP_ID || '',
  name: '新数字员工',
  description: '描述...',
  avatar: '🤖',
  tags: ['标签1', '标签2'],
  category: '分类',
}
```

## 技术栈

- Next.js 14 (App Router)
- Ant Design 5
- MongoDB + Mongoose
- 阿里云百炼 API
