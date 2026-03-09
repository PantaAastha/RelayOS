<!-- FILE: KNOWLEDGE_PIPELINE.md -->
# RelayOS Knowledge Pipeline (Sources → Collections → Retrieval)

## Why this exists
RelayOS should **connect to where knowledge already lives** (Notion, GitBook, etc.) and also support **uploads**.
The goal is not to replace a KB, but to provide a **sync + retrieval + trust + observability layer**.

---

## Core Concepts

### 1) Source (Org-level)
A Source is a connected knowledge system or upload bucket.
Examples:
- Notion workspace (connected once per org)
- GitBook space
- Uploads (PDF/MD/TXT)

**Source responsibilities**
- connection credentials
- sync configuration
- ingestion job tracking
- canonical link back to source-of-truth

### 2) Document (Normalized)
Everything becomes a Document in RelayOS with standard metadata:
- title
- url (source-of-truth link)
- updated_at, author (if available)
- tags
- visibility hint (public/internal)

### 3) Chunk (Index unit)
Documents are chunked into retrievable chunks with metadata:
- doc_id
- section headers / hierarchy
- chunk_text
- embedding vector
- keyword index
- recency signals

### 4) Collection (Reusable subset)
Collections are curated subsets of docs/pages (or filters) used to scope assistants.
Examples:
- “Public Help Docs”
- “API Developer Docs”
- “Onboarding / Getting Started”

### 5) Assistant Mount
Assistants don’t connect to sources directly.
Assistants mount one or more Collections.

This gives:
- clean boundaries (support assistant can’t see internal docs)
- clear analytics per assistant
- zero duplicate ingestion

---
- **Details**
    
    ### Ingestion Pipeline (Org-level)
    
    ### Step 1: Connect
    
    - store org connector config (OAuth tokens / API key)
    - validate access
    - log source.created event
    
    ### Step 2: Select
    
    - user selects pages/spaces/folders/databases
    - store selection rules (ids + filters)
    
    ### Step 3: Sync (Job-based)
    
    Each sync creates an ingestion job:
    
    - status: queued/running/failed/succeeded
    - started_at, completed_at
    - errors (structured)
    - counts: docs processed, chunks created
    
    ### Step 4: Normalize + Chunk
    
    - extract text
    - preserve hierarchy (page title → headings)
    - chunk with consistent boundaries
    - enrich chunk metadata:
        - doc_type, section, updated_at, tags
    
    ### Step 5: Index
    
    - store embedding vectors
    - store keyword index
    - update recency signals
    
    ### **Assistant Scoping (Collections + Mounts)**
    
    **Recommended Tables (conceptual)**
    
    - sources(org_id, type, config, last_sync_at, status)
    - documents(org_id, source_id, external_id, title, url, updated_at, tags)
    - chunks(org_id, doc_id, text, embedding, section, metadata)
    - collections(org_id, name, rules_json)
    - collection_documents(collection_id, doc_id)
    - assistant_collections(assistant_id, collection_id)
    
    **Retrieval Enforcement Rule**
    
    At query time:
    
    - determine assistant_id
    - load mounted collections → allowed doc_ids (or filter rules)
    - retrieval must **only** return chunks within allowed scope
    
    This is the key to keeping multiple assistants sane.
    
    ### **Retrieval Pipeline (RAG) with Context**
    
    ### Inputs
    
    - user message
    - assistant_id
    - context payload (page/user/session/onboarding_state)
    
    ### Steps
    
    1. Query rewrite (skip greetings)
    2. Query classification (factual/procedural/troubleshooting)
    3. Retrieval (hybrid: vector + keyword)
    4. Scope filter (assistant collections)
    5. Rerank (LLM)
    6. Generate answer with citations
    7. Grade answer (SUPPORTED/PARTIAL/UNSUPPORTED)
    8. Emit trace + events
    
    ### Outputs
    
    - answer text
    - citations (doc url + snippet)
    - confidence score
    - grading label
    - trace id
    
    ### **KnowledgeOps UX (what the Admin should expose)**
    
    ### Sources page
    
    - status (connected/error)
    - last sync time
    - docs count + chunks count
    - “sync now” button
    - error logs for last failure
    
    ### Ingestion Jobs page
    
    - job list with status + duration
    - expandable error details
    - per-source filtering
    
    ### Collection editor
    
    - create collection
    - pick docs/pages (v1)
    - later: rules-based (tags, path, recency)
    
    ### Mounting UX (Assistant Studio)
    
    - attach collections to assistant
    - preview retrieval scope (“this assistant can see X docs”)
    
    ### **Security + Permissions Notes**
    
    - Notion integration itself only sees pages shared with it (outer boundary).
    - RelayOS still must enforce:
        - assistant scoping via collections
        - org scoping for all data
        - no spoofable assistant ids from clients (validate server-side)
    - For per-client deployments, org isolation is by deployment, but assistant boundaries still matter.
    
    ### Recommended Events (for observability)
    
    - source.connected
    - source.sync.started / completed / failed
    - ingestion.job.started / completed / failed
    - document.upserted
    - chunk.created
    - collection.updated
    - assistant.mounted_collection
    - rag.rewrite / rag.search / rag.rerank / rag.answer / rag.graded

