# RelayOS V2 Roadmap (Updated)

> **Goal:** Build the most capable multi-assistant AI platform for B2B teams.
> **Principles:** Ship in demo-ready slices · Measure everything · Premium UX from day one.
> **Updated:** March 4, 2026 — reconciled with UI/UX Vision + Trust Architecture + Architecture Rules (ARCHITECTURE.md).

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

## Milestone 0 — Product Spine & UI Primitives (🔴)
**Outcome:** RelayOS feels like a product, not a set of features. Every screen has a place.

### Navigation & Information Architecture
- [x] 🔴 Restructure sidebar nav to exactly these 6 items in this order: **Dashboard · Assistants · Knowledge · Quality · Integrations · Settings** — no Conversations, no Events, nothing else
- [x] 🔴 Single-org mode — no org switcher anywhere in the UI (single org is the permanent default)
- [x] 🔴 Consistent UI primitive library: cards, tables, status chips, empty states, skeleton loaders
- [x] 🔴 Empty states must always include a CTA — no dead ends anywhere in the product

### Design System Baseline (feeds all subsequent milestones)
- [x] 🔴 Status chip component with animated state transitions (Draft → Live, queued → running → complete)
- [x] 🔴 Skeleton loading for all data-fetching surfaces
- [x] 🔴 Toast notification system ("Copied", "Saved", "Sync started")
- [x] 🟡 Optimistic updates where safe (config saves, feedback reactions)

### Demo Pack
- [x] 🔴 Seed script: creates org + 3 assistants + sample docs + sample conversations
- [x] 🔴 "Run demo in 5 steps" README section
- [x] 🔴 Update `docker-compose` for clean one-command startup

**Acceptance**
- Admin loads with a coherent, navigable product spine
- No screen has an empty state without a clear next action
- Status chips animate on state changes
- Demo can be launched by another person without code edits

---

## Milestone 1 — Assistant Studio (🔴)
**Outcome:** Create → configure → test → deploy assistants from one place. The "wow" screen.

### Assistants List
- [x] 🔴 Assistants list page (cards or table):
  - Name + template type chip (Support / Docs / Onboarding)
  - Status chip (Draft / Live / Needs Attention)
  - Quick stats: 7d conversations, supported%, handoff%
  - Actions: Open Studio, Duplicate, Archive
- [x] 🔴 Empty state: "Create your first assistant" + 3 template buttons

### Assistant Studio Layout
- [x] 🔴 Split-view layout: config tabs (left) + Live Preview panel (right)
- [x] 🔴 Smooth panel transitions between tabs (no jarring reloads)

