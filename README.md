# RelayOS

A multi-tenant AI assistant platform for B2B companies. Deploy specialized AI assistants — Support, Developer Docs, Onboarding — each with its own persona, knowledge base, and behavior mode. One platform, multiple contexts.

---

## What It Does

B2B companies don't have one AI need — they have many. Support teams need a reactive Q&A bot. Developer docs need a reference assistant. Onboarding needs a guided, proactive copilot. Today, each of these requires a separate tool. RelayOS is a single platform that powers all of them:

- **Multi-assistant**: Deploy specialized assistants across your organization from one admin
- **Grounded**: RAG-powered responses with citations, confidence scoring, and answer grading
- **Secure**: PII scrubbing, prompt injection defense, output validation, and per-assistant isolation
- **Observable**: Structured event logging (23+ event types), correlation IDs, and quality metrics
- **Extensible**: n8n workflow integration for handoffs, escalations, and custom automations

---

## Architecture

```
relayos/
├── apps/
│   ├── api/          # NestJS backend API
│   │   └── modules/
│   │       ├── conversation/     # Chat, feedback, handoff
│   │       ├── knowledge/        # RAG: search, chunking, re-ranking
│   │       ├── assistants/       # Assistant CRUD + config
│   │       ├── organizations/    # Org management
│   │       ├── llm/              # Multi-provider (OpenAI, Gemini, Anthropic)
│   │       ├── guardrails/       # Input/output safety (PII, injection)
│   │       ├── events/           # Append-only audit log
│   │       └── n8n/              # Workflow triggers
│   ├── admin/        # Next.js admin dashboard
│   └── widget/       # Embeddable React chat widget (Vite)
├── packages/
│   ├── db/           # Drizzle schema + SQL migrations
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared UI components
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Backend API | NestJS (Node.js) |
| Database | PostgreSQL + pgvector (Supabase) |
| Search | Hybrid: vector similarity + keyword (RRF) |
| LLM | OpenAI, Gemini, Anthropic (multi-provider) |
| Chunking | Token-based (tiktoken), 350 target, 15% overlap |
| Widget | React + Vite |
| Admin | Next.js |
| Workflows | n8n (self-hosted) |
| Deployment | Docker, Docker Compose |

---

## Key Features

### RAG Pipeline
- **Hybrid search**: Combines semantic (vector) and keyword search using Reciprocal Rank Fusion
- **Query processing**: LLM-based rewriting + query classification (factual, procedural, troubleshooting)
- **LLM re-ranking**: Fetches 2x chunks, re-ranks by relevance, returns top N
- **Answer grading**: Self-evaluation (SUPPORTED / PARTIAL / UNSUPPORTED) with confidence scores
- **Citations**: Every answer links back to source documents

### Assistant Types
| Type | Behavior | Use Case |
|------|----------|----------|
| **Reactive** (Support) | Waits for questions, provides cited answers | Product FAQ, customer support |
| **Reference** (Docs) | Technical, code-focused, example-heavy | API docs, developer guides |
| **Guided** (Onboarding) | Proactive, step-by-step, tracks progress | User onboarding, getting started |

Each assistant has its own persona (tone, boundaries, voice), knowledge base, welcome message, starter questions, and widget styling.

### Security & Guardrails
- PII scrubbing (regex-based detection + sanitization)
- Prompt injection defense (heuristic patterns + LLM gatekeeper)
- Output validation (persona boundary enforcement)

### Observability
- 23+ structured event types covering conversations, RAG operations, guardrails, and workflows
- Correlation IDs for end-to-end request tracing
- Append-only event log for replay and debugging

---

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase project (PostgreSQL + pgvector)
- LLM API key (OpenAI, Gemini, or Anthropic)

### Installation

```bash
git clone <repo-url>
cd relayos
npm install

cp .env.example .env.local
# Edit .env.local with your Supabase and LLM credentials
```

### Development

```bash
# Start all services
npm run dev

# Or start individually
npm run dev --filter=api       # API on :3001
npm run dev --filter=admin     # Admin on :3000
cd apps/widget && npm run dev  # Widget dev server
```

### Database Setup

Run migrations in Supabase SQL Editor in order:
```
packages/db/migrations/0001_initial_schema.sql
packages/db/migrations/0002_match_documents_function.sql
packages/db/migrations/0003_hybrid_search.sql
packages/db/migrations/0004_hybrid_search_recency.sql
packages/db/migrations/0005_message_feedback.sql
packages/db/migrations/0006_message_grading.sql
packages/db/migrations/0007_tenant_persona.sql
```

Then apply the assistant migration:
```
migration_assistant_rename.sql
migration_update_rls.sql
migration_update_rpcs.sql
migration_drop_tenant_columns.sql
```

### Widget Embedding

```html
<script
  src="https://your-cdn.com/relayos-widget.iife.js"
  data-api-url="https://api.relayos.com"
  data-assistant-id="your-assistant-uuid"
  data-primary-color="#2563eb"
  data-title="Chat with us"
></script>
```

### RAG Quality Testing

```bash
# Run canonical question pack (requires API on :3001)
ASSISTANT_ID=<your-id> npm run test:canonical

# With verbose output
VERBOSE=true ASSISTANT_ID=<your-id> npm run test:canonical
```

| Test Pack | What It Tests |
|-----------|---------------|
| `factual_retrieval` | Single-chunk retrieval accuracy |
| `multi_chunk_synthesis` | Cross-section information synthesis |
| `rag_boundary_testing` | Out-of-scope refusal, false premises, paraphrases |

---

## Docker

```bash
# Full stack (API + Admin + Widget + DB)
docker-compose -f docker-compose.full.yml up --build

# Development
docker-compose up --build
```

---

## Roadmap

See [ROADMAPV2.md](./ROADMAPV2.md) for the full V2 roadmap.

---

## License

Private — All rights reserved.
