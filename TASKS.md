# RelayOS v2 - Enhancement Roadmap

## Vision

RelayOS is a **multi-context AI assistant platform** for B2B companies. One customer deploys multiple specialized AI assistants across their organization — Support, Developer Docs, Onboarding, Sales — each with its own persona, knowledge base, behavior mode, and integrations. Same infrastructure, different specialized assistants for every context.

## Target Customer (ICP)
**Mid-Market B2B SaaS**
- Company size: 20-200 employees
- ARR: $5M - $50M
- Pain: Support team drowning, docs outdated, onboarding manual, knowledge siloed
- Tech: Already using Notion/GitBook/Confluence for docs
- Decision Maker: Head of Support, VP Customer Success, CTO

---

## Phase 1: RAG Foundation ✅ [COMPLETE]

> **Goal**: Accurate, grounded AI responses that B2B customers trust

### Query Processing
- [x] **Query Rewriting** - LLM rewrites user question before retrieval ✅
  - Expand abbreviations, add synonyms, handle typos
  - Includes caching (1hr TTL) and greeting skip logic
- [x] **Query Classification** - Detect query type (factual, procedural, troubleshooting, billing) ✅
  - Heuristic-based detection with regex patterns
  - Boosts matching doc types during retrieval (5% similarity boost)

### Retrieval
- [x] **Hybrid Search** - Combine semantic (vector) + keyword search ✅
  - tsvector column with GIN index for full-text search
  - `hybrid_search` RPC using Reciprocal Rank Fusion (RRF)
- [x] **Re-ranking** - LLM re-ranks retrieved chunks by relevance ✅
  - Fetches 2x chunks, LLM ranks by query relevance, returns top N
- [x] **Chunk Metadata** - Enrich with section headers, doc type, recency ✅
  - 2% recency boost for documents updated within 30 days

### Answer Quality
- [x] **Answer Grading** - Self-check if answer is supported by context ✅
  - Grades: SUPPORTED, PARTIAL, UNSUPPORTED with confidence score
- [x] **Confidence Scores** - Show confidence, refuse gracefully if low ✅
  - Automatic disclaimers for UNSUPPORTED answers
- [x] **Feedback Loop** - 👍/👎 buttons → stored for quality tracking ✅

### Security & Guardrails
- [x] **PII Scrubbing** - Filter sensitive data from inputs and outputs ✅
- [x] **Prompt Injection Defense** - Multi-layer (heuristic + LLM gatekeeper) ✅
- [x] **Output Validation** - Ensure responses stay within persona boundaries ✅

### Quality Assurance
- [x] **Canonical Question Pack** - RAG regression test suite ✅
  - 3 test packs: factual retrieval, multi-chunk synthesis, boundary testing
  - Runner: `npm run test:canonical`
- [ ] **Promptfoo Integration** - Automated RAG quality testing

### Observability
- [x] **Structured Event Logging** - Conversation lifecycle, RAG ops, handoffs ✅
- [x] **Correlation IDs** - End-to-end request tracing ✅
- [ ] **Re-rank Event Logging** - Log final re-ranked order for debugging

---

## Phase 2: Context & Persona Layer 🎯 [Priority: NOW]

> **Goal**: Make each assistant context-aware and distinctly specialized. This is the foundation for multi-context.

### Tenant Persona & Configuration
- [x] 🔴 **Persona Definition** - Per-tenant persona with voice, tone, boundaries, and welcome message
- [x] 🔴 **Assistant Type** - Define mode per tenant: `reactive` (support Q&A), `guided` (onboarding flows), `reference` (docs lookup)
  - **Reactive (Support):** Waits for questions, provides cited answers
  - **Guided (Onboarding):** Proactive, step-by-step, tracks progress
  - **Reference (Docs):** Technical, code-focused, example-heavy
- [x] 🟡 **Persona Consistency** - Ensure predictable behavior across sessions
- [x] 🟡 **Welcome Message & Starters** - Context-specific greeting and suggested questions

### Context Engineering
- [ ] 🔴 **Context Schema** - Standard payload structure for widget → API (page, user, session)
- [ ] 🔴 **Page Context** - Widget sends current URL, page title, section to API
- [ ] 🔴 **User Context** - Pass user ID, plan tier, account age, onboarding state
- [ ] 🟡 **Context-Aware Retrieval** - Use context signals to boost relevant chunks
- [ ] 🟡 **Session History** - Maintain conversation context across messages

---

## Phase 3: Demo & Intelligence 🌐 [Priority: NEXT]

> **Goal**: Prove multi-context works with a live demo. Add intelligence that makes each assistant smarter.