---
# M3 — KnowledgeOps UX Spec

> **Status:** UI partially built. Structure is wrong — see Current State vs Correct Behavior below.
> **Route:** `/knowledge`
> **Scope:** Org-wide. Never scoped to a single assistant.
> **Goal:** Upload and manage content in Sources, monitor processing in Ingestion Jobs, group content into Collections, then mount Collections to assistants in Studio.

---

## Current State vs Correct Behavior

| Issue | Current | Correct |
|---|---|---|
| Sources shows document rows | Table of individual docs scoped to assistant | Source cards (upload source, future: Notion, Confluence) |
| Upload is a separate route | `/knowledge/upload` — breaks tab context | Drawer/slide-over on top of Sources |
| Collections create form | Inline above empty state — two competing elements | Right drawer, empty state hides when drawer opens |
| No connecting flow | Three tabs feel unrelated | Toast + badge + contextual nudge connects the steps |
| Invalid Date / missing fields | Backend not returning type, chunks, date | Fix data fields before UI polish |
| Documents scoped to assistant | "Acme Support" in Source column | Org-scoped — all docs regardless of assistant |

---

## The Flow (Must Feel Connected)

```
Sources tab
  → Click "Upload Documents"
  → Upload drawer opens (over Sources, tab bar stays visible)
  → Submit → drawer closes
  → Toast: "Processing started — view progress in Ingestion Jobs →"
  → Ingestion Jobs tab badge shows 1 running job
  → Job completes → Sources doc list updates (chunks count fills in)
  → Inline nudge on doc row: "Add to a collection →"
  → Collections tab → create collection → add doc → mount to assistant
```

Every step should point naturally to the next one. No dead ends, no manual tab hunting.

---

## Tab 1 — Sources (`/knowledge/sources`)

### Page header
```
Knowledge Library    [Organization chip]

[Sources] [Ingestion Jobs] [Collections]          [Upload Documents]
```

### Two-level structure

**Level 1 — Source cards** (what you see on load)

One card per source type. For now, only File Upload exists. Future: Notion, Confluence, GitBook.

```
┌─────────────────────────────────────────────────────┐
│  📄 File Upload                          ● Active   │
│                                                      │
│  12 documents · 847 chunks                          │
│  Last upload: 2 hours ago                           │
│  No errors                                          │
│                                    [Sync Now]       │
└─────────────────────────────────────────────────────┘
```

Each card shows:
- Source type icon + name
- Status chip: Active / Error / Syncing
- Doc count + chunk count
- Last sync timestamp
- Last error (if any) — actionable: "Sync failed: invalid PDF · [Retry]"
- Sync Now button

**Level 2 — Document list** (click into a source card)

Breadcrumb: `Knowledge / File Upload`

Table columns: Title | Type | Chunks | Collections | Added
- Type: the document type tag (General / FAQ / Changelog etc.)
- Chunks: number — shows "Processing..." if ingestion running
- Collections: chips showing which collections this doc belongs to (or "None")
- Added: formatted date — never "Invalid Date"

Row actions (⋯ overflow):
- Add to collection
- Re-process
- Delete

**Inline nudge on rows with no collection:**
A subtle amber indicator on the Collections cell: "Not in any collection — this doc won't be retrieved by any assistant. [Add →]"

---

## Upload Drawer (not a separate route)

Triggered by "Upload Documents" button. Opens as a right drawer over the Sources page. Tab bar remains visible. URL does not change.

```
Upload Documents                              [×]
─────────────────────────────────────────────────
[File Upload]  [Paste Text]

┌─────────────────────────────────────────┐
│                                         │
│     Drop files here or click to browse │
│     .pdf .docx .txt .md · Max 10MB     │
│                                         │
└─────────────────────────────────────────┘

Document Type    [General ▾]

[Upload 2 Files]   [Cancel]
```

On submit:
- Drawer closes
- Toast appears: "2 files uploaded — processing started. [View Jobs →]"
- Ingestion Jobs tab shows a badge with running job count

---

## Tab 2 — Ingestion Jobs (`/knowledge/jobs`)

### Page header
```
Knowledge Library    [Organization chip]

[Sources] [Ingestion Jobs •2] [Collections]
```
Badge on tab shows count of running jobs. Clears when all complete.

### Job list (CI-style)

Each row:
```
● Running   ChatGPT Usage and Top Use Cases     Acme Support   —     Started 2m ago
✓ Succeeded Onboarding Guide v2                 File Upload    1m2s  847 chunks · Mar 9
✗ Failed    Pricing Page PDF                    File Upload    0m8s  Error: corrupted PDF [Retry]
```

