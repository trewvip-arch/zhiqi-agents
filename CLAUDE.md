# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI 数字员工平台 - Enterprise AI Digital Employee Portal. A web application where users can browse AI agents and chat with them via 阿里云百炼 API.

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **UI:** Ant Design 5 + Tailwind CSS
- **Database:** MongoDB with Mongoose
- **AI Backend:** 阿里云百炼 DashScope API
- **Node.js:** 20.9+ required

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
- `NEXT_PUBLIC_HIRELY_APP_ID`, `NEXT_PUBLIC_ATLAS_APP_ID`, etc. - Agent APP_IDs from 百炼 console

## Architecture

```
src/
├── app/                 # Next.js App Router pages
│   ├── actions/         # Server Actions (agent, chat, conversation)
│   ├── admin/           # Admin panel for managing agents
│   │   └── agents/      # Agent CRUD pages
│   ├── api/             # API routes
│   │   ├── chat/stream/ # SSE streaming endpoint
│   │   ├── upload/      # File upload endpoint
│   │   └── uploads/[file]/ # File serving
│   └── chat/            # Chat pages
│       └── [agentId]/    # Dynamic agent chat routes
├── components/          # React components
│   ├── AgentCard.tsx    # Agent display card
│   └── chat/            # Chat UI components
├── lib/                 # Core utilities
│   ├── bailian.ts       # 百炼 API client (streaming support)
│   ├── mongodb.ts       # DB connection with caching
│   └── models/          # Mongoose schemas (Agent, Conversation)
└── types/               # TypeScript interfaces
```

## Key Patterns

- **Streaming:** `/api/chat/stream` route returns SSE for real-time AI responses
- **Async Params:** All dynamic route pages use `use(params)` pattern for Next.js 16
- **Markdown:** Chat messages support GFM with syntax highlighting via react-markdown
- **Server Actions:** Used for agent CRUD and non-streaming operations
- **Mongoose:** Global caching in `lib/mongodb.ts` for serverless compatibility
- **File Upload:** Agents can accept file attachments via `/api/upload`

## Key Dependencies

- `ai` + `@ai-sdk/react` - AI SDK for streaming
- `react-markdown` + `remark-gfm` - Markdown rendering
- `react-syntax-highlighter` - Code syntax highlighting
- `@tailwindcss/typography` - Prose styling for markdown
- `antd` - UI components

## Docker Development

```bash
# Start MongoDB and app with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Full production stack
docker-compose up -d
```

## Adding New Agents

Agents are managed via the admin panel at `/admin/agents` or by creating them in MongoDB directly. The Agent model includes:
- `appId`: 百炼 console APP_ID
- `name`, `description`, `avatar`, `tags`, `category`
