# AI 数字员工平台 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an enterprise AI digital employee portal where users can browse agents and chat with them via 阿里云百炼 API.

**Architecture:** Next.js 14+ App Router with Server Components, Ant Design for UI, MongoDB for conversation persistence, and 百炼 DashScope API for AI chat with streaming responses.

**Tech Stack:** Next.js 14, React 18, TypeScript, Ant Design 5, MongoDB + Mongoose, 百炼 DashScope API

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `.env.local.example`
- Create: `.gitignore`

**Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

When prompted:
- Would you like to customize the default import alias? → No

Expected: Project scaffolded with Next.js 14+ App Router

**Step 2: Install additional dependencies**

Run:
```bash
npm install antd @ant-design/nextjs-registry mongoose uuid
npm install -D @types/uuid
```

Expected: All dependencies installed successfully

**Step 3: Create environment file template**

Create `.env.local.example`:
```bash
# 百炼 API
DASHSCOPE_API_KEY=your_dashscope_api_key_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/agents-gallery
```

**Step 4: Update .gitignore**

Add to `.gitignore`:
```
# Environment variables
.env.local
.env*.local

# IDE
.idea/
.vscode/

# OS
.DS_Store
```

**Step 5: Commit**

```bash
git add .
git commit -m "chore: initialize Next.js project with dependencies

- Next.js 14 with App Router and TypeScript
- Ant Design for UI components
- Mongoose for MongoDB
- UUID for conversation IDs

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Agent Configuration

**Files:**
- Create: `src/config/agents.ts`
- Create: `src/types/agent.ts`

**Step 1: Create Agent type definition**

Create `src/types/agent.ts`:
```typescript
export interface Agent {
  id: string;              // URL slug
  appId: string;           // 百炼 APP_ID
  name: string;            // Display name
  description: string;     // Short description
  avatar: string;          // Emoji or image URL
  tags: string[];          // Tags for filtering
  category: string;        // Category grouping
}

export interface AgentConfig {
  agents: Agent[];
  categories: string[];
}
```

**Step 2: Create agent configuration data**

Create `src/config/agents.ts`:
```typescript
import { Agent, AgentConfig } from '@/types/agent';

export const agents: Agent[] = [
  {
    id: 'hirely',
    appId: process.env.NEXT_PUBLIC_HIRELY_APP_ID || '',
    name: 'AI招聘数字员工 Hirely',
    description: '智能招聘解决方案，提供JD智能生成、简历智能筛选、员工政策咨询等全流程HR服务',
    avatar: '👤',
    tags: ['招聘', 'HR', 'JD生成'],
    category: '人力资源',
  },
  {
    id: 'atlas',
    appId: process.env.NEXT_PUBLIC_ATLAS_APP_ID || '',
    name: 'AI项目管理数字员工 Atlas',
    description: '企业项目管理的数字仪表盘，具有实时KPI跟踪、风险分析和AI驱动的项目洞察功能',
    avatar: '📊',
    tags: ['项目管理', 'KPI监控', '数据分析'],
    category: '项目管理',
  },
  {
    id: 'nexus',
    appId: process.env.NEXT_PUBLIC_NEXUS_APP_ID || '',
    name: 'AI人力资源数字员工 NEXUS',
    description: '企业级AI人力资源全生命周期数字化管理与智能化决策支持平台',
    avatar: '💼',
    tags: ['人力资源', 'HR管理', '数字化'],
    category: '人力资源',
  },
  {
    id: 'finance',
    appId: process.env.NEXT_PUBLIC_FINANCE_APP_ID || '',
    name: 'AI金融数字员工',
    description: '专业金融服务数字员工，覆盖银行业务、理财规划、保险咨询等场景',
    avatar: '💰',
    tags: ['金融', '银行', '理财'],
    category: '金融',
  },
  {
    id: 'logistics',
    appId: process.env.NEXT_PUBLIC_LOGISTICS_APP_ID || '',
    name: 'AI物流数字员工',
    description: '智能物流解决方案，提供路线优化、仓储管理、配送调度等全链路物流服务支持',
    avatar: '📦',
    tags: ['物流', '配送', '仓储'],
    category: '物流',
  },
  {
    id: 'marketing',
    appId: process.env.NEXT_PUBLIC_MARKETING_APP_ID || '',
    name: 'AI营销数字员工',
    description: '零售营销智能化解决方案，提供精准营销、客户运营、销售转化等全方位营销支持',
    avatar: '📈',
    tags: ['营销', '零售', '电商'],
    category: '营销',
  },
];

