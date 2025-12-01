# 🏗️ Architecture Guide - Full Stack Monorepo

## Overview

This is a **production-ready monorepo** for building AI-powered applications with:
- **Frontend**: Next.js 15 + Tailwind CSS v4 + shadcn/ui
- **Backend**: Python + LangGraph + Docker
- **Database**: Supabase (PostgreSQL + pgvector + Auth)
- **AI Models**: Claude (Opus/Sonnet/Haiku 4.5), Gemini 3 Pro, OpenRouter
- **MCPs**: Playwright, Exa, Ref.tools
- **Orchestrator**: Dual system (SKILL.md + Python/LangGraph)

## Current Status

### ✅ Completed
- [x] Monorepo structure created
- [x] Turborepo configured
- [x] pnpm workspace configured
- [x] Root package.json updated
- [x] ORCHESTRATOR skill created
- [x] Backend pyproject.toml created
- [x] MCP servers configured (EXA, REF, Playwright)
- [x] Environment security setup
- [x] Tailwind CSS v4 + shadcn/ui foundation

### 🚧 To Implement

#### Apps Layer
- [ ] **apps/web/** - Next.js 15 application
  - [ ] App directory structure (auth, dashboard, API routes)
  - [ ] shadcn/ui components
  - [ ] Supabase client integration
  - [ ] Chat interface
  - [ ] Auth flows

- [ ] **apps/backend/** - Python/LangGraph backend
  - [ ] src/agents/ - Agent implementations
  - [ ] src/graphs/ - LangGraph workflows
  - [ ] src/skills/ - SKILL.md loader/parser
  - [ ] src/models/ - AI model clients
  - [ ] src/api/ - FastAPI routes
  - [ ] src/tools/ - MCP integrations
  - [ ] tests/ - Test suite
  - [ ] Dockerfile

#### Packages Layer
- [ ] **packages/shared/** - Shared TypeScript types
- [ ] **packages/config/** - Shared configs (ESLint, TypeScript)

#### Skills Layer
- [ ] **skills/core/**
  - [ ] VERIFICATION.md
  - [ ] ERROR-HANDLING.md
  - [ ] CODING-STANDARDS.md

- [ ] **skills/frontend/**
  - [ ] NEXTJS.md
  - [ ] TAILWIND.md
  - [ ] COMPONENTS.md

- [ ] **skills/backend/**
  - [ ] LANGGRAPH.md
  - [ ] FASTAPI.md
  - [ ] AGENTS.md

- [ ] **skills/database/**
  - [ ] SUPABASE.md
  - [ ] MIGRATIONS.md

- [ ] **skills/devops/**
  - [ ] DOCKER.md
  - [ ] DEPLOYMENT.md

#### Infrastructure
- [ ] **supabase/migrations/** - Database migrations
- [ ] **scripts/** - Setup and deployment scripts
- [ ] **.github/workflows/** - CI/CD pipelines

## Directory Structure

```
claude-code-agents-wizard-v2/
├── apps/
│   ├── web/                          # Next.js Frontend
│   │   ├── app/
│   │   │   ├── (auth)/              # Auth routes
│   │   │   ├── (dashboard)/         # Dashboard routes
│   │   │   ├── api/                 # API routes
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   └── layout/
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   ├── api/
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── components.json
│   │   └── package.json
│   │
│   └── backend/                      # Python Backend
│       ├── src/
│       │   ├── agents/              # LangGraph agents
│       │   ├── graphs/              # Workflow definitions
│       │   ├── skills/              # SKILL.md processing
│       │   ├── models/              # AI model clients
│       │   ├── state/               # State management
│       │   ├── tools/               # MCP integrations
│       │   ├── api/                 # FastAPI app
│       │   ├── config/
│       │   └── utils/
│       ├── tests/
│       ├── Dockerfile
│       ├── docker-compose.yml
│       └── pyproject.toml
│
├── packages/
│   ├── shared/                       # Shared TypeScript
│   └── config/                       # Shared configs
│
├── skills/                           # SKILL.md files
│   ├── ORCHESTRATOR.md              # ✅ Created
│   ├── core/
│   ├── frontend/
│   ├── backend/
│   ├── database/
│   └── devops/
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
│
├── scripts/
│   ├── setup.sh
│   ├── init-env.sh
│   ├── dev.sh
│   └── deploy.sh
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-frontend.yml
│       └── deploy-backend.yml
│
├── turbo.json                        # ✅ Created
├── pnpm-workspace.yaml               # ✅ Created
├── package.json                      # ✅ Updated
├── .env.example                      # ✅ Exists
├── .env.local                        # ✅ Exists
└── .mcp.json                         # ✅ Configured
```

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **Tailwind CSS v4** - Utility-first CSS with @theme syntax
- **shadcn/ui** - Accessible component library
- **Supabase Client** - Auth & database client
- **TypeScript** - Type safety

### Backend
- **Python 3.12** - Runtime
- **LangGraph** - Agent orchestration framework
- **FastAPI** - Web framework
- **Anthropic SDK** - Claude API
- **Google AI** - Gemini API
- **OpenAI SDK** - OpenRouter/GPT
- **Supabase** - Database client
- **Pydantic** - Validation

### Database
- **Supabase** - Hosted PostgreSQL
- **pgvector** - Vector similarity search
- **RLS** - Row Level Security
- **Realtime** - Websocket subscriptions

### AI Models
| Provider | Model | API String | Use Case |
|----------|-------|------------|----------|
| Anthropic | Claude Opus 4.5 | `claude-opus-4-5-20251101` | Complex reasoning |
| Anthropic | Claude Sonnet 4.5 | `claude-sonnet-4-5-20250929` | Balanced tasks |
| Anthropic | Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | Fast responses |
| Google | Gemini 3 Pro | `gemini-3-pro-preview` | Multimodal tasks |

### MCP Servers
- **Playwright** - Browser automation
- **EXA** - Web search
- **Ref.tools** - Reference documentation

## Environment Variables

```bash
# Project
PROJECT_NAME=my-project
NODE_ENV=development

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# AI Models
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_AI_API_KEY=xxx
OPENROUTER_API_KEY=sk-or-xxx

# MCP Tools
EXA_API_KEY=xxx        # ✅ Configured
REF_API_KEY=xxx        # ✅ Configured

# Backend
BACKEND_URL=http://localhost:8000
BACKEND_API_KEY=your-internal-api-key
```

## Development Workflow

### 1. Initial Setup
```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install dependencies
pnpm install

# Install uv for Python (backend)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Setup backend dependencies
cd apps/backend
uv sync
cd ../..
```

### 2. Start Development
```bash
# Start all services
pnpm dev

# Frontend only
pnpm --filter web dev

# Backend only
cd apps/backend
uv run uvicorn src.api.main:app --reload
```

### 3. Build & Test
```bash
# Build all
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint

# Test
pnpm test
```

## Deployment

### Frontend (Vercel)
- Auto-deploys from `main` branch
- Environment variables via Vercel dashboard
- Preview deployments on PRs

### Backend (DigitalOcean App Platform)
- Dockerfile-based deployment
- Scale workers as needed
- Environment variables via DO dashboard

### Database (Supabase)
- Hosted PostgreSQL
- Connection pooling
- Automatic backups

## Skills System

### How It Works

1. **SKILL.md Files** - Define agent behaviors
   ```yaml
   ---
   name: example-skill
   version: 1.0.0
   description: What this skill does
   triggers:
     - keyword1
     - keyword2
   ---
   ```

2. **Python Loader** - Parses YAML frontmatter
3. **Orchestrator** - Routes tasks to skills
4. **LangGraph** - Executes skill workflows
5. **Verification** - Confirms successful completion

### Verification-First Approach

Every task must be verified:
- ✅ Build passes
- ✅ Tests pass
- ✅ Functionality works
- ✅ No regressions

## Next Steps

1. **Immediate** - Complete Next.js app structure
2. **Short Term** - Implement backend agents
3. **Medium Term** - Add all skills
4. **Long Term** - Deploy to production

## Resources

- [Turborepo Docs](https://turbo.build/repo/docs)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [LangGraph Docs](https://python.langchain.com/docs/langgraph)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
