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
