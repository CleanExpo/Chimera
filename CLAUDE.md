# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🐍 SNAKE BUILD PATTERN (MANDATORY)

**This pattern MUST be used for every single operation. No exceptions.**

```
        🔵 ← ORCHESTRATOR (HEAD) - Only visible part
       ╱
══════╱═══════════════════════════════════════════════
     ╱     SURFACE
════╱═════════════════════════════════════════════════
   ╱
  🟢──🟢──🟢──🟢──🟢  ← Agents & Skills (HIDDEN BODY)
```

### How It Works

1. **HEAD (Orchestrator)** - The only agent that surfaces to interact with the user
   - Receives briefs and tasks
   - Reports final results
   - Requests human decisions when needed

2. **BODY (Hidden)** - All other work happens beneath the surface
   - Subagents execute silently
   - Skills process without surfacing
   - Tools run in background
   - Only results bubble up to the head

### Why This Pattern

| Problem | Snake Pattern Solution |
|---------|----------------------|
| Token overload | Agents work silently, only results surface |
| Context bloat | Subagent outputs stay hidden |
| Frequent compacting | Minimal orchestrator footprint |
| User overwhelm | Clean, focused responses |

### Implementation Rules

```
✅ DO:
- Invoke subagents via Task tool (they work hidden)
- Return only final results to user
- Keep orchestrator responses concise
- Let skills execute beneath the surface

❌ DON'T:
- Stream every agent's thought process to user
- Surface intermediate tool outputs
- Expose full subagent transcripts
- Duplicate information across agents
```

### In Practice

```python
# The orchestrator (HEAD) receives: "Build a login page"

# HIDDEN (body does the work):
#   → coder agent implements
#   → tester agent verifies
#   → skills process silently

# SURFACE (head reports):
"✅ Login page complete. Build passed. Tests passing."
```

**Remember: The snake only shows its head. The body does the real work underground.**

---

## Product Vision

**Chimera** is a **Digital Command Center** for autonomous AI operations in SaaS platforms. It uses AI models themselves as the orchestration layer—eliminating dependency on workflow tools like n8n or Make—through the **orchestrator-worker architecture**.

### The Digital Command Center

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DIGITAL COMMAND CENTER                                                      │
├──────────────┬──────────────────────────────────────────────────────────────┤
│  BRIEFING    │              ORCHESTRATOR ANCHOR DESK                         │
│  ROOM        │              Status: ACTIVE | Teams: 2 | Tasks: 3             │
│  (Input)     ├──────────────────────────────────────────────────────────────┤
│              │  ┌─────────────────────┐  ┌─────────────────────┐            │
│  [Task Area] │  │ TEAM GOOGLE         │  │ TEAM ANTHROPIC      │            │
│              │  │ ● GENERATING CODE   │  │ ● REFINING STYLES   │            │
│  [TRANSMIT]  │  │ Thought Stream...   │  │ Thought Stream...   │            │
│              │  │ [Live Preview]      │  │ [Live Preview]      │            │
├──────────────┴──────────────────────────────────────────────────────────────┤
│  DECISION DESK: [APPROVE GOOGLE] [APPROVE ANTHROPIC] [REJECT & RETRY]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Features
- **Multi-Agent Teams** - Claude AND Gemini working in parallel
- **Thought Streams** - Real-time agent reasoning visibility
- **Live Previews** - Sandpack-rendered code output
- **Decision Desk** - Human-in-the-loop approval
- **Tiered Autonomy** - Graduated trust levels for self-healing

---

## Multi-Agent Architecture

### Orchestrator-Worker Pattern

```
USER INPUT (Briefing Room)
    │
    ▼
┌─────────────────────────────────────────────┐
│       ORCHESTRATOR (Claude Opus/Sonnet)      │
│  - Receives brief, develops strategy         │
│  - Spawns specialized agent teams            │
│  - Synthesizes results for Decision Desk     │
└─────────────────────────────────────────────┘
    │                    │
    ▼                    ▼
┌─────────────┐  ┌─────────────────┐
│ TEAM GOOGLE │  │ TEAM ANTHROPIC  │
│ (Gemini)    │  │ (Claude)        │
│ Fast, cheap │  │ Quality-focused │
└─────────────┘  └─────────────────┘
    │                    │
    ▼                    ▼
┌─────────────────────────────────────────────┐
│              DECISION DESK                   │
│  Human reviews, approves, or requests retry  │
└─────────────────────────────────────────────┘
```

