<!-- FILE: UI_UX_VISION.md -->
# RelayOS UI/UX Vision (Premium Product Spec)

## Design Goals
RelayOS should feel:
- **Cohesive** (everything has a place in the product spine)
- **Premium** (polished, modern, high trust)
- **Operational** (debuggable, measurable, controllable)
- **Fast to value** (setup wizard, templates, clear next steps)

## Information Architecture (Product Spine)
Left nav (org-scoped):
- **Dashboard**
- **Assistants**
- **Knowledge**
- **Quality**
- **Integrations**
- **Settings**

Single-org mode: org switcher hidden by default (for per-client deployments).

---

## Core Screens

## 1) Org Dashboard (Control Tower)
**Purpose:** “How are we doing?” and “What needs attention?”

### Top KPI strip
- Conversations (7d)
- Supported %
- Handoff %
- Feedback trend (👍/👎)
- (optional) Latency P95, token usage

### Assistants overview (table/cards)
- Assistant name + template
- Status (Live/Draft/Needs attention)
- 7d conversations
- Supported%
- Handoff%

### Needs Attention panel (right rail)
- Failed sync jobs
- Spike in UNSUPPORTED
- Negative feedback spike
- Stale sources (> X days)

### Recent activity
- latest conversations
- latest ingestion jobs
- config changes (audit-lite)

---

## 2) Assistants List
Cards or table with:
- Name + template chip (Support/Docs/Onboarding)
- Status chip
- Quick stats (7d conversations, supported%, handoff%)
- CTA: Open Studio

Empty state:
- “Create your first assistant” + 3 template buttons

---

## 3) Assistant Studio (The “wow” experience)
**Layout:** split view
- Left: tabs/config
- Right: Live Preview panel

### Tabs
1) Persona
- tone, boundaries, welcome message, starters
2) Behavior
- reactive/reference/guided
- onboarding step rules (guided)
3) Knowledge
- mounted collections + preview scope count
4) Handoff
- n8n workflow selector + triggers/thresholds
5) Widget Theme
- colors, title, icon, placement
6) Deploy
- embed snippet
- domain allowlist
- environment tips

### Live Preview
- streaming responses
- citations UI
- confidence indicator
- “simulate context” controls (url/section/user plan)
- “open trace” link after each response

---

## 4) Knowledge (Sources, Jobs, Collections)
### Sources page
- each source card:
  - connected status
  - last sync
  - docs/chunks count
  - errors (last failure)
  - sync now

### Ingestion Jobs page
- CI-like list with:
  - status
  - duration
  - counts
  - expandable logs/errors

### Collections page
- list + create + edit
- choose docs/pages (v1)
- later: rules-based

---

## 5) Quality Cockpit
### Org view
- supported/partial/unsupported distribution
- feedback trend
- handoff rate

### Assistant view
- same, plus:
  - top queries
  - low-confidence queries (gap list)
  - most cited sources

---

## 6) Trace Viewer Lite (Interview differentiator)
A timeline view for a single message:
- input + context snapshot
- rewrite output
- retrieved chunks (scores)
- rerank order
- final answer
- grading label + confidence
- handoff/action events (if any)

Design target: “LangSmith/Phoenix vibe” but simpler.

---

## Setup Wizard (First-run Experience)
For per-client deployments, this is huge perceived value.
Steps:
1) Add BYOK model key → test
2) Connect knowledge source (Notion) or upload docs
3) Create assistants from templates
4) Deploy widget
5) Verify with preview

---

## White-label / Branding
Config-driven (no code forks):
- logo
- product name
- primary color
- widget theme presets
- feature flags (hide modules if needed)

---

## UX Principles (Non-negotiable)
- Every page answers: “What do I do next?”
- Make failures actionable (sync failed → show error + retry)
- Show trust signals everywhere (citations + confidence + trace)
- No dead ends: empty states must include CTAs
- Performance: skeleton loading, optimistic updates where safe
- Accessibility: keyboard nav, contrast, readable typography

---

## Micro-interactions (Premium feel)
- Smooth panel transitions in Studio
- Streaming text + typing indicator
- Citation expand/collapse animation
- “Copied” toast for embed snippet
- Status chips animate on changes (Draft → Live)

---

## “Best Demo” Flow (what UI must support)
1) Create 3 assistants from templates
2) Connect Notion + sync
3) Mount collections to assistants
4) Ask Support question → citations + confidence
5) Ask Onboarding question with context → guided steps
6) Open trace viewer → show retrieval + grade
7) Trigger handoff action → show workflow + logs
