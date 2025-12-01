<div align="center">

# Chimera 🔥

### AI-Powered Full Stack Development Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <strong>Production-ready monorepo for AI-powered applications with Claude, LangGraph, and modern web technologies</strong>
</p>

[Getting Started](#-getting-started) •
[Features](#-features) •
[Architecture](#-architecture) •
[Documentation](#-documentation)

</div>

---

## ✨ Features

<table>
<tr>
<td>

### 🎨 Frontend
- **Next.js 15** with App Router
- **React 19** with Server Components
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library
- Full **TypeScript** support
- Responsive & accessible design

</td>
<td>

### ⚡ Backend
- **FastAPI** for high-performance APIs
- **LangGraph** agent orchestration
- Multi-model AI support
- Async-first architecture
- Structured logging
- Rate limiting & auth middleware

</td>
</tr>
<tr>
<td>

### 🗄️ Database
- **Supabase** (PostgreSQL)
- **pgvector** for embeddings
- Row Level Security (RLS)
- Real-time subscriptions
- Built-in authentication
- Migration system

</td>
<td>

### 🤖 AI Integration
- **Claude 4.5** (Opus/Sonnet/Haiku)
- **Gemini 2.0** Flash
- **OpenRouter** multi-model
- MCP tool integrations
- SKILL.md orchestration
- Verification-first approach

</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| pnpm | 9+ | `npm install -g pnpm` |
| Python | 3.12+ | [python.org](https://python.org/) |
| uv | Latest | `pip install uv` |
| Claude Code | Latest | [claude.ai/code](https://claude.ai/code) |
| Supabase CLI | Latest | `npm install -g supabase` (optional) |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/CleanExpo/Chimera.git
cd Chimera

# 2. Install Node.js dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Install Python backend dependencies
cd apps/backend
uv sync
cd ../..

# 5. Start development
pnpm dev
```

### Starting with Claude Code

```bash
# Navigate to the project directory
cd Chimera

# Start Claude Code - agents are automatically loaded
claude
```

The orchestration system is automatically configured via `.claude/` directory.

---

## 🔐 Environment Setup

Create `.env.local` from the template and add your API keys:

```env
# Supabase (required for auth & database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Models (at least one required)
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_AI_API_KEY=xxx
OPENROUTER_API_KEY=sk-or-xxx

# MCP Tools
EXA_API_KEY=xxx
REF_TOOLS_API_KEY=xxx

# Backend
BACKEND_URL=http://localhost:8100
BACKEND_API_KEY=your-internal-api-key
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Next.js 15 │  │   React 19  │  │   Tailwind + shadcn/ui  │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         └────────────────┼──────────────────────┘               │
└──────────────────────────┼───────────────────────────────────────┘
                           │ API Calls
┌──────────────────────────┼───────────────────────────────────────┐
│                       BACKEND                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   FastAPI   │──│  LangGraph  │──│   Agent Orchestrator    │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                       │               │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌────────────▼────────────┐  │
│  │  AI Models  │  │  MCP Tools  │  │      SKILL.md Files     │  │
│  │ Claude/Gemini│ │ Exa/Playwright│ │   (Agent Behaviors)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                       DATABASE                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      Supabase                                ││
│  │  PostgreSQL  │  pgvector  │  Auth  │  Real-time  │  Storage ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
📦 Chimera
├── 📂 .claude/               # Claude Code orchestration
│   ├── CLAUDE.md            # Main orchestrator instructions
│   └── agents/              # Subagent definitions
│       ├── coder.md         # Implementation agent
│       ├── tester.md        # Testing agent
│       └── stuck.md         # Human escalation agent
├── 📂 apps/
│   ├── 📂 web/              # Next.js 15 frontend
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities & clients
│   │   └── hooks/           # Custom React hooks
│   └── 📂 backend/          # Python backend
│       └── src/
│           ├── agents/      # AI agent implementations
│           ├── api/         # FastAPI routes
│           ├── graphs/      # LangGraph workflows
│           └── models/      # AI model clients
├── 📂 packages/
│   ├── shared/              # Shared TypeScript types
│   └── config/              # Shared configurations
├── 📂 skills/               # SKILL.md orchestration files
├── 📂 supabase/             # Database migrations
└── 📂 scripts/              # Setup & utility scripts
```

---

## 🛠️ Development

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all development servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm format` | Format code with Prettier |

### Frontend Only

```bash
pnpm dev --filter=web
```

### Backend Only

```bash
cd apps/backend
uv run uvicorn src.api.main:app --reload
```

---

## 🤖 Agent Orchestration

Chimera uses a specialized agent system for AI-powered development:

### Available Agents

| Agent | Purpose |
|-------|---------|
| **Coder** | Implements features, writes code |
| **Tester** | Verifies with Playwright, runs tests |
| **Stuck** | Human escalation for any problems |

### The Workflow

```
USER: "Build X"
    ↓
CLAUDE: Creates detailed todos
    ↓
CLAUDE: Invokes coder subagent
    ↓
CODER: Implements feature
    ├─→ Problem? → STUCK → You decide
    ↓
CLAUDE: Invokes tester subagent
    ↓
TESTER: Playwright verification
    ├─→ Test fails? → STUCK → You decide
    ↓
CLAUDE: Marks todo complete
    ↓
Repeat until done ✅
```

### MCP Servers

| Server | Purpose | Configuration |
|--------|---------|---------------|
| **Playwright** | Browser automation & testing | Auto-configured |
| **EXA** | Web search & research | Requires `EXA_API_KEY` |
| **REF** | Documentation lookup | Requires `REF_TOOLS_API_KEY` |

---

## 📚 Documentation

| Resource | Description |
|----------|-------------|
| [SETUP.md](./SETUP.md) | Detailed setup instructions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture details |
| [TAILWIND_SHADCN_SETUP.md](./TAILWIND_SHADCN_SETUP.md) | UI framework guide |
| [CLAUDE.md](./CLAUDE.md) | Technical reference |

### External Docs

- [Next.js 15](https://nextjs.org/docs)
- [FastAPI](https://fastapi.tiangolo.com/)
- [LangGraph](https://langchain-ai.github.io/langgraph/)
- [Supabase](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

---

## 🚢 Deployment

### Frontend (Vercel)

1. Import from GitHub
2. Set root directory: `apps/web`
3. Add environment variables
4. Deploy

### Backend (DigitalOcean/Docker)

```bash
cd apps/backend
docker build -t chimera-backend .
docker run -p 8000:8000 chimera-backend
```

### Database (Supabase)

```bash
supabase db push
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 Credits

Built on the foundation of [Claude Code Agent Orchestration System](https://github.com/IncomeStreamSurfer/claude-code-agents-wizard-v2) by [Income Stream Surfer](https://www.youtube.com/incomestreamsurfers).

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Ready to build something amazing?** 🚀

```bash
git clone https://github.com/CleanExpo/Chimera.git && cd Chimera && pnpm install && claude
```

</div>