export const categories = [...new Set(agents.map(a => a.category))];

export const agentConfig: AgentConfig = {
  agents,
  categories,
};

export function getAgentById(id: string): Agent | undefined {
  return agents.find(agent => agent.id === id);
}

export function getAgentsByCategory(category: string): Agent[] {
  return agents.filter(agent => agent.category === category);
}
```

**Step 3: Commit**

```bash
git add src/types/agent.ts src/config/agents.ts
git commit -m "feat: add agent configuration and types

- Define Agent interface with id, appId, name, description, avatar, tags
- Add 6 sample agents: Hirely, Atlas, NEXUS, Finance, Logistics, Marketing
- Export helper functions for agent lookup

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: MongoDB Connection and Models

**Files:**
- Create: `src/lib/mongodb.ts`
- Create: `src/lib/models/Conversation.ts`
- Create: `src/types/conversation.ts`

**Step 1: Create conversation types**

Create `src/types/conversation.ts`:
```typescript
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface ConversationDocument {
  _id: string;
  agentId: string;
  title?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationInput {
  agentId: string;
  title?: string;
}

export interface AddMessageInput {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
}
```

**Step 2: Create MongoDB connection utility**

Create `src/lib/mongodb.ts`:
```typescript
import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}
```

**Step 3: Create Conversation model**

Create `src/lib/models/Conversation.ts`:
```typescript
import mongoose from 'mongoose';
import { Message } from '@/types/conversation';

const messageSchema = new mongoose.Schema<Message>({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema(
  {
    agentId: { type: String, required: true, index: true },
    title: { type: String },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

// Index for querying conversations by agent, sorted by update time
conversationSchema.index({ agentId: 1, updatedAt: -1 });

export const Conversation =
  mongoose.models.Conversation ||
  mongoose.model('Conversation', conversationSchema);

export type ConversationDocumentType = mongoose.Document &
  typeof conversationSchema.methods & {
    agentId: string;
    title?: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
  };
```

**Step 4: Commit**

```bash
git add src/lib/mongodb.ts src/lib/models/Conversation.ts src/types/conversation.ts
git commit -m "feat: add MongoDB connection and Conversation model

- MongoDB connection with global caching for serverless
- Conversation model with embedded messages
- Indexes for efficient querying by agent and time

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 百炼 API Client

**Files:**
- Create: `src/lib/bailian.ts`

**Step 1: Create 百炼 API client**

Create `src/lib/bailian.ts`:
```typescript
import { v4 as uuidv4 } from 'uuid';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1/apps';

export interface SendMessageInput {
  appId: string;
  message: string;
  sessionId?: string;
}

