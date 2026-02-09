# RelayOS v2 - Enhancement Roadmap

## Target Customer (ICP)
**Mid-Market B2B SaaS Support**
- Company size: 20-200 employees
- ARR: $5M - $50M
- Pain: Support team drowning, docs outdated, high ticket volume
- Tech: Already using Notion/GitBook/Confluence for docs
- Decision Maker: Head of Support, VP Customer Success

---

## Phase 1: RAG Quality + Security 🎯 [Priority: CRITICAL]

> **Goal**: Be accurate enough that B2B customers trust it with their users

### Query Processing
- [x] 🔴 **Query Rewriting** - LLM rewrites user question before retrieval ✅
  - Expand abbreviations, add synonyms
  - Handle typos and unclear phrasing
  - Includes caching (1hr TTL) and greeting skip logic
- [x] 🟡 **Query Classification** - Detect query type (factual, procedural, troubleshooting, billing) ✅
  - Heuristic-based detection with regex patterns
  - Boosts matching doc types during retrieval (5% similarity boost)

### Retrieval Improvements
- [x] 🔴 **Hybrid Search** - Combine semantic (vector) + keyword search ✅
  - Added tsvector column with GIN index for full-text search
  - Created `hybrid_search` RPC function using Reciprocal Rank Fusion (RRF)
  - Results show both semantic similarity and keyword rank
- [x] 🟡 **Re-ranking** - LLM re-ranks retrieved chunks by relevance ✅
  - Fetches 2x chunks, LLM ranks by query relevance, returns top N
  - Added `rerankChunks()` method in knowledge.service.ts
- [x] 🟢 **Chunk Metadata** - Enrich with section headers, doc type, recency ✅
  - Added doc timestamps (createdAt, updatedAt) via hybrid_search RPC
  - 2% recency boost for documents updated within 30 days

### Answer Quality
- [x] 🔴 **Answer Grading** - Self-check if answer is supported by context ✅
  - Added `gradeAnswer()` method using LLM to verify answers
  - Grades: SUPPORTED, PARTIAL, UNSUPPORTED with confidence score
- [x] 🟡 **Confidence Scores** - Show confidence, refuse gracefully if low ✅
  - Confidence included in API response and stored in messages table
  - Disclaimer added for UNSUPPORTED answers
- [x] 🔴 **Feedback Loop** - 👍/👎 buttons → store for quality tracking ✅
  - Added `message_feedback` table and `/conversation/feedback` endpoint
  - Frontend buttons in conversation detail page

### Security & Guardrails 🔒
- [x] 🔴 **PII Scrubbing** - Filter sensitive data (emails, phones, SSNs) from responses ✅
  - Using custom `pii-scrubber.ts` module (zero external dependencies)
  - Scrubs both user input and LLM output
- [x] 🔴 **Prompt Injection Defense** - Gatekeeper check for hijack attempts ✅
  - Multi-layer defense: heuristic patterns + LLM gatekeeper
  - Blocks common injection techniques (ignore instructions, DAN, etc.)
- [x] 🟡 **Output Validation** - Ensure responses stay within defined persona boundaries ✅
  - LLM-based validation against persona rules
  - Falls back to safe response if validation fails

### Quality Assurance
- [ ] 🔴 **Canonical Question Pack** - 20-30 test questions for regression
- [ ] 🟡 **Promptfoo Integration** - Automated RAG quality testing

### Future Observability
- [ ] 🟢 **Re-rank Event Logging** - Log final re-ranked order for debugging
- [ ] 🟡 **RAG Quality Dashboard** - Visualize feedback, grading, and event data
  - Aggregate positive/negative feedback rates per tenant
  - Track SUPPORTED/PARTIAL/UNSUPPORTED distribution
  - Use events (rag.graded, rag.feedback, rag.searched) for insights

---

## Phase 2: Support Intelligence 🌐 [Priority: HIGH]

> **Goal**: Understand context and route efficiently

### Context Engineering
- [ ] 🔴 **Page Context** - Widget sends current URL/page title to API
- [ ] 🔴 **User Context** - Pass user ID, plan tier, account info
- [ ] 🔴 **Context Schema** - Define standard payload structure for widget ↔ API
- [ ] 🟡 **Session History** - Maintain conversation context across messages

### Intent & Routing
- [ ] 🔴 **Intent Classification** - Detect: Support? Billing? Feature Request? Bug?
- [ ] 🔴 **Escalation Intelligence** - Detect frustration → proactive handoff
- [ ] 🟡 **Suggested Questions** - Show relevant starters based on page/docs
- [ ] 🟡 **Follow-up Suggestions** - Suggest related questions after answer

