# AI 数字员工平台 - Design Document

## Overview

企业AI数字员工门户网站，用户可浏览所有数字员工并点击进入聊天界面获得服务。

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14+ (App Router) |
| UI Library | Ant Design |
| AI Backend | 阿里云百炼 (DashScope API) |
| Database | MongoDB (Self-hosted) |
| Deployment | 阿里云 ECS + PM2 |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Application                     │
│                     (App Router + RSC)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Agent     │  │   Chat      │  │   Conversation      │  │
│  │   Gallery   │──▶   Page      │──▶   History          │  │
│  │   (Home)    │  │             │  │                     │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Server Actions (API Layer)                │  │
│  │  • sendMessage()  • getConversation()  • listAgents() │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
            │                           │
            ▼                           ▼
┌───────────────────────┐    ┌─────────────────────┐
│   阿里云百炼 API       │    │      MongoDB        │
│   • Agent Chat        │    │  • Conversations    │
│   • Streaming         │    │  • Messages         │
└───────────────────────┘    └─────────────────────┘
```

## Data Models

### Agent Configuration (Local Config)

```typescript
// config/agents.ts
interface Agent {
  id: string;              // Unique identifier (URL slug)
  appId: string;           // 百炼 APP_ID
  name: string;            // Display name
  description: string;     // Short description
  avatar: string;          // Avatar image URL or emoji
  tags: string[];          // Tags for filtering
  category: string;        // Category grouping
}
```

### MongoDB Schema

```typescript
interface Conversation {
  _id: ObjectId;
  agentId: string;
  title?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Agent Gallery (home) |
| `/chat/[agentId]` | New chat with agent |
| `/chat/[agentId]/[conversationId]` | Continue conversation |

## Components Structure

```
app/
├── layout.tsx
├── page.tsx                    # Agent Gallery
├── chat/
│   └── [agentId]/
│       ├── page.tsx            # Chat page
│       └── [conversationId]/
│           └── page.tsx        # Continue conversation
│
components/
├── AgentCard.tsx
├── AgentGrid.tsx
├── chat/
│   ├── ChatHeader.tsx
│   ├── MessageList.tsx
│   ├── MessageItem.tsx
│   ├── ChatInput.tsx
│   └── ConversationList.tsx
│
lib/
├── mongodb.ts                  # MongoDB connection
├── models/
│   └── Conversation.ts         # Mongoose model
├── bailian.ts                  # 百炼 API client
│
config/
└── agents.ts                   # Agent configurations
```

## 百炼 API Integration

### Endpoint

```
POST https://dashscope.aliyuncs.com/api/v1/apps/{APP_ID}/completion
```

### Request

```json
{
  "prompt": "用户消息",
  "session_id": "会话ID（多轮对话）",
  "stream": true,
  "incremental_output": true
}
```

### Headers

```
Authorization: Bearer {DASHSCOPE_API_KEY}
Content-Type: application/json
```

## Environment Variables

```bash
# .env.local
DASHSCOPE_API_KEY=sk-xxxxx
MONGODB_URI=mongodb://localhost:27017/agents-gallery
```

## Deployment

### Architecture on 阿里云

```
┌─────────────────────────────────────────────────────────────┐
│                     阿里云 Architecture                      │
├─────────────────────────────────────────────────────────────┤
│   ┌─────────────┐      ┌─────────────────────────────────┐ │
│   │    SLB      │─────▶│           ECS Instance           │ │
│   │ (负载均衡)   │      │  ┌─────────────────────────────┐│ │
│   └─────────────┘      │  │   Next.js App (PM2)         ││ │
│                        │  └─────────────────────────────┘│ │
│                        └─────────────────────────────────┘ │
│                                     │                       │
│                        ┌────────────┴────────────┐         │
│                        ▼                         ▼         │
│              ┌─────────────────┐      ┌─────────────────┐  │
│              │    MongoDB      │      │  百炼 API        │  │
│              └─────────────────┘      └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'agents-gallery',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      PORT: 3000,
      NODE_ENV: 'production'
    }
  }]
}
```

## Features

- [x] Agent gallery with card display
- [x] Click agent to start chat
- [x] Streaming chat responses from 百炼
- [x] Conversation history saved to MongoDB
- [x] Resume previous conversations
- [x] Responsive design with Ant Design
- [ ] Category filtering (optional future)
- [ ] Search agents (optional future)

## Security

- API keys stored server-side only (not exposed to client)
- No authentication required (public access)
- MongoDB connection secured with credentials
