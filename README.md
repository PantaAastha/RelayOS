# RelayOS

A multi-tenant AI support copilot that can be embedded on any website. RelayOS uses Retrieval-Augmented Generation (RAG) to answer customer questions using company-approved knowledge bases, with full citations and confidence scoring.

## Vision

Most B2B SaaS companies struggle with support at scale. Documentation gets outdated, support teams get overwhelmed, and customers wait for answers that exist somewhere in the knowledge base. RelayOS solves this by providing an embeddable AI assistant that:

- Answers customer questions instantly using your existing documentation
- Always cites sources so users can verify answers
- Grades its own answers for confidence and flags uncertain responses
- Collects user feedback for continuous improvement
- Routes to human agents when it cannot help

The target market is mid-market B2B SaaS companies (20-200 employees, $5M-$50M ARR) who need to scale their support without proportionally scaling their team.

---

## Current Status

RelayOS is currently in active development. Phase 1 (RAG Quality and Observability) is largely complete.

### Implemented Features

**RAG Pipeline**
- Hybrid search combining semantic (vector) similarity with keyword matching using Reciprocal Rank Fusion
- LLM-based query rewriting to expand abbreviations, fix typos, and clarify intent
- Query classification to detect query type (factual, procedural, troubleshooting) and boost relevant document types
- LLM re-ranking of retrieved chunks to improve relevance before generation
- Chunk metadata enrichment with section headers, document type, and recency scoring

**Answer Quality**
- Answer grading using LLM self-evaluation (SUPPORTED / PARTIAL / UNSUPPORTED)
- Confidence scores exposed in API responses and displayed in the widget
- User feedback loop with thumbs up/down buttons stored for analytics
- Automatic disclaimers for low-confidence answers

**Multi-Tenancy**
- Full tenant isolation with row-level security in PostgreSQL
- Tenant-specific document ingestion and chunking
- Per-tenant configuration and API key management

**Observability**
- Structured event logging for conversation lifecycle, RAG operations, and handoffs
- Correlation IDs for end-to-end request tracing
- Event types: conversation.started, message.received, rag.searched, rag.graded, rag.feedback, agent.completed, handoff.requested, and more

**Widget**
- Embeddable React chat widget with customizable styling
- Citation display with source links
- Conversation persistence with session restoration
- Human handoff capability via n8n workflows

### Roadmap

See [TASKS.md](./TASKS.md) for the full enhancement roadmap. Upcoming phases include:

- Phase 2: Support Intelligence (intent classification, escalation detection, context engineering)
- Phase 3: Ticketing Integrations (Zendesk, Intercom, Freshdesk via n8n)
- Phase 4: Analytics and ROI Dashboard (deflection rate, resolution time, top questions)
- Phase 5: Agentic Capabilities (tool use, action framework, multi-agent architecture)

---

## Architecture

```
relayos/
├── apps/
│   ├── api/          # NestJS backend API
│   │   └── modules/
│   │       ├── conversation/   # Chat, feedback, handoff
│   │       ├── knowledge/      # RAG search, ingestion, re-ranking
│   │       ├── llm/            # LLM abstraction (Gemini, OpenAI)
│   │       ├── guardrails/     # Input/output safety (PII, injection)
│   │       ├── events/         # Structured logging
│   │       ├── tenants/        # Multi-tenant management
│   │       └── n8n/            # Workflow triggers
│   │   └── test/
│   │       └── canonical/      # RAG regression test suite
│   ├── widget/       # Embeddable React chat widget (Vite)
│   └── admin/        # Next.js admin dashboard
├── packages/
│   ├── db/           # Database migrations and schema
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared UI components
└── n8n/              # n8n workflow templates
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Backend API | NestJS (Node.js) |
| Database | PostgreSQL with pgvector (Supabase) |
| Vector Search | pgvector with hybrid search RPC |
| LLM Integration | Gemini, OpenAI (configurable) |
| Widget | React with Vite |
| Admin Dashboard | Next.js 16 |
| Workflows | n8n (self-hosted) |
| Deployment | Docker, Docker Compose |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase project (PostgreSQL + pgvector + Auth)
- LLM API key (Gemini or OpenAI)

### Installation

```bash
# Clone and install dependencies
git clone <repo-url>
cd relayos
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials
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

### RAG Regression Testing

The canonical question pack tests RAG quality across three dimensions:

| Pack | What it tests |
|------|---------------|
| `factual_retrieval` | Single-chunk retrieval accuracy — can the system find and return the right fact? |
| `multi_chunk_synthesis` | Cross-section synthesis — can the system combine info from multiple chunks? |
| `rag_boundary_testing` | Out-of-scope refusal, false premises, ambiguous queries, paraphrase robustness |

```bash
# Run the test suite (requires API running on :3001)
TENANT_ID=<your-tenant-id> npm run test:canonical

# With verbose failure details
VERBOSE=true TENANT_ID=<your-tenant-id> npm run test:canonical
```

### Database Setup

Run migrations in Supabase SQL Editor in order:
```
packages/db/migrations/0001_initial_schema.sql
packages/db/migrations/0002_add_hybrid_search.sql
packages/db/migrations/0003_hybrid_search_rpc.sql
packages/db/migrations/0004_doc_timestamps.sql
packages/db/migrations/0005_message_feedback.sql
packages/db/migrations/0006_message_grading.sql
```

### Widget Embedding

```html
<script 
  src="https://your-cdn.com/relayos-widget.iife.js"
  data-api-url="https://api.relayos.com"
  data-tenant-id="your-tenant-id"
  data-primary-color="#2563eb"
  data-title="Chat with us"
></script>
```

---

## Docker

```bash
# Build and run all services
docker-compose up --build

# Build individual services
docker build -t relayos-api -f apps/api/Dockerfile .
docker build -t relayos-admin -f apps/admin/Dockerfile .
```

---

## License

Private - All rights reserved.
