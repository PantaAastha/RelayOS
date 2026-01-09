# RelayOS - Project Status

## What We're Building

**RelayOS** is a white-label AI customer support platform that allows businesses to deploy their own AI assistant trained on their knowledge base.

### Core Value Proposition
- **For Businesses**: Deploy an AI assistant on your website in minutes
- **For End Users**: Get instant, accurate answers from a company's knowledge base
- **For Ops Teams**: Full observability into every AI decision

### Key Differentiators
1. **Multi-tenant** - Single deployment serves multiple clients
2. **RAG-first** - AI answers grounded in actual documents, not hallucinations
3. **Observable** - Every retrieval and generation is logged and traceable
4. **Extensible** - n8n integration for custom workflows (CRM, handoffs, etc.)

---

## What's Built ✅

### Core Platform

| Component | Status | Description |
|-----------|--------|-------------|
| **API** (NestJS) | ✅ Complete | REST API with multi-tenant support |
| **Admin Dashboard** (Next.js) | ✅ Complete | Manage knowledge base, view conversations |
| **Widget** (React) | ✅ Complete | Embeddable chat widget |
| **Database** (Supabase/PostgreSQL) | ✅ Complete | pgvector for embeddings, RLS for isolation |

### RAG Pipeline

| Feature | Status | Description |
|---------|--------|-------------|
| Document ingestion | ✅ Complete | Text, PDF, DOCX support |
| **Universal Chunker** | ✅ Complete | Token-based (350-500), semantic blocks, 15% overlap |
| Vector search | ✅ Complete | pgvector with cosine similarity |
| Citation extraction | ✅ Complete | Links answers to source documents |
| LLM providers | ✅ Complete | Gemini, OpenAI, Anthropic |

### Observability

| Feature | Status | Description |
|---------|--------|-------------|
| Event logging | ✅ Complete | Append-only audit log in DB |
| Correlation IDs | ✅ Complete | Trace requests across services |
| **RAG tracing** | ✅ Complete | Logs chunks, sections, similarity, latency |
| Console logging | ✅ Complete | Structured JSON logs |

### Integrations

| Feature | Status | Description |
|---------|--------|-------------|
| n8n webhooks | ✅ Complete | Trigger workflows on events |
| Handoff to human | ✅ Complete | Escalate to support with context |
| Callback handlers | ✅ Complete | Receive status updates from n8n |

### DevOps

| Feature | Status | Description |
|---------|--------|-------------|
| Docker Compose | ✅ Complete | Local development with hot reload |
| Full Stack mode | ✅ Complete | Bundled PostgreSQL + n8n |
| Deployment docs | ✅ Complete | Railway, Render, self-host guides |
| Health validation | ✅ Complete | `/health/validate` endpoint |

---

## What's Left 🔴

### Priority 1: Refinements

| Task | Effort | Description |
|------|--------|-------------|
| Re-ingest endpoint | 30 min | API to reprocess existing docs with new chunking |
| Test mode cleanup | 15 min | Remove debug console.logs |

### Priority 2: Quality Assurance

| Task | Effort | Description |
|------|--------|-------------|
| Canonical question pack | 3-4 hrs | 20-30 test questions for regression |
| Promptfoo integration | 2-3 hrs | Automated RAG quality testing |

### Priority 3: Production Hardening

| Task | Effort | Description |
|------|--------|-------------|
| Rate limiting | 2-3 hrs | Prevent abuse |
| PII redaction | 3-4 hrs | Filter sensitive data from logs |
| Error boundaries | 2 hrs | Graceful degradation |

### Priority 4: Nice-to-Have

| Task | Effort | Description |
|------|--------|-------------|
| Example n8n workflows | 1-2 hrs | Importable templates |
| URL/sitemap ingestion | 4-5 hrs | Crawl websites for docs |
| Setup wizard in admin | 6-8 hrs | Guided onboarding flow |
| Multi-agent router | 8-10 hrs | Route to specialized agents |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Widget (React)                        │
│                   Embeddable chat interface                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API (NestJS)                          │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐    │
│  │ Conversation │ │  Knowledge   │ │       n8n         │    │
│  │   Service    │ │   Service    │ │     Service       │    │
│  └──────────────┘ └──────────────┘ └───────────────────┘    │
│          │               │                   │               │
│          ▼               ▼                   ▼               │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐    │
│  │  LLM Service │ │   Chunker    │ │  Events Service   │    │
│  │ (Gemini/GPT) │ │   Service    │ │   (Audit Log)     │    │
│  └──────────────┘ └──────────────┘ └───────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL + pgvector                      │
│          (Supabase or self-hosted with RLS)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Configuration

```bash
# LLM Provider
LLM_PROVIDER=gemini
GOOGLE_AI_API_KEY=your-key

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Optional: n8n
N8N_ENABLED=true
N8N_WEBHOOK_BASE_URL=http://n8n:5678/webhook
```

---

## Getting Started

```bash
# Start full stack (API + Admin + n8n + Postgres)
docker compose -f docker-compose.yml -f docker-compose.full.yml up -d

# Access
# - API: http://localhost:3001
# - Admin: http://localhost:3000
# - n8n: http://localhost:5678
```

---

*Last updated: January 8, 2026*