export interface BailianResponse {
  success: boolean;
  content?: string;
  sessionId?: string;
  error?: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export async function* sendMessageStream(
  input: SendMessageInput
): AsyncGenerator<StreamChunk> {
  const { appId, message, sessionId } = input;

  if (!DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY is not configured');
  }

  const response = await fetch(`${DASHSCOPE_BASE_URL}/${appId}/completion`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      prompt: message,
      session_id: sessionId,
      stream: true,
      incremental_output: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`百炼 API error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        yield { content: '', done: true };
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.output?.text || '';
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function sendMessage(input: SendMessageInput): Promise<BailianResponse> {
  const { appId, message, sessionId } = input;

  if (!DASHSCOPE_API_KEY) {
    return { success: false, error: 'DASHSCOPE_API_KEY is not configured' };
  }

  try {
    const response = await fetch(`${DASHSCOPE_BASE_URL}/${appId}/completion`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: message,
        session_id: sessionId,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    return {
      success: true,
      content: data.output?.text || '',
      sessionId: data.output?.session_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/bailian.ts
git commit -m "feat: add 百炼 API client with streaming support

- Streaming response support for real-time chat
- Non-streaming fallback for simple queries
- Proper error handling and SSE parsing

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Server Actions for Chat

**Files:**
- Create: `src/app/actions/conversation.ts`
- Create: `src/app/actions/chat.ts`

**Step 1: Create conversation server actions**

Create `src/app/actions/conversation.ts`:
```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/mongodb';
import { Conversation } from '@/lib/models/Conversation';
import { Message } from '@/types/conversation';

export async function createConversation(agentId: string) {
  await connectToDatabase();

  const conversation = await Conversation.create({
    agentId,
    messages: [],
  });

  return conversation._id.toString();
}

export async function getConversation(conversationId: string) {
  await connectToDatabase();

  const conversation = await Conversation.findById(conversationId).lean();

  if (!conversation) {
    return null;
  }

  return {
    _id: conversation._id.toString(),
    agentId: conversation.agentId,
    title: conversation.title,
    messages: conversation.messages.map((m: Message) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

export async function getConversationsByAgent(agentId: string) {
  await connectToDatabase();

  const conversations = await Conversation.find({ agentId })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  return conversations.map((c) => ({
    _id: c._id.toString(),
    agentId: c.agentId,
    title: c.title,
    messageCount: c.messages.length,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
) {
  await connectToDatabase();

  const message: Message = {
    id: uuidv4(),
    role,
    content,
    createdAt: new Date(),
  };

  const updateData: Record<string, unknown> = {
    $push: { messages: message },
    updatedAt: new Date(),
  };

  // Set title from first user message
  const conversation = await Conversation.findById(conversationId);
  if (conversation && !conversation.title && role === 'user') {
    updateData.$set = { title: content.slice(0, 50) };
  }

  await Conversation.findByIdAndUpdate(conversationId, updateData);

  revalidatePath(`/chat/${conversation.agentId}/${conversationId}`);

  return message;
}

export async function deleteConversation(conversationId: string) {
  await connectToDatabase();

  await Conversation.findByIdAndDelete(conversationId);
}
```

**Step 2: Create chat server action**

Create `src/app/actions/chat.ts`:
```typescript
'use server';

import { addMessage } from './conversation';
import { sendMessageStream, SendMessageInput } from '@/lib/bailian';

export async function chat(
  conversationId: string,
  agentId: string,
  appId: string,
  userMessage: string
) {
  // Save user message
  await addMessage(conversationId, 'user', userMessage);

  // Stream response from 百炼
  const input: SendMessageInput = {
    appId,
    message: userMessage,
  };

  let fullResponse = '';

  try {
    const stream = sendMessageStream(input);

    const chunks: string[] = [];

    for await (const chunk of stream) {
      if (chunk.done) break;
      chunks.push(chunk.content);
      fullResponse += chunk.content;
    }

    // Save assistant message
    await addMessage(conversationId, 'assistant', fullResponse);

    return {
      success: true,
      content: fullResponse,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**Step 3: Commit**

```bash
git add src/app/actions/conversation.ts src/app/actions/chat.ts
git commit -m "feat: add server actions for conversation and chat

- CRUD operations for conversations
- Message persistence with auto-title generation
- Chat action with streaming response handling

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Root Layout and Ant Design Setup

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Update root layout with Ant Design**

Replace `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI 数字员工平台',
  description: '汇聚企业智能助手，提升工作效率',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <ConfigProvider
            locale={zhCN}
            theme={{
              token: {
                colorPrimary: '#1677ff',
                borderRadius: 8,
              },
            }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
```

**Step 2: Update globals.css**

Replace `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #f5f5f5;
  min-height: 100vh;
}
```

**Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: configure Ant Design with Chinese locale

- AntdRegistry for SSR compatibility
- Chinese locale configuration
- Primary theme color setup

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Agent Card Component

**Files:**
- Create: `src/components/AgentCard.tsx`

**Step 1: Create AgentCard component**

Create `src/components/AgentCard.tsx`:
```typescript
'use client';

import { Card, Tag, Typography } from 'antd';
import Link from 'next/link';
import { Agent } from '@/types/agent';

const { Text, Paragraph } = Typography;

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link href={`/chat/${agent.id}`} style={{ textDecoration: 'none' }}>
      <Card
        hoverable
        className="h-full transition-all duration-300 hover:shadow-lg"
        styles={{
          body: { padding: '20px' },
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="text-4xl">{agent.avatar}</span>
            <div className="flex-1 min-w-0">
              <Text strong className="text-base block mb-1">
                {agent.name}
              </Text>
              <Text type="secondary" className="text-xs">
                {agent.category}
              </Text>
            </div>
          </div>

          <Paragraph
            ellipsis={{ rows: 2 }}
            className="text-sm text-gray-600 mb-0"
          >
            {agent.description}
          </Paragraph>

          <div className="flex flex-wrap gap-1">
            {agent.tags.slice(0, 3).map((tag) => (
              <Tag key={tag} color="blue" className="text-xs">
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/AgentCard.tsx
git commit -m "feat: add AgentCard component for gallery display

- Avatar, name, category, description display
- Tag chips with max 3 visible
- Hover effect with link to chat

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Home Page - Agent Gallery

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Create home page with agent gallery**

Replace `src/app/page.tsx`:
```typescript
import { Typography, Row, Col } from 'antd';
import AgentCard from '@/components/AgentCard';
import { agents, categories } from '@/config/agents';

const { Title, Paragraph } = Typography;

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Title level={1} className="mb-4">
            🤖 AI 数字员工平台
          </Title>
          <Paragraph className="text-lg text-gray-500">
            汇聚企业智能助手，提升工作效率
          </Paragraph>
        </div>

        {/* Agent Grid by Category */}
        {categories.map((category) => {
          const categoryAgents = agents.filter((a) => a.category === category);
          if (categoryAgents.length === 0) return null;

          return (
            <div key={category} className="mb-10">
              <Title level={3} className="mb-4">
                {category}
              </Title>
              <Row gutter={[16, 16]}>
                {categoryAgents.map((agent) => (
                  <Col key={agent.id} xs={24} sm={12} md={8} lg={6}>
                    <AgentCard agent={agent} />
                  </Col>
                ))}
              </Row>
            </div>
          );
        })}
      </div>
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add home page with agent gallery

- Group agents by category
- Responsive grid layout
- Header with title and description

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Chat Components

**Files:**
- Create: `src/components/chat/ChatHeader.tsx`
- Create: `src/components/chat/MessageItem.tsx`
- Create: `src/components/chat/MessageList.tsx`
- Create: `src/components/chat/ChatInput.tsx`

**Step 1: Create ChatHeader component**

Create `src/components/chat/ChatHeader.tsx`:
```typescript
'use client';

import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Agent } from '@/types/agent';

const { Text } = Typography;

interface ChatHeaderProps {
  agent: Agent;
}

export default function ChatHeader({ agent }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border-b sticky top-0 z-10">
      <Link href="/">
        <Button type="text" icon={<ArrowLeftOutlined />} />
      </Link>
      <span className="text-3xl">{agent.avatar}</span>
      <div>
        <Text strong className="text-lg block">
          {agent.name}
        </Text>
        <Text type="secondary" className="text-sm">
          {agent.tags.join(' · ')}
        </Text>
      </div>
    </div>
  );
}
```

**Step 2: Create MessageItem component**

Create `src/components/chat/MessageItem.tsx`:
```typescript
'use client';

import { Typography } from 'antd';
import { Message } from '@/types/conversation';

const { Paragraph } = Typography;

interface MessageItemProps {
  message: Message;
  agentAvatar: string;
}

export default function MessageItem({ message, agentAvatar }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <span className="text-2xl flex-shrink-0">
        {isUser ? '👤' : agentAvatar}
      </span>
      <div
        className={`max-w-[70%] p-4 rounded-2xl ${
          isUser
            ? 'bg-blue-500 text-white rounded-tr-none'
            : 'bg-white rounded-tl-none shadow-sm'
        }`}
      >
        <Paragraph
          className={`mb-0 whitespace-pre-wrap ${
            isUser ? 'text-white' : ''
          }`}
        >
          {message.content}
        </Paragraph>
      </div>
    </div>
  );
}
```

**Step 3: Create MessageList component**

Create `src/components/chat/MessageList.tsx`:
```typescript
'use client';

import { useRef, useEffect } from 'react';
import { Empty, Spin } from 'antd';
import MessageItem from './MessageItem';
import { Message } from '@/types/conversation';

interface MessageListProps {
  messages: Message[];
  agentAvatar: string;
  isLoading?: boolean;
}

export default function MessageList({
  messages,
  agentAvatar,
  isLoading,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty
          description="开始对话吧"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} agentAvatar={agentAvatar} />
      ))}
      {isLoading && (
        <div className="flex gap-3">
          <span className="text-2xl">{agentAvatar}</span>
          <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm">
            <Spin size="small" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
```

**Step 4: Create ChatInput component**

Create `src/components/chat/ChatInput.tsx`:
```typescript
'use client';

import { useState, KeyboardEvent } from 'react';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  disabled,
  placeholder = '输入您的问题...',
}: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-white border-t">
      <div className="flex gap-2 max-w-4xl mx-auto">
        <TextArea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoSize={{ minRows: 1, maxRows: 4 }}
          className="flex-1"
          disabled={disabled}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={!value.trim() || disabled}
        />
      </div>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add src/components/chat/
git commit -m "feat: add chat UI components

- ChatHeader with back button and agent info
- MessageItem with user/assistant styling
- MessageList with auto-scroll
- ChatInput with keyboard shortcuts

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Chat Page

**Files:**
- Create: `src/app/chat/[agentId]/page.tsx`
- Create: `src/app/chat/[agentId]/layout.tsx`

**Step 1: Create chat layout**

Create `src/app/chat/[agentId]/layout.tsx`:
```typescript
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {children}
    </div>
  );
}
```

**Step 2: Create chat page**

Create `src/app/chat/[agentId]/page.tsx`:
```typescript
'use client';

import { useState, useEffect, use } from 'react';
import { message } from 'antd';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { getAgentById } from '@/config/agents';
import { Message } from '@/types/conversation';
import { createConversation, getConversation, chat } from '@/app/actions/conversation-actions';

interface ChatPageProps {
  params: Promise<{
    agentId: string;
  }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { agentId } = use(params);
  const agent = getAgentById(agentId);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!agent) return;

    const initConversation = async () => {
      const id = await createConversation(agentId);
      setConversationId(id);
    };

    initConversation();
  }, [agentId, agent]);

  const handleSend = async (content: string) => {
    if (!conversationId || !agent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await chat(conversationId, agentId, agent.appId, content);

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.content || '',
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        message.error(result.error || '发送失败');
      }
    } catch (error) {
      message.error('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>未找到该数字员工</p>
      </div>
    );
  }

  return (
    <>
      <ChatHeader agent={agent} />
      <MessageList
        messages={messages}
        agentAvatar={agent.avatar}
        isLoading={isLoading}
      />
      <ChatInput onSend={handleSend} disabled={isLoading || !conversationId} />
    </>
  );
}
```

**Step 3: Create unified actions export**

Create `src/app/actions/conversation-actions.ts`:
```typescript
export {
  createConversation,
  getConversation,
  getConversationsByAgent,
  addMessage,
  deleteConversation,
} from './conversation';

export { chat } from './chat';
```

**Step 4: Update chat page import**

Update the import in `src/app/chat/[agentId]/page.tsx` to use:
```typescript
import { createConversation, chat } from '@/app/actions/conversation-actions';
```

**Step 5: Commit**

```bash
git add src/app/chat/ src/app/actions/conversation-actions.ts
git commit -m "feat: add chat page with full functionality

- New conversation creation on page load
- Message sending with loading state
- Error handling with toast notifications
- Responsive layout

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: Conversation History Page

**Files:**
- Create: `src/app/chat/[agentId]/[conversationId]/page.tsx`

**Step 1: Create conversation continuation page**

Create `src/app/chat/[agentId]/[conversationId]/page.tsx`:
```typescript
'use client';

import { useState, useEffect, use } from 'react';
import { message, Spin } from 'antd';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { getAgentById } from '@/config/agents';
import { Message } from '@/types/conversation';
import { getConversation, chat } from '@/app/actions/conversation-actions';

interface ConversationPageProps {
  params: Promise<{
    agentId: string;
    conversationId: string;
  }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { agentId, conversationId } = use(params);
  const agent = getAgentById(agentId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const loadConversation = async () => {
      setIsLoading(true);
      const conversation = await getConversation(conversationId);
      if (conversation) {
        setMessages(conversation.messages);
      } else {
        message.error('会话不存在');
      }
      setIsLoading(false);
    };

    loadConversation();
  }, [conversationId]);

  const handleSend = async (content: string) => {
    if (!agent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const result = await chat(conversationId, agentId, agent.appId, content);

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.content || '',
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        message.error(result.error || '发送失败');
      }
    } catch (error) {
      message.error('网络错误，请重试');
    } finally {
      setIsSending(false);
    }
  };

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>未找到该数字员工</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <ChatHeader agent={agent} />
      <MessageList
        messages={messages}
        agentAvatar={agent.avatar}
        isLoading={isSending}
      />
      <ChatInput onSend={handleSend} disabled={isSending} />
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/chat/[agentId]/[conversationId]/page.tsx
git commit -m "feat: add conversation continuation page

- Load existing conversation history
- Continue chat from previous context
- Loading state while fetching history

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 12: Final Testing and Documentation

**Files:**
- Modify: `CLAUDE.md`
- Create: `README.md`

**Step 1: Update CLAUDE.md**

Replace `CLAUDE.md`:
```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI 数字员工平台 - Enterprise AI Digital Employee Portal. A web application where users can browse AI agents and chat with them via 阿里云百炼 API.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **UI:** Ant Design 5 + Tailwind CSS
- **Database:** MongoDB with Mongoose
- **AI Backend:** 阿里云百炼 DashScope API

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Environment Variables

Required in `.env.local`:
- `DASHSCOPE_API_KEY` - API key for 百炼
- `MONGODB_URI` - MongoDB connection string
- `NEXT_PUBLIC_*_APP_ID` - Agent APP_IDs from 百炼

## Architecture

```
src/
├── app/                 # Next.js App Router pages
│   ├── actions/         # Server Actions
│   └── chat/            # Chat routes
├── components/          # React components
│   └── chat/            # Chat-specific components
├── config/              # Configuration (agents)
├── lib/                 # Utilities
│   ├── models/          # Mongoose models
│   ├── mongodb.ts       # DB connection
│   └── bailian.ts       # API client
└── types/               # TypeScript types
```

## Key Patterns

- Server Actions for all API calls (keeps API keys secure)
- Mongoose with global caching for serverless compatibility
- Agent config in `src/config/agents.ts` for easy management
```

**Step 2: Create README.md**

Create `README.md`:
```markdown
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
```

**Step 3: Run build to verify**

```bash
npm run build
```

Expected: Build succeeds without errors

**Step 4: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: update project documentation

- Update CLAUDE.md with architecture and commands
- Add README.md with setup and deployment guide

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 13: Final Commit and Push

**Step 1: Verify all files are committed**

```bash
git status
```

Expected: No uncommitted changes

**Step 2: Final commit if needed**

```bash
git add .
git commit -m "feat: complete AI digital employee portal

- Agent gallery with category grouping
- Chat interface with streaming responses
- Conversation history with MongoDB persistence
- Ant Design UI with Chinese locale

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
