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