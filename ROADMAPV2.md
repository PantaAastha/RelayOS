<!-- FILE: ROADMAPV2.md -->
# RelayOS V2 Roadmap

> **Goal:** Build the most capable multi-assistant AI platform for B2B teams.
> **Principles:** Ship in demo-ready slices · Measure everything · Premium UX from day one.

## Priority Legend
- 🔴 Critical (must ship for impressive demo)
- 🟡 Important (ship soon after)
- 🟢 Nice-to-have (defer)

---

## Completed Foundations ✅

> These are **shipped and working**. No rework needed — we build on top.

### RAG Pipeline (Phase 1 — Complete)
- [x] Query rewriting (LLM rewrite + 1hr cache + greeting skip)
- [x] Query classification (factual / procedural / troubleshooting)
- [x] Hybrid search (vector + keyword with RRF)
- [x] LLM re-ranking (fetch 2x, rank, return top N)
- [x] Doc-type boost (5% similarity boost for matching types)
- [x] Token-based chunking (350 target, 15% overlap, semantic headers)
- [x] File upload + extraction (PDF / MD / TXT)
- [x] Answer grading (SUPPORTED / PARTIAL / UNSUPPORTED + confidence)
- [x] Citations (doc URL + chunk text)
- [x] Feedback loop (👍/👎 stored per message)

### Security & Guardrails (Complete)
- [x] PII scrubbing (regex-based detection + sanitization)
- [x] Prompt injection defense (heuristic patterns + LLM gatekeeper)
- [x] Output validation (persona boundary enforcement)

### Persona & Configuration (Phase 2 — Complete)
- [x] Per-assistant persona (name, tone, voice, boundaries, custom instructions)
- [x] Assistant types (reactive / guided / reference)
- [x] Welcome message + starter questions
- [x] Dynamic system prompt from persona config

### Observability (Complete)
- [x] Structured event logging (23+ event types)
- [x] Correlation IDs (end-to-end request tracing)
- [x] Canonical question pack (3 test packs: factual, synthesis, boundary)

### Infrastructure (Complete)
- [x] Multi-provider LLM service (OpenAI / Gemini / Anthropic + retry + fallback)
- [x] n8n handoff integration (basic webhook trigger)
- [x] Organization → Assistants hierarchy
- [x] Widget (streaming, citations, confidence badge, theming from config)
- [x] Admin UI (Dashboard, Documents, Conversations, Events, Assistants + config)
- [x] Docker Compose setup

### Migration (Complete)
- [x] Tenant → Assistant rename (schema + API + admin + widget)
- [x] `assistant_id` columns applied in Supabase
- [x] All API endpoints use `X-Assistant-ID` header

---

## Milestone 0 — Product Spine & Packaging (🔴)
**Outcome:** RelayOS feels like a product, not a set of features.

### Navigation & IA
- [ ] 🔴 Restructure sidebar nav: **Assistants · Knowledge · Quality · Integrations · Settings**
- [ ] 🔴 "Single-org mode" (default) + optional org switcher (feature flag)
- [ ] 🔴 Consistent UI primitives (cards, tables, chips, empty states, skeletons)

### Demo Pack
- [ ] 🔴 Seed script: creates org + 3 assistants + sample docs + sample conversations
- [ ] 🔴 "Run demo in 5 steps" README section
- [ ] 🔴 Update `docker-compose` for clean one-command startup

**Acceptance**
- Admin loads with a coherent nav
- Demo can be launched by another person without code edits

---

## Milestone 1 — Assistant Studio (🔴)
**Outcome:** Create → configure → test → deploy assistants from one place.

### Assistants List
- [ ] 🔴 Enhance assistants list page (cards/table):
  - Name, template type, status (Draft/Live/Needs attention)
  - Quick stats placeholders (7d conversations, supported%, handoff%)
  - Actions: Open Studio, Duplicate, Archive

### Assistant Studio (Tabs)
- [ ] 🔴 Studio layout: split-view (config tabs left, live preview right)
- [ ] 🔴 Persona tab: tone, boundaries, welcome message, starters (refine existing config page)
- [ ] 🔴 Behavior tab: template type + behavior mode config
  - Support (reactive)
  - Docs (reference)
  - Onboarding (guided)
- [ ] 🔴 Knowledge tab: show attached documents count (Collections in M3)
- [ ] 🔴 Handoff tab: n8n workflow URL + thresholds
- [ ] 🔴 Widget tab: theme tokens + header/title/avatar (extend existing config JSONB)
- [ ] 🔴 Deploy tab: embed snippet generator + env tips + domain allowlist

### Live Preview (Must-have)
- [ ] 🔴 Preview panel with citations + confidence + refusal behavior
- [ ] 🔴 "Preview as page context" toggle (simulate URL/section/user plan)

**Acceptance**
- Demo: create 3 assistants → configure → preview → copy embed snippet

---

## Milestone 2 — Context Contract (🔴) + Guided Onboarding (🟡)
**Outcome:** Assistants become context-aware. Onboarding feels different from generic Q&A.

### Context Contract (🔴 — Widget/App → API)
- [ ] 🔴 Define Context Schema (versioned):
  - page: url, title, route, section
  - user: id/anon_id, plan, role
  - session: id
- [ ] 🔴 Widget sends context payload with each message
- [ ] 🔴 Store context snapshots in conversation metadata