### Model Selection

| Task Type | Model | Cost |
|-----------|-------|------|
| Complex reasoning | Claude Opus 4.5 | $5/$25 per MTok |
| Daily operations | Claude Sonnet 4.5 | $3/$15 per MTok |
| High-volume tasks | Claude Haiku 4.5 | ~$0.80/$4 per MTok |
| Alternative generation | Gemini 2.0 Flash | Fast, efficient |

---

## Self-Healing Architecture

### Tiered Autonomy

| Tier | Risk Level | Examples | Response |
|------|------------|----------|----------|
| 1 | Auto-fix | Container restarts, cache clearing | Execute immediately |
| 2 | Notify-then-execute | Config changes, scaling | Alert, then execute |
| 3 | Approval required | Database changes, deployments | Queue for Decision Desk |

### Detection → Diagnosis → Decision → Action → Verify

```python
async def on_event(self, event):
    diagnosis = await self.orchestrator.analyze(event)

    if diagnosis.confidence > 0.95 and diagnosis.risk_tier == 1:
        await self.execute_fix(diagnosis.fix)  # Auto-fix
        await self.verify_resolution()
    else:
        await self.queue_for_decision_desk(diagnosis)  # Human review
```

---

## Tech Stack

### Frontend (`apps/web/`)
- **Framework**: Next.js 15 with App Router
- **React**: Version 19 with Server Components
- **Styling**: Tailwind CSS v4 (CSS-first configuration)
- **Components**: shadcn/ui (new-york style)
- **Live Previews**: Sandpack for code rendering
- **Real-time**: WebSockets for thought streams

### Backend (`apps/backend/`)
- **Framework**: FastAPI (Python 3.12+)
- **Agent Orchestration**: LangGraph
- **AI Models**: Claude, Gemini, OpenRouter
- **Package Manager**: uv
- **Containerization**: Docker

### Database
- **Provider**: Supabase (PostgreSQL)
- **Extensions**: pgvector for embeddings
- **Auth**: Supabase Auth with RLS policies
- **Real-time**: Supabase Realtime subscriptions

### Observability
- **Tracing**: Langfuse / LangSmith
- **Metrics**: OpenTelemetry
- **Logging**: Structured JSON logs

---

## Project Structure

```
📦 Chimera
├── 📂 .claude/               # Claude Code orchestration
│   ├── CLAUDE.md            # Main orchestrator instructions
│   └── agents/              # Subagent definitions
├── 📂 apps/
│   ├── 📂 web/              # Next.js 15 frontend
│   │   ├── app/             # App Router pages
│   │   │   ├── command-center/  # Main dashboard
│   │   │   ├── operations/      # Operations overview
│   │   │   ├── approvals/       # Approval queue
│   │   │   └── settings/        # Configuration
│   │   ├── components/
│   │   │   ├── command-center/  # Digital Command Center UI
│   │   │   │   ├── briefing-room.tsx
│   │   │   │   ├── orchestrator-desk.tsx
│   │   │   │   ├── team-channel.tsx
│   │   │   │   ├── thought-stream.tsx
│   │   │   │   ├── live-shot.tsx
│   │   │   │   └── decision-desk.tsx
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── lib/             # Utilities & clients
│   │   └── hooks/           # Custom React hooks
│   └── 📂 backend/          # Python backend
│       └── src/
│           ├── agents/      # AI agent implementations
│           ├── api/         # FastAPI routes
│           ├── graphs/      # LangGraph workflows
│           ├── models/      # AI model clients
│           └── orchestrator/ # Main orchestrator logic
├── 📂 packages/
│   ├── shared/              # Shared TypeScript types
│   └── config/              # Shared configurations
├── 📂 skills/               # SKILL.md orchestration files
├── 📂 supabase/             # Database migrations
└── 📂 scripts/              # Setup & utility scripts
```

---

## Dashboard Screens

### 1. Command Center (Primary)
- Briefing Room for task input
- Orchestrator Anchor Desk status
- Active Team Channels with thought streams
- Decision Desk for approvals

