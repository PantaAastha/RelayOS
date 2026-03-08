# Navigation & Scope — Source of Truth

## Rules
- The admin is ORG-SCOPED by default. There is no "current assistant" 
  concept at the nav level.
- Assistant-scoped context only appears inside Studio 
  (/assistants/[id]) — a full-page experience, not a nav state change.
- Never scope the sidebar nav to a single assistant.

## Nav Items (exactly these six, in this order)
| Item         | Scope          | Route              | Notes |
|---|---|---|---|
| Dashboard    | Org            | /                  | Aggregate KPIs across all assistants |
| Assistants   | Org → Asst     | /assistants        | List = org; Studio = assistant-scoped full page |
| Knowledge    | Org            | /knowledge         | Sources, jobs, collections — org-wide |
| Quality      | Org → Asst     | /quality           | Org view default; drill to /quality/[id] |
| Integrations | Org            | /integrations      | n8n, webhooks — org-wide |
| Settings     | Org            | /settings          | BYOK, RBAC, branding — org-wide |

## Explicitly NOT in the nav
- Conversations — sub-page under /quality, not a nav item
- Events — accessible from Trace Viewer and Settings, not a nav item

## Studio is a full-page context switch
- Route: /assistants/[id]
- Has its own topbar (← Assistants, name, type chip, status, Save/Discard)
- The sidebar nav remains visible but the active item stays on Assistants
- No concept of "current assistant" persists when leaving Studio

----

# Widget Modes — Behavior Spec

---

## 1. Popup (Default)

### Core Mental Model
The most familiar chat pattern. Unobtrusive by default — the user is doing something else on the page and the assistant is available when needed, not demanding attention. Best for Support assistants.

---

### States

**Collapsed**
- A floating circular button anchored to the configured corner
- Shows the avatar icon + optional label ("Chat with us")
- Subtle hover state — slight scale up, shadow lift
- No animation in rest state — it should not compete with the page

**Opening**
- Clicks expand the chat panel with a smooth spring animation upward from the button
- Button transitions into the panel header (avatar + title visible at top)
- Animation should feel snappy, not sluggish — under 250ms

**Open**
- Panel: ~380px wide, ~560px tall
- Header: avatar + assistant title + close button
- Welcome message appears immediately (no loading state)
- Starter questions shown below welcome message, disappear after first user message
- Clicking outside does NOT close the panel — users lose context if it closes unexpectedly
- Close button (×) in header is the only way to collapse
- Conversation persists for the session — reopening shows history

**Closing**
- Panel collapses back to the button with a reverse spring animation
- History preserved — reopening picks up where the user left off

---

### Config Options (Widget tab)
- Position: bottom-right (default) / bottom-left
- Collapsed label: text label or icon-only
- Panel dimensions: standard only for now (custom sizing deferred)

### Mobile Behavior
- Expands to near full-screen (covers ~90% of viewport)
- Bottom sheet style with a drag handle at the top to dismiss
- Keyboard-aware — panel shifts up when soft keyboard opens

---

### What It Should Never Do
- Close when the user clicks outside the panel
- Reset conversation history between open/close cycles
- Show a notification badge unless there is a genuine proactive message (deferred)
- Auto-open without user intent

---

## 2. Side Panel

### Core Mental Model
The assistant becomes a co-pilot alongside the page content. The user can read the page and interact with the assistant simultaneously. Best for Docs assistants where responses are long, citation-heavy, and worth reading alongside the source material.

---

### States

**Trigger**
- A persistent narrow handle/tab on the right edge of the viewport (always visible)
- Shows a small icon + optional rotated label ("Ask a question")
- On hover: handle expands slightly to invite interaction
- The handle is always visible regardless of scroll position — it is fixed to the viewport edge

**Opening**
- Panel slides in from the right with a smooth ease-out transition (~300ms)
- Two behaviors based on config:
  - **Push** (default): page content shifts left to accommodate the panel — both are visible simultaneously
  - **Overlay**: panel slides over the page content, dimmed backdrop optional