### Demo Environment
- [ ] 🔴 **Demo Landing Page** - Public page for a fictional B2B company ("Acme SaaS")
- [ ] 🔴 **3 Specialized Assistants** - Each with distinct persona, knowledge base, and widget styling:
  - Support Bot (reactive, product FAQ knowledge)
  - Developer Docs Bot (reference, API docs knowledge)
  - Onboarding Bot (guided, getting-started knowledge)
- [ ] 🟡 **Seed Data & Docs** - Realistic sample documentation for each context
- [ ] 🟡 **Deploy Publicly** - Live URL for Upwork portfolio and client demos

### Intent & Routing
- [ ] 🔴 **Intent Classification** - Detect: Support? Billing? Feature Request? Bug?
- [ ] 🔴 **Escalation Intelligence** - Detect frustration → proactive handoff
- [ ] 🟡 **Suggested Questions** - Show relevant starters based on page/context
- [ ] 🟡 **Follow-up Suggestions** - Suggest related questions after answer

### Quality Dashboard
- [ ] 🟡 **RAG Quality Dashboard** - Visualize feedback, grading, and event data
  - SUPPORTED/PARTIAL/UNSUPPORTED distribution per tenant
  - Aggregate positive/negative feedback rates
- [ ] 🟡 **RAG Debug Mode** - Admin view showing retrieved chunks + similarity scores

---

## Phase 4: Integrations & Analytics 🔗 [Priority: HIGH]

> **Goal**: Connect to existing support stacks and prove ROI

### Ticketing Integrations (n8n)
- [ ] 🔴 **Zendesk Integration** - Create tickets, sync conversation context
- [ ] 🔴 **Intercom Integration** - Handoff to Intercom inbox
- [ ] 🟡 **Freshdesk Integration** - Alternative ticketing support
- [ ] 🟡 **Linear/Jira Integration** - Escalate bug reports to engineering

### Workflow Templates
- [ ] 🔴 **Handoff Workflow** - Notify team on handoff with full context
- [ ] 🟡 **Escalation Workflow** - Route by intent (billing → finance, bugs → eng)
- [ ] 🟡 **Email Notifications** - Notify team on handoff, escalation

### Analytics & ROI
- [ ] 🔴 **Deflection Rate** - % of conversations resolved without handoff
- [ ] 🔴 **Resolution Time** - Average time to answer
- [ ] 🟡 **Top Questions** - Most common queries (identify doc gaps)
- [ ] 🟡 **Feedback Summary** - Aggregate 👍/👎 trends
- [ ] 🟡 **Cost Analytics** - Token usage per tenant
- [ ] 🟢 **Latency Dashboard** - Track P50/P95 response times

### Dashboard Integration
- [ ] 🟡 **Workflow Status UI** - Show active workflows in admin
- [ ] 🟡 **LLM Token Dashboard** - Usage by tenant, conversation, model
- [ ] 🟢 **One-Click Install** - Install template workflows from admin

---

## Phase 5: Agentic Capabilities 🤖 [Priority: FUTURE]

> **Goal**: Go beyond Q&A to actions

### Tool Use
- [ ] 🟡 **Action Framework** - Define callable tools (e.g., check subscription status)
- [ ] 🟡 **Tool Router** - Detect when to use tools vs RAG
- [ ] 🟢 **Sandboxed Execution** - Isolated containers for script execution

### Task Decomposition
- [ ] 🟡 **Complexity-Based Routing** - Route simple queries to faster/cheaper models
- [ ] 🟡 **Multi-Agent Prep** - Architecture for specialized sub-agents

### Memory & Personalization
- [ ] 🟡 **Multi-Tier Memory** - Short-term (sliding window) + Long-term (vector DB)
- [ ] 🟢 **Conversation Memory** - Reference past conversations
- [ ] 🟡 **Proactive Nudges** - "I see you've been here a while—need help?"

---

## Widget UX Improvements 💬 [Ongoing]

- [ ] 🔴 **Typing Indicator / Streaming** - Real-time response feedback
- [ ] 🔴 **Better Message Formatting** - Markdown, code blocks, links
- [ ] 🟡 **Quick Reply Buttons** - Common follow-up actions
- [ ] 🟡 **Dark/Light Mode** - Match host site theme
- [ ] 🟢 **Mobile Optimization** - Better touch experience
- [ ] 🟢 **Alternative UI Patterns** - Side panel, inline "Ask AI", command palette

---

## Priority Legend
- 🔴 Critical — must have for next milestone
- 🟡 Important — schedule soon after critical items
- 🟢 Nice to have — defer to later

---

*Vision: Multi-Context AI Assistant Platform for B2B*
*Last updated: February 11, 2026*