### Persona & Voice
- [ ] 🟡 **Persona Definition** - Define voice, tone, and boundary rules per tenant
- [ ] 🟢 **Persona Consistency** - Ensure predictable behavior across sessions

---

## Phase 3: Ticketing & Integrations 🔗 [Priority: HIGH]

> **Goal**: Seamlessly integrate with existing support stack

### Ticketing System Integrations (n8n)
- [ ] 🔴 **Zendesk Integration** - Create tickets, sync conversation context
- [ ] 🔴 **Intercom Integration** - Handoff to Intercom inbox
- [ ] 🟡 **Freshdesk Integration** - Alternative ticketing support
- [ ] 🟡 **Linear/Jira Integration** - Escalate bug reports to engineering

### Workflow Templates
- [ ] 🔴 **Handoff Workflow** - Notify team on handoff with full context
- [ ] 🟡 **Escalation Workflow** - Route by intent (billing → finance, bugs → eng)
- [ ] � **Email Notifications** - Notify team on handoff, escalation

### Dashboard Integration
- [ ] 🟡 **Workflow Status UI** - Show active workflows in admin
- [ ] 🟡 **Execution Logs** - View n8n execution history in admin
- [ ] 🟢 **One-Click Install** - Install template workflows from admin

---

## Phase 4: Analytics & ROI � [Priority: MEDIUM]

> **Goal**: Prove value to customer — "X tickets deflected"

### Metrics Dashboard
- [ ] � **Deflection Rate** - % of conversations resolved without handoff
- [ ] � **Resolution Time** - Average time to answer
- [ ] � **Top Questions** - Most common queries (identify doc gaps)
- [ ] � **Feedback Summary** - Aggregate 👍/👎 trends

### Advanced Analytics
- [ ] 🟡 **A/B Testing Framework** - Compare prompt versions
- [ ] 🟡 **Cost Analytics** - Token usage per tenant
- [ ] 🟢 **Latency Dashboard** - Track P50/P95 response times

---

## Phase 5: Agentic Capabilities 🤖 [Priority: FUTURE]

> **Goal**: Go beyond Q&A to actions

### Tool Use
- [ ] 🟡 **Action Framework** - Define callable tools (e.g., check subscription status)
- [ ] 🟡 **Tool Router** - Detect when to use tools vs RAG
- [ ] 🟢 **Sandboxed Execution** - Isolated containers for script execution

### Task Decomposition
- [ ] 🟡 **Complexity-Based Routing** - Route simple queries to faster/cheaper models
- [ ] � **Multi-Agent Prep** - Architecture for specialized sub-agents

### Memory & Personalization
- [ ] � **Multi-Tier Memory** - Short-term (sliding window) + Long-term (vector DB)
- [ ] 🟢 **Conversation Memory** - Reference past conversations
- [ ] � **Proactive Nudges** - "I see you've been here a while—need help?"

---

## Widget UX Improvements 💬 [Ongoing]

- [ ] � **Typing Indicator / Streaming** - Real-time response feedback
- [ ] � **Better Message Formatting** - Markdown, code blocks, links
- [ ] 🟡 **Quick Reply Buttons** - Common follow-up actions
- [ ] 🟡 **Dark/Light Mode** - Match host site theme
- [ ] 🟢 **Mobile Optimization** - Better touch experience

---

## Observability & Debug 🔍 [Ongoing]

- [ ] 🔴 **RAG Debug Mode** - Admin view showing retrieved chunks + similarity scores
- [ ] 🟡 **Latency Tracing** - End-to-end request timing breakdown
- [ ] 🟡 **LLM Token Dashboard** - Usage by tenant, conversation, model

---

## Demo & Testing 🧪 [Ongoing]

- [ ] 🟡 **Mock Docs Demo Page** - Realistic B2B SaaS docs site for widget testing
  - Replace test.html with professional demo environment
  - Match target audience (SaaS documentation site)
- [ ] 🟢 **Alternative UI Patterns** - Explore for future iterations
  - Side panel (ChatGPT-style)
  - Inline "Ask AI" for docs
  - Command palette (⌘K style)

---

## Priority Legend
- High Priority - Critical for ICP, do first
- Medium Priority - Important, schedule soon
- Nice to Have - Defer to later phases

---

*Target: Mid-Market B2B SaaS Support*
*Last updated: February 8, 2026*