### 2. Operations Overview
- Agent status grid (honeycomb layout)
- In-progress work timeline
- Token/cost accumulation
- Health indicators

### 3. Approval Queue
- Pending decisions with confidence scores
- AI reasoning chains (transparency)
- Approve/modify/reject controls

### 4. Ideas Backlog
- AI-generated suggestions
- Pattern discoveries
- Improvement recommendations

### 5. Completions & Audit
- Recent completions
- Success metrics
- Cost analysis

### 6. Settings
- Agent configurations
- Model preferences
- Tier thresholds

---

## Build & Development Commands

```bash
# Install dependencies (requires pnpm 9+, Node 20+)
pnpm install

# Start all services
pnpm dev

# Frontend only (http://localhost:3030)
pnpm dev --filter=web

# Backend only (http://localhost:8888)
cd apps/backend && uv run uvicorn src.api.main:app --reload --port 8888

# Build all packages
pnpm build

# Build specific package
pnpm build --filter=web

# Type checking
pnpm type-check

# Linting
pnpm lint

# Run all tests
pnpm test

# Frontend tests only
pnpm test --filter=web

# Single frontend test file
cd apps/web && pnpm vitest run path/to/test.ts

# Backend tests
cd apps/backend && uv run pytest tests/ -v

# Backend type check
cd apps/backend && uv run mypy src/

# Backend lint
cd apps/backend && uv run ruff check src/
```

---

## Agent System

This project uses specialized Claude Code subagents defined in `.claude/agents/`:

| Agent | When to Use |
|-------|-------------|
| **coder** | Implementing features, writing code |
| **tester** | Running tests, verifying implementations |
| **stuck** | Human escalation, clarification needed |

### Verification-First Workflow
1. Invoke **coder** to implement
2. Invoke **tester** to verify (build + tests + manual check)
3. If blocked → invoke **stuck** for human guidance
4. Mark complete ONLY after verification passes

Before marking any task complete:
- Build passes (`pnpm build`)
- Type check passes
- Relevant tests pass
- Functionality manually verified

Report actual state, not optimistic interpretation. If something failed, say it failed with the exact error message.

---

## Code Conventions

### TypeScript/React
- Use functional components with hooks
- Prefer Server Components where possible
- Use `"use client"` directive only when necessary
- Follow shadcn/ui patterns for components
- Use Zod for form validation

### Python
- Use type hints everywhere
- Follow PEP 8 style guidelines
- Use async/await for I/O operations
- Use Pydantic for data validation

### File Naming
- React components: `PascalCase.tsx`
- Utilities/hooks: `kebab-case.ts`
- Python modules: `snake_case.py`
- SKILL files: `SCREAMING-KEBAB.md`

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Models
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
OPENROUTER_API_KEY=

# MCP Tools
EXA_API_KEY=
REF_TOOLS_API_KEY=

# Backend
BACKEND_URL=http://localhost:8888
BACKEND_API_KEY=
```

---

## Implementation Phases

### Phase 1: Foundation ✅
- [x] Monorepo setup
- [x] Next.js 15 frontend
- [x] FastAPI backend
- [x] Basic agent structure

### Phase 2: Command Center UI (Current)
- [ ] Briefing Room component
- [ ] Orchestrator Anchor Desk
- [ ] Team Channel components
- [ ] Thought Stream display
- [ ] Decision Desk

### Phase 3: Multi-Agent Backend
- [ ] Orchestrator agent (LangGraph)
- [ ] Team Google (Gemini) integration
- [ ] Team Anthropic (Claude) integration
- [ ] Agent handoffs

### Phase 4: Live Features
- [ ] WebSocket connections
- [ ] Real-time thought streams
- [ ] Sandpack previews

### Phase 5: Self-Healing
- [ ] Monitoring agent
- [ ] Tiered autonomy
- [ ] Auto-fix patterns

---

## Resources

- [VISION.md](./VISION.md) - Full product vision
- [Next.js Docs](https://nextjs.org/docs)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [Anthropic Multi-Agent](https://docs.anthropic.com/en/docs/build-with-claude/agentic-systems)
- [Model Context Protocol](https://modelcontextprotocol.io/)
