# RelayOS v2 - Enhancement Roadmap

## Overview
Evolution from basic chatbot to intelligent, platform-aware AI assistant.

---

## Phase 1: RAG Refinement 🎯

### Query Processing
- [ ] **Query Rewriting** - LLM rewrites user question before retrieval
  - Expand abbreviations, add synonyms
  - Handle typos and unclear phrasing
- [ ] **Query Classification** - Detect query type (factual, procedural, opinion)

### Retrieval Improvements
- [ ] **Hybrid Search** - Combine semantic (vector) + keyword search
- [ ] **Re-ranking** - LLM re-ranks retrieved chunks by relevance
- [ ] **Chunk Metadata** - Enrich with section headers, doc type, recency

### Answer Quality
- [ ] **Answer Grading** - Self-check if answer is supported by context
- [ ] **Confidence Scores** - Show confidence, refuse if low
- [ ] **Feedback Loop** - 👍/👎 buttons → store for quality tracking

---

## Phase 2: Platform Awareness 🌐

### Context Passing
- [ ] **Page Context** - Widget sends current URL/page title to API
- [ ] **User Context** - Pass user ID, plan tier, account info
- [ ] **Session History** - Maintain conversation context across messages

### Intelligent Responses
- [ ] **Intent Classification** - Detect: Support? Sales? General?
- [ ] **Suggested Questions** - Show relevant starters based on page
- [ ] **Follow-up Suggestions** - Suggest related questions after answer
- [ ] **Escalation Intelligence** - Detect frustration → proactive handoff

---

## Phase 3: Agentic Capabilities 🤖

### Tool Use
- [ ] **Action Framework** - Define callable tools (order lookup, ticket create)
- [ ] **Tool Router** - Detect when to use tools vs RAG
- [ ] **Result Formatting** - Present tool results naturally

### Memory & Personalization
- [ ] **User Preferences** - Remember communication preferences
- [ ] **Conversation Memory** - Reference past conversations
- [ ] **Proactive Nudges** - "I see you've been here a while—need help?"

---

## Phase 4: Quality Assurance 📊

- [ ] **Canonical Question Pack** - 20-30 test questions for regression
- [ ] **Promptfoo Integration** - Automated RAG quality testing
- [ ] **A/B Testing Framework** - Compare prompt versions

---

## Widget UX Improvements 💬

- [ ] **Typing Indicator / Streaming** - Real-time response feedback
- [ ] **Better Message Formatting** - Markdown, code blocks, links
- [ ] **Quick Reply Buttons** - Common follow-up actions
- [ ] **Dark/Light Mode** - Match host site theme
- [ ] **Mobile Optimization** - Better touch experience

---

## n8n Workflows & Automation 🔗

### Workflow Templates
- [ ] **Example Workflows** - Importable templates for common use cases
- [ ] **CRM Integration** - Sync leads/contacts to HubSpot, Salesforce, etc.
- [ ] **Ticket Creation** - Auto-create support tickets in Zendesk, Freshdesk
- [ ] **Email Notifications** - Notify team on handoff, escalation

### Event Triggers
- [ ] **Custom Event Types** - Define tenant-specific event types
- [ ] **Webhook Filtering** - Only trigger on specific event conditions
- [ ] **Batch Processing** - Aggregate events before triggering

### Dashboard Integration
- [ ] **Workflow Status UI** - Show active workflows in admin
- [ ] **Execution Logs** - View n8n execution history in admin
- [ ] **One-Click Install** - Install template workflows from admin

---

## Completed ✅

### Multi-Tenancy Fixes (Jan 21, 2026)
- [x] Fixed `deleteTenant` FK constraint issue
- [x] Fixed verification script for repeated runs
- [x] Fixed dashboard localStorage cleanup on tenant delete

---

*Last updated: January 21, 2026*