### Studio Tabs
1. **Persona** *(identity only — no widget config here)*
   - [x] 🔴 Persona name, tone, voice / style
   - [x] 🔴 Boundaries (what the assistant won't do)
   - [x] 🔴 Custom instructions (how the assistant should behave)

2. **Behavior** *(includes Delegation Control Surface — Trust Architecture)*
   - [x] 🔴 Template type selector: Support (reactive) / Docs (reference) / Onboarding (guided)
   - [x] 🔴 Behavior mode config per type
   - [] 🔴 **Delegation controls** — operator-facing surface for defining the boundary between autonomous and escalated decisions:
     - Confidence threshold for autonomous answers (below threshold → escalate or refuse, not silently hallucinate)
     - Actions allowed without user confirmation (read-only operations)
     - Actions that always require user confirmation before execution (writes, ticket creation, DB mutations)
     - Hard refusal topics (persona boundaries enforced at generation layer, not just prompt)
   - [x] 🟡 "Autonomy level" summary chip (Conservative / Balanced / Proactive) derived from delegation config — visible on Assistants list as an operator trust signal

3. **Knowledge**
   - [ ] 🔴 Show attached collections + document count (Collections built in M3)
   - [ ] 🔴 Mount / unmount collections to this assistant
   - [ ] 🔴 Empty state when no collections exist: *"No collections yet. Create one in [Knowledge →]"*
   - **Never** shows upload UI or sync jobs — those live in sidebar Knowledge only

4. **Handoff**
   - [ ] 🔴 Workflow selector — dropdown populated from n8n workflows registered in Integrations (M6); **never** a free-text webhook URL field
   - [ ] 🔴 Trigger threshold config (confidence level that triggers handoff)
   - [ ] 🔴 Handoff message config
   - [ ] 🔴 Empty state when no integration connected: *"No workflows available. Connect n8n in [Integrations →]"*

5. **Widget** *(everything the end-user sees in the widget surface)*
   - [x] 🔴 Welcome message — the first message shown when the widget opens
   - [x] 🔴 Starter questions — suggested prompts shown before the user types
   - [x] 🔴 Color tokens (primary, background, text)
   - [x] 🔴 Widget title and avatar icon
   - [x] 🔴 Position: bottom-right / bottom-left
   - [x] 🔴 Widget config is applied at embed time — a red bottom-left widget in config renders as a red bottom-left widget on the client's platform
   - [x] 🟡 **Widget mode selector** (extensibility foundation):
     - `popup` (default) — standard corner chat bubble
     - `side-panel` — slides in from the right, better for long Docs responses
     - `floating-avatar` — persistent avatar that follows the user, best for Onboarding guided flows
     - `inline` — embedded directly in the page at a specified container
   - [ ] 🟢 Mode-specific config options exposed per selected mode (e.g. avatar appearance for floating-avatar, panel width for side-panel)

6. **Deploy**
   - [x] 🔴 Embed snippet generator with one-click copy + "Copied" toast
   - [x] 🔴 Domain allowlist input
   - [x] 🟡 Environment tips (staging vs production)

7. **Widget Frontend Implementation** (Client-side matching)
   - [ ] 🟡 Parse widget config (`data-mode`, `data-placement`, theme colors) from the embed `<script>` tag
   - [ ] 🟡 Implement `popup` layout (standard chat bubble)
   - [ ] 🟡 Implement `side-panel` layout (edge-anchored drawer)
   - [ ] 🟡 Implement `floating-avatar` layout (persistent orb)
   - [ ] 🟡 Implement `inline` layout (embedded in page flow)

### Live Preview Panel (must-have)
- [ ] 🔴 **State sync** — preview reflects current unsaved config on every change, not last saved state (requires ephemeral config endpoint that accepts a transient config payload without persisting it)
- [ ] 🔴 **Real inference** — preview makes actual backend API calls using current unsaved config, not simulated or mocked responses; real RAG retrieval, real grading, real citations
- [ ] 🔴 **Conversation persistence** — history preserved while switching between Studio tabs; cleared only on navigating away from Studio entirely
- [ ] 🔴 Streaming responses with typing indicator
- [ ] 🔴 Citations UI with expand/collapse animation
- [ ] 🔴 Confidence indicator (badge tied to SUPPORTED / PARTIAL / UNSUPPORTED) — framed as a trust signal, not a debug label
- [ ] 🔴 **Delegation boundary indicator** — when a response would have triggered escalation or refusal under current delegation config, show why (low confidence / hard refusal / action requires confirmation)
- [ ] 🔴 "Simulate context" toggle: URL / section / user plan inputs — changing context re-runs the last query automatically
- [ ] 🔴 "Open trace" link after each preview response (links to Trace Viewer, M4)
- [ ] 🟡 Refusal behavior visible in preview (persona boundary enforcement)

**Acceptance**
- Demo: create 3 assistants from templates → configure → preview with streaming citations → copy embed snippet
- Theme changes reflect in Live Preview without page reload
- All tab transitions are smooth; no layout flicker

---

## Milestone 2 — Context Contract (🔴) + Guided Onboarding (🟡)
**Outcome:** Assistants become context-aware. Onboarding feels meaningfully different from generic Q&A.

### Context Contract (🔴)
- [ ] 🔴 Define versioned Context Schema:
  - `page`: url, title, route, section
  - `user`: id / anon_id, plan, role
  - `session`: id
- [ ] 🔴 Widget sends context payload with each message
- [ ] 🔴 Store context snapshots in conversation metadata
- [ ] 🔴 "Simulate context" in Studio Live Preview reads from this schema

### Guided Onboarding (🟡)
- [ ] 🟡 Onboarding flow config: steps + success criteria + "next action" per step
- [ ] 🟡 Progress tracking table (per user/session per assistant)
- [ ] 🟡 "Ask ≤2 clarifying questions" guardrail (system prompt v1)
- [ ] 🟡 Context-aware retrieval boosts (rule-based v1)

**Acceptance**
- Demo shows assistant adapting response to page context (not generic Q&A)
- Onboarding assistant uses curated system prompt to simulate guided, step-by-step flow

---

## Milestone 3 — KnowledgeOps MVP (🔴)
**Outcome:** Upload + manage knowledge with collections and retrieval scoping.

> **Sidebar Knowledge vs Studio Knowledge tab — read this before implementing either:**
>
> These are two different surfaces with different scopes and different purposes. Never mix them.
>
> | | Sidebar Knowledge (`/knowledge`) | Studio Knowledge tab |
> |---|---|---|
> | **Scope** | Org-wide | This assistant only |
> | **Purpose** | Create and manage content | Mount collections to this assistant |
> | **What you do here** | Upload docs, monitor sync jobs, create collections | Attach/detach collections, see mounted doc count |
> | **What you never do here** | Mount to a specific assistant | Upload docs, create collections, view sync jobs |
> | **Analogy** | The library | The assistant's reading list |
>
> **The flow is always one direction:**
> ```
> Sidebar Knowledge (create)  →  Studio Knowledge tab (mount)
> Upload docs                      Attach "Getting Started" collection
> Create "Getting Started"         Assistant can now only retrieve
> collection                       from mounted collections
> ```

### Sidebar Knowledge — Three Sub-pages

**1. Sources** (`/knowledge/sources`)
- [ ] 🔴 Source cards: connection status, last sync, docs count, chunks count, last error
- [ ] 🔴 Upload new documents (PDF / MD / TXT) — upload lives here, not in Studio
- [ ] 🔴 "Sync now" action per source
- [ ] 🔴 Error states are actionable: sync failed → show error detail + retry CTA

**2. Ingestion Jobs** (`/knowledge/jobs`)
- [ ] 🔴 CI-style job list: status chip (queued / running / failed / succeeded), duration, doc/chunk counts
- [ ] 🔴 Expandable error logs per job
- [ ] 🔴 Status chips animate on state transitions

**3. Collections** (`/knowledge/collections`)
- [ ] 🔴 Collections list: create, edit, delete collections
- [ ] 🔴 Add documents to a collection
- [ ] 🔴 See which assistants each collection is mounted to
- [ ] 🔴 "Mount to assistant" action from collection detail (convenience shortcut — mounting can also be done from Studio)
- [ ] 🔴 Retrieval enforcement: assistant only retrieves chunks from its mounted collections
- [ ] 🔴 New schema: `collections`, `collection_documents`, `assistant_collections`

### Connectors (Deferred to V3)
- [ ] 🟢 Notion connector
- [ ] 🟢 GitBook connector
- [ ] 🟢 Intercom / Zendesk articles
- [ ] 🟢 Confluence

**Acceptance**
- Demo: Upload docs in Sources → create collection in Collections → mount to assistant in Studio Knowledge tab → preview answer with scoped citations
- Retrieval is enforced: assistant only sees docs in its mounted collections
- Upload UI exists only in Sources — never in Studio
- Studio Knowledge tab shows empty state with link to `/knowledge/collections` when no collections exist

---

## Milestone 4 — Quality Cockpit + Trace Viewer Lite (🔴)
**Outcome:** "We can measure and debug AI quality — and prove the assistant behaved within its authorized boundaries" is visible and legible to operators.

> All trace data already exists in the events table. This milestone is primarily frontend + API aggregation.
> The Trace Viewer serves dual purpose: debugging tool for operators, and trust transparency surface. Design for both audiences.

### Org Dashboard (Control Tower)
- [ ] 🔴 Top KPI strip: conversations (7d), supported%, handoff%, feedback trend (👍/👎 ratio)
- [ ] 🔴 Assistants overview table: name, template, status chip, 7d conversations, supported%, handoff%
- [ ] 🔴 Needs Attention panel (right rail):
  - Failed sync jobs
  - Spike in UNSUPPORTED answers
  - Negative feedback spike
  - Stale sources (> configurable threshold)
- [ ] 🔴 Recent activity feed: latest conversations, ingestion jobs, config changes
- [ ] 🟡 Latency P50/P95 and token usage (BYOK transparency)

### Assistant Quality View (Operator View)
- [ ] 🔴 Supported / Partial / Unsupported distribution (chart)
- [ ] 🔴 Feedback trend over time
- [ ] 🔴 Handoff rate
- [ ] 🔴 Top queries list
- [ ] 🔴 Low-confidence queries — "gap list" for knowledge improvement
- [ ] 🟡 Most cited sources

### Conversations (`/quality/conversations`) — sub-page, NOT a nav item
- [ ] 🔴 Filterable conversation log: by assistant / date / grade / handoff status
- [ ] 🔴 One-click → Trace Viewer per message
- [ ] 🔴 Accessible from Quality page and Dashboard recent activity feed
- **Never** appears as a top-level sidebar nav item

### Trace Viewer Lite (per message — Trust Transparency Layer)
- [ ] 🔴 Timeline view: input + context snapshot → rewrite → retrieval → rerank → generation → grading
- [ ] 🔴 Retrieved chunks with similarity scores + rerank order
- [ ] 🔴 Final answer with grading label + confidence score
- [ ] 🔴 **Trust signal panel** — shows not just what happened, but what the assistant was authorized to do:
  - Delegation boundary applied (which config threshold was in effect)
  - Whether the answer was autonomous or would have triggered escalation
  - Guardrail events: PII scrubbed, injection blocked, persona boundary enforced
- [ ] 🔴 Handoff / action events (if triggered) — including whether confirmation was required and whether it was given
- [ ] 🔴 "Open trace" links from Live Preview (M1) and conversations list
- [ ] 🟡 "Replay with debug mode" option

**Acceptance**
- Demo: ask a question in Studio Live Preview → open trace → explain exactly why the answer is trusted or refused, and what boundary was applied
- Org dashboard loads with real metrics from seed data (M0)
- Trace viewer is legible to a non-technical operator, not just a developer

---

## Milestone 5 — Auth + Platform Security Baseline (🔴)
**Outcome:** Admin is secured. Platform feels production-grade and enterprise-credible.

### Admin Auth + RBAC
- [ ] 🔴 Supabase Auth (email/password or magic link)
- [ ] 🔴 Roles: owner / admin / viewer
- [ ] 🟡 Audit log of admin actions (surfaced in Dashboard recent activity)

### API Hardening
- [ ] 🔴 Assistant API keys (separate from BYOK model key)
- [ ] 🔴 Rate limiting per assistant + per IP (enhance existing throttler guard)
- [ ] 🔴 Widget domain allowlist + CORS controls
- [ ] 🟡 Webhook signing for n8n triggers

### BYOK Security
- [ ] 🔴 Encrypt stored model keys at rest
- [ ] 🔴 "Test key" UX with clear success/failure states + graceful error handling

**Acceptance**
- Admin requires login; role permissions enforced at route level
- Widget cannot spoof assistant/org identity
- Rate limiting and domain restrictions enforced
- BYOK key entry has explicit test + feedback before saving

---

## Milestone 6 — Integrations Surface + Agentic Rails (🟡)
**Outcome:** Integrations is a first-class product surface, not a buried config tab. Agentic actions are safe by design.

> Previously: Agentic Rails (M6). Expanded to match Integrations nav item from UI/UX Vision.

### Integrations Page (Org-level — configured here, referenced in Studio)
> This is where n8n is connected and workflows are registered. The Studio Handoff tab depends on this — it only selects from workflows registered here. Configure the connection once at org level; all assistants share it.

- [ ] 🟡 n8n connection: webhook URL input, test connection, connection status — **this is the only place webhook URL is configured**
- [ ] 🟡 Workflow list: registered workflows with name, status, last trigger timestamp
- [ ] 🟡 Webhook log: recent triggers, payloads, failure states
- [ ] 🟢 Connector marketplace placeholder (Notion, Slack, Zendesk — V3 roadmap)

### Agentic Rails *(Trust Architecture: Consent & Override)*
- [ ] 🟡 Action schema + per-assistant allowlist (set in Behavior tab delegation controls, M1)
- [ ] 🟡 **Confirmation UX** — not just a boolean gate, but a legible consent surface:
  - Show the user exactly what the assistant is about to do before execution (action type, affected resource, reversibility)
  - Allow modify, not just approve/reject (e.g. edit the ticket title before it's created)
  - Show confirmation result in conversation thread — user can see what was done and when
- [ ] 🟡 **Override capability** — user can cancel or undo an action after confirmation within a grace period (where technically reversible)
- [ ] 🟡 Demo actions:
  - Support: Create ticket via n8n (confirmation required)
  - Onboarding: Update onboarding checklist (confirmation required — DB write)
  - Docs: Generate code snippet (no confirmation — safe read-only)
- [ ] 🟡 Action events integrated into Trace Viewer trust signal panel (M4)

**Acceptance**
- Integrations is navigable from top-level nav with real connection status
- Confirmation UI shows what the assistant will do before execution, with modify option
- User can see a record of every action taken on their behalf in the conversation thread
- Action events are visible in the trace timeline trust signal panel

---

## Milestone 6.5 — Trust Architecture: Unified Control Layer (🟡)
**Outcome:** The scattered trust signals across the product are unified into a coherent system. RelayOS becomes the control plane for AI behavior in B2B workflows, not just a chat widget platform.

> This milestone doesn't build new infrastructure — it unifies what was built in M1, M4, and M6 into an intentional, legible system. It is primarily design + surface work.

### Operator Trust Dashboard (new section within Quality Cockpit)
- [ ] 🟡 Aggregate autonomous action log — across all conversations, not just per-message in trace: what did each assistant decide on its own, and what did it escalate?
- [ ] 🟡 Delegation boundary effectiveness metrics:
  - % of conversations where confidence threshold triggered escalation
  - % of action requests that required confirmation vs. executed autonomously
  - Refusal rate by topic / persona boundary
- [ ] 🟡 "Drift alerts" — notify operator when assistant behavior appears to be moving outside configured delegation boundaries (e.g. sudden drop in escalation rate, spike in low-confidence autonomous answers)

### End-User Trust Signals (widget-side)
- [ ] 🟡 Legible confidence framing in the widget — replace raw SUPPORTED/PARTIAL/UNSUPPORTED labels with user-facing language ("I'm confident in this answer" / "This is my best understanding — verify with your team")
- [ ] 🟡 Source transparency: citations are already shown; make them scannable and meaningful to non-technical users (document name + section, not just a URL)
- [ ] 🟡 Action receipt in conversation thread — after any confirmed action, show a compact, permanent record: "Ticket #1234 created · Feb 25 · You approved this"

### Delegation Control Surface Consolidation (Studio)
- [ ] 🟡 Audit the Studio tabs (M1) and ensure all delegation-related config lives in Behavior tab — no trust-relevant settings buried in Handoff, Persona, or elsewhere
- [ ] 🟡 Delegation config summary visible on Assistant Studio header — operator sees the autonomy level at a glance before making changes

**Acceptance**
- An operator can answer "what did this assistant decide on its own last week?" without opening individual traces
- An end-user can understand what the assistant did on their behalf and why, without any technical knowledge
- All delegation configuration for an assistant is findable in one place in Studio

---
## Milestone 7 — Demo World (🔴)
**Outcome:** A public "Acme SaaS" multi-context demo that tells the full product story in under 10 minutes.

- [ ] 🔴 Public demo site with 3 distinct assistants (different styling, behavior, persona)
- [ ] 🔴 Seed docs realistic enough to produce high-quality, citation-rich answers
- [ ] 🔴 Scripted demo path — 7 steps matching the UI/UX Vision "Best Demo" flow, extended with trust layer:
  1. Create 3 assistants from templates → note the Autonomy Level chip on each
  2. Connect knowledge source + sync
  3. Mount collections to assistants
  4. Ask Support question → citations + confidence badge + delegation boundary indicator
  5. Ask Onboarding question with context → guided step-by-step response
  6. Open Trace Viewer → show retrieval pipeline + grading + trust signal panel (what was the assistant authorized to do?)
  7. Trigger handoff action → confirmation UX → action receipt in thread → workflow event in trace
- [ ] 🟡 "Demo mode" toggle that highlights key features with contextual callouts

**Acceptance**
- A new person can complete the 7-step demo path without assistance
- Every step produces a visually impressive, explainable output

---

## Milestone 8 — Setup Wizard (🟡)
**Outcome:** First-run experience that accelerates time-to-value for new per-client deployments.

> Previously absent from roadmap. Specified in UI/UX Vision as "huge perceived value."

- [ ] 🟡 Step 1: Add BYOK model key → test connection → confirm
- [ ] 🟡 Step 2: Connect knowledge source (upload docs or connect Notion — Notion deferred to V3, upload available now)
- [ ] 🟡 Step 3: Create assistants from templates (pre-fills persona + behavior)
- [ ] 🟡 Step 4: Deploy widget → generates embed snippet
- [ ] 🟡 Step 5: Verify with Live Preview — ask a question, see a citation
- [ ] 🟢 Progress persistence: wizard state saved if user exits mid-flow

**Acceptance**
- New org can reach a working, deployed assistant in under 15 minutes
- Each wizard step has a clear success state before advancing

---

## Milestone 9 — White-label & Branding (🟢)
**Outcome:** RelayOS can be deployed as a branded product for per-client B2B deployments, with no code forks.

> Previously scattered as notes. Promoted to explicit milestone per UI/UX Vision.

- [ ] 🟢 Config-driven branding: logo, product name, primary color
- [ ] 🟢 Widget theme presets (light / dark / custom)
- [ ] 🟢 Feature flags: hide/show modules per deployment (e.g. hide Quality Cockpit for limited deployments)
- [ ] 🟢 White-label admin: remove RelayOS branding from admin UI when configured
- [ ] 🟢 Per-org branding config stored in org settings (not code)

**Acceptance**
- A new deployment can be fully rebranded via config with no code changes
- Feature flags correctly hide/show nav items and modules

---

## Recommended Build Order

```
M0 (nav + primitives + seed)
  ├── M1 (Assistant Studio — wow screen + delegation control surface)
  │     └── M3 (KnowledgeOps — upload + collections)
  │           └── M4 (Quality Cockpit + Trace Viewer — trust transparency)
  │                 └── M6 (Integrations + Agentic Rails — consent/override UX)
  │                       └── M6.5 (Trust Architecture — unify the layer)
  │                             └── M7 (Demo World — full story)
  └── M2 (Context Contract — after Studio works)

M5 (Auth — after demo is solid, before any external sharing)
M8 (Setup Wizard — after core product is stable)
M9 (White-label — per-client deployment phase)
```

---

## Notes / Guardrails
- Templates = presets, not hard limits. Always configurable.
- Never fork code for clients — use branding config + feature flags (M9)
- Keep core stable; every milestone must independently improve demo quality
- Connectors (Notion, GitBook, etc.) deferred to V3 — upload-only for V2 demo
- Micro-interactions (animations, toasts, skeleton loaders) are first-class acceptance criteria in M0 and M1, not afterthoughts
- The 7-step demo path (M7) is the forcing function for the whole roadmap — if a feature doesn't contribute to that path, it can wait
- **Trust Architecture principle:** every assistant deployment is implicitly a delegation decision. RelayOS makes those decisions explicit, configurable, and auditable. Trust signals (confidence, citations, action receipts, trace) are not debug features — they are product features. Design them for operators and end-users, not developers.
- **Architecture rules** (see `ARCHITECTURE.md`): sidebar is always org-scoped; Studio is the only assistant-scoped surface; Conversations lives under Quality not the sidebar; Events is not a nav item; n8n is configured in Integrations only — never in the Handoff tab.

*Last updated: March 4, 2026*