- Panel appears full viewport height

**Open**
- Width: narrow ~340px / standard ~420px / wide ~520px (operator configured)
- Header: avatar + assistant title + close button (×)
- Welcome message and starters on first open
- Full conversation history scrollable
- Citations especially prominent — more vertical space means they can be expanded by default rather than collapsed
- The handle on the viewport edge transforms to a close affordance (← arrow or ×)

**Closing**
- Panel slides back out to the right
- Page content shifts back to full width (push mode) or backdrop lifts (overlay mode)
- History preserved for the session

---

### Config Options (Widget tab)
- Trigger: edge handle (default) / button (same as popup trigger style)
- Panel width: narrow / standard / wide
- Behavior: push content (default) / overlay

### Mobile Behavior
- Full screen takeover — same as Popup mobile behavior
- Bottom sheet style with drag-to-dismiss
- Push mode not applicable on mobile (no room to push)

---

### What It Should Never Do
- Open without a clear trigger affordance (the handle must always be visible)
- Use overlay mode by default — push is more honest about what's happening
- Close on outside click in overlay mode without confirming if a conversation is in progress

---

## 3. Floating Avatar

### Core Mental Model
Unlike Popup and Side Panel which are reactive (user initiates), Floating Avatar is a visible presence from page load. It has apparent agency. This means it must behave thoughtfully or it becomes annoying fast. Best for Onboarding assistants — a guide, not a support tool.

---

### States

**Idle**
- Avatar is visible on the page at all times
- Subtle breathing animation — slow scale pulse (98% → 100%)
- No bouncing, no flashing, no badges, no sound
- Draggable to any corner by the user — position persists for the session

**Proactive Nudge**
Triggered by page context, not a timer. Only fires when the operator has configured a message for the current page pattern.

- Small speech bubble attached to the avatar
- Appears once per session per page — never repeats
- Auto-dismisses after ~5 seconds if ignored
- User can manually dismiss it
- After dismissal → avatar returns to idle, no follow-up

**Example:** User lands on `/billing` → avatar shows *"Questions about your plan? I can help."*

**Active (chat open)**
- Clicking the avatar opens a compact chat panel anchored to the avatar
- Panel opens upward/inward depending on the avatar's corner position
- Avatar stays visible while panel is open, slightly dimmed
- Panel is intentionally compact — best for short guided exchanges
- "Expand" affordance transitions to a larger panel if the conversation needs more space

**Onboarding-aware** (when assistant type is Onboarding)
Driven by the context payload (page URL, onboarding step) sent with each message.

- Step entry → avatar shows: *"Let me know if you get stuck on this step"*
- User idles on a step longer than expected → single nudge: *"Need help with this one?"*
- Step completed → brief acknowledgment animation (small checkmark overlay or subtle wave)

---

### Config Options (Widget tab)
- Avatar image (upload) or emoji fallback
- Avatar size: medium / large
- Default corner: bottom-right / bottom-left / top-right / top-left
- Proactive messages: on/off + message per URL pattern
- Idle animation: on/off

### Mobile Behavior
- Avatar scales down slightly on mobile to avoid covering too much content
- Draggable behavior preserved
- Chat panel opens as a bottom sheet

---

### What It Should Never Be
- A mascot with expressions, moods, or complex character animations
- A notification system (no badges, no unread counts)
- Persistent or repetitive in its nudges — one nudge per page per session, maximum
- Blocking any primary page content or CTAs

---

## Shared Behavior Across All Modes

- **Conversation persistence** — history survives open/close cycles for the entire session
- **Starter questions** — shown on first open before any user message, hidden after first message sent
- **Streaming responses** — all modes stream tokens, never wait for full response
- **Citations** — always available, expand/collapse per message
- **Confidence badge** — always shown after response completes
- **Mobile** — all three modes collapse to a bottom sheet on viewports under 768px