Columns: Status chip | Document title | Source | Duration | Result / Error

**Status chips with animated states:**
- `● Running` — pulsing dot, mint
- `✓ Succeeded` — static, green
- `✗ Failed` — static, red + Retry CTA

**Expandable error logs:**
Click a failed row → expands inline with the full error log output (monospace, dark background). Copy button top-right of the log.

**Empty state:**
"No ingestion jobs yet. Upload documents in Sources to get started. [Go to Sources →]"

---

## Tab 3 — Collections (`/knowledge/collections`)

### Page header
```
Knowledge Library    [Organization chip]

[Sources] [Ingestion Jobs] [Collections]       [+ Create Collection]
```

### Collection cards (grid, 3 columns)

```
┌────────────────────────────────────┐
│  Getting Started                   │
│                                    │
│  3 documents · 212 chunks          │
│  Mounted to: Acme Support          │
│                 Acme Onboarding    │
│                                    │
│  [View Documents]    [⋯]           │
└────────────────────────────────────┘
```

Each card shows:
- Collection name
- Document count + chunk count
- "Mounted to:" list of assistants using this collection (or "Not mounted to any assistant" in amber)
- View Documents CTA
- ⋯ overflow: Edit name, Delete

**"Not mounted" indicator:**
Collections that exist but aren't mounted to any assistant are silently wasted. Show a subtle amber nudge: "Not mounted to any assistant — [Mount in Studio →]"

### Create Collection drawer (right drawer, not inline form)

Triggered by "+ Create Collection". Opens from the right. Empty state disappears when drawer is open.

```
Create Collection                             [×]
──────────────────────────────────────────────────
Collection Name
[e.g. Getting Started Guide          ]

Description (optional)
[                                    ]

[Create Collection]   [Cancel]
```

After creation → drawer closes → new collection card appears in grid → immediately open the "Add Documents" flow for that collection.

### Collection detail (`/knowledge/collections/[id]`)

Click "View Documents" on a card → navigates to detail page.

```
← Collections    Getting Started         [+ Add Documents]

Documents (3)
──────────────────────────────────────────────────────
Title                    Type       Chunks    Added
Onboarding Guide v2      General    847       Mar 9
Welcome Email Template   FAQ        23        Mar 7
Setup Checklist          General    41        Mar 7

Mounted to
──────────────────────────────────────────
● Acme Support                [Unmount]
● Acme Onboarding             [Unmount]
  + Mount to another assistant [Mount in Studio →]
```

"+ Add Documents" opens a drawer with a searchable list of all org documents to select from.

---

## Connecting States — Toasts and Nudges

These are what make the three tabs feel like one flow rather than three isolated pages.

| Trigger | Toast / Nudge |
|---|---|
| Upload submitted | "2 files uploading — [View Jobs →]" (persists until jobs complete) |
| Job succeeds | "Processing complete — 847 chunks indexed. [View in Sources →]" |
| Job fails | "Processing failed for [filename]. [View error →]" |
| Doc has no collection | Amber cell: "Not in any collection [Add →]" |
| Collection not mounted | Amber card nudge: "Not mounted to any assistant [Mount in Studio →]" |
| Collection mounted in Studio | Card updates: "Mounted to: [Assistant name]" |

---

## Empty States

| Surface | Empty state | CTA |
|---|---|---|
| Sources (no uploads yet) | "No documents yet. Upload your first document to get started." | [Upload Documents] |
| Ingestion Jobs (no jobs) | "No ingestion jobs yet. Upload documents in Sources to get started." | [Go to Sources →] |
| Collections (no collections) | "No collections yet. Group documents to make them available to assistants." | [Create Collection] |
| Collection detail (no docs) | "This collection is empty. Add documents to start using it." | [Add Documents] |

---

## What Does NOT Live Here

| Feature | Where it lives |
|---|---|
| Mounting a collection to an assistant | Studio → Knowledge tab |
| Viewing which assistant retrieved a document | Trace Viewer |
| Per-assistant document filtering | Studio → Knowledge tab |
| Connector setup (Notion, Confluence) | Deferred to V3 |

---

## Definition of Done

- [ ] Sources shows source cards, not a flat document table
- [ ] Clicking a source card drills into its document list
- [ ] Upload is a drawer — no `/knowledge/upload` route
- [ ] Document rows show Type, Chunks (not —), and formatted date (not "Invalid Date")
- [ ] Documents with no collection show amber nudge
- [ ] Ingestion Jobs tab shows a badge when jobs are running
- [ ] Job rows are expandable with error logs for failed jobs
- [ ] Collections uses a right drawer for create, not an inline form
- [ ] Collections not mounted to any assistant show amber nudge
- [ ] Every empty state has a CTA pointing to the next step
- [ ] Toast flow connects Upload → Jobs → Sources → Collections