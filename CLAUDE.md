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

## Architecture

```
src/
├── app/                 # Next.js App Router pages
│   ├── actions/         # Server Actions
│   ├── api/             # API routes
│   │   └── chat/stream/ # SSE streaming endpoint
│   └── chat/            # Chat routes
├── components/          # React components
│   └── chat/            # Chat-specific components
├── hooks/               # Custom React hooks
│   └── useChatStream.ts # Streaming chat hook
├── lib/                 # Utilities
│   ├── models/          # Mongoose models
│   ├── mongodb.ts       # DB connection
│   └── bailian.ts       # API client (with streaming)
└── types/               # TypeScript types
```

## Key Patterns

- **Streaming:** `/api/chat/stream` route returns SSE for real-time responses
- **Async Params:** All dynamic route pages use `use(params)` pattern for Next.js 16
- **Markdown:** Chat messages support GFM with syntax highlighting
- **Server Actions:** Used for non-streaming API calls (keeps API keys secure)
- **Mongoose:** Global caching for serverless compatibility

## Key Dependencies

- `react-markdown` + `remark-gfm` - Markdown rendering
- `react-syntax-highlighter` - Code syntax highlighting
- `@tailwindcss/typography` - Prose styling for markdown
