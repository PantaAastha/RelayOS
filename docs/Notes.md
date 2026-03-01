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