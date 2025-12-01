# CLAUDE.md - Chimera Project Intelligence

> This file provides context for Claude Code when working with this codebase.

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

## Common Commands

### Development
```bash
pnpm dev                    # Start all services
pnpm dev --filter=web       # Frontend only
cd apps/backend && uv run uvicorn src.api.main:app --reload  # Backend only
```

### Testing
```bash
pnpm turbo run test         # All tests
pnpm test --filter=web      # Frontend tests
cd apps/backend && uv run pytest  # Backend tests
```

### Building
```bash
pnpm build                  # Build everything
pnpm turbo run type-check   # Type checking
pnpm turbo run lint         # Linting
```

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
BACKEND_URL=http://localhost:8000
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