### Guided Onboarding (🟡 — simulated for demo, full engine later)
- [ ] 🟡 Onboarding flow config: steps + success criteria + "next action"
- [ ] 🟡 Progress tracking table (per user/session per assistant)
- [ ] 🟡 "Ask ≤2 clarifying questions" guardrail (system prompt v1)
- [ ] 🟡 Context-aware retrieval boosts (rule-based v1)

**Acceptance**
- Demo shows assistant adapting to page context (not generic Q&A)
- Onboarding assistant uses curated system prompt to simulate guided flow

---

## Milestone 3 — KnowledgeOps MVP (🔴)
**Outcome:** Upload + manage knowledge with collections and retrieval scoping.

### Upload Pipeline (Exists — Enhance)
- [ ] 🔴 Knowledge > Sources page: connection status, last sync, docs count, chunks count, errors
- [ ] 🔴 Knowledge > Ingestion Jobs page (CI-style): queued/running/failed/succeeded, duration, error logs

### Collections & Scoping (New)
- [ ] 🔴 Collections feature:
  - Create Collection
  - Add documents/pages to collection
  - "Mount" collection to assistant(s)
- [ ] 🔴 Retrieval enforcement: assistant can only retrieve chunks from mounted collections
- [ ] 🔴 New schema tables: `collections`, `collection_documents`, `assistant_collections`

### Connectors (Deferred to V3)
- [ ] 🟢 Notion connector (org-level)
- [ ] 🟢 GitBook connector
- [ ] 🟢 Intercom / Zendesk articles
- [ ] 🟢 Confluence

**Acceptance**
- Demo: Upload docs → create collection → mount to assistant → preview answer with citations
- Retrieval is scoped: assistant only sees docs in its mounted collections

---

## Milestone 4 — Quality Cockpit + Trace Viewer Lite (🔴)
**Outcome:** "We can measure + debug AI quality" becomes visible.

### Org Dashboard (Summary)
- [ ] 🔴 KPIs: conversations (7d), supported%, handoff%, feedback trend
- [ ] 🟡 Latency P50/P95, token usage (BYOK transparency)

### Assistant Dashboard (Operator View)
- [ ] 🔴 Supported/Partial/Unsupported distribution
- [ ] 🔴 Top queries + low-confidence queries ("gaps")
- [ ] 🟡 Most cited sources

### Trace Viewer Lite (per message)
- [ ] 🔴 Timeline: rewrite → retrieval → rerank → generation → grading
- [ ] 🔴 Show retrieved chunks + scores + chosen citations
- [ ] 🟡 "Replay with debug mode" (optional)

> **Note:** All trace data already exists in the events table. This is primarily a frontend + API aggregation effort.

**Acceptance**
- Demo: ask a question → open trace → explain why answer is trusted/refused

---

## Milestone 5 — Auth + Platform Security Baseline (🔴 for credibility)
**Outcome:** Admin is secure + platform feels production-grade.

### Admin Auth + RBAC
- [ ] 🔴 Supabase Auth (email/password or magic link)
- [ ] 🔴 Roles: owner/admin/viewer
- [ ] 🟡 Audit log of admin actions

### API Hardening
- [ ] 🔴 Assistant API keys (separate from BYOK model key)
- [ ] 🔴 Rate limiting (per assistant + per IP) — throttler guard exists, needs enhancement
- [ ] 🔴 Widget domain allowlist + CORS controls
- [ ] 🟡 Webhook signing for n8n triggers

### BYOK Security
- [ ] 🔴 Encrypt stored model keys at rest
- [ ] 🔴 "Test key" UX + graceful failure states

**Acceptance**
- Admin requires login
- Widget cannot spoof assistant/org
- Basic rate limiting & domain restrictions are enforced

---

## Milestone 6 — Agentic Rails + Demo Actions (🟡)
**Outcome:** "Agentic" without building a full agent framework.

- [ ] 🟡 Action schema + allowlist per assistant
- [ ] 🟡 Confirmation step for actions (v1 safety)
- [ ] 🟡 Demo actions:
  - Support: Create ticket (n8n)
  - Onboarding: Update onboarding checklist (DB)
  - Docs: Generate code snippet (safe read-only)
- [ ] 🟡 Action events integrated into trace viewer

---

## Milestone 7 — Demo World (🔴 to sell + interview)
**Outcome:** A public "Acme SaaS" multi-context demo that tells the story fast.

- [ ] 🔴 Public demo site + 3 assistants (distinct styling + behavior)
- [ ] 🔴 Seed docs realistic enough to produce great answers
- [ ] 🔴 Scripted demo path (5 questions) showing:
  - citations + confidence
  - context adaptation
  - trace viewer
  - handoff action
- [ ] 🟡 "Demo mode" toggle that highlights key features

---

## Recommended Build Order (Minimum Impressive Demo)

```
M0 (nav + primitives + seed)
  ├── M1 (Assistant Studio — the wow screen)
  │     └── M3 (KnowledgeOps — upload + collections)
  └── M4 (Quality Cockpit — trace viewer from existing events)
         └── M7 (Demo World — public demo site)

M2 (Context Contract — after studio works)
M5 (Auth — after demo is solid)
M6 (Agentic Rails — stretch)
```

---

## Notes / Guardrails
- Templates = presets (not hard limits)
- Avoid client-specific forks; use branding config + feature flags
- Keep core stable; ship in slices that always improve demo quality
- Connectors (Notion, GitBook, etc.) deferred to V3 — upload-only for V2 demo

*Last updated: February 16, 2026*
