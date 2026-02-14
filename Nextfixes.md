We previously renamed the `tenants` table to `assistants`.

Currently, all dependent tables still use `tenant_id`, but this column now semantically refers to `assistants.id`.

We want to clean this up properly.

---

## Objective

Rename all dependent `tenant_id` columns to `assistant_id` across the system, while:

* Preserving data
* Avoiding downtime
* Maintaining backward compatibility temporarily
* Not changing business logic
* Not rewriting the RAG pipeline

---

## Required Changes

### 1️⃣ Database Migration

For each dependent table:

* conversations
* messages
* documents
* chunks
* events
* feedback
* grading
* any others referencing assistants

Perform:

1. Add new column `assistant_id`
2. Backfill: `assistant_id = tenant_id`
3. Add FK constraint to `assistants(id)` if missing
4. Add index on `assistant_id` if `tenant_id` had one
5. Keep `tenant_id` temporarily (do not drop yet)

---

### 2️⃣ Update Backend Code

* Replace all references to `tenant_id` in queries with `assistant_id`

* Update:

  * RAG search filters
  * hybrid_search RPC parameters
  * conversation creation
  * event logging
  * feedback storage
  * grading logic

* Accept both headers temporarily:

  * `X-Assistant-ID`
  * `X-Tenant-ID` (legacy)

Normalize internally to `assistantId`.

---

### 3️⃣ Update RPC Functions

Update any SQL functions (e.g., hybrid_search) to:

* Replace parameter name `tenant_id` → `assistant_id`
* Update WHERE filters accordingly

---

### 4️⃣ RLS Policies

Update RLS policies to:

* Scope by `assistant_id` instead of `tenant_id`

Do NOT introduce organization-level isolation in this migration.

---

### 5️⃣ Cleanup Phase (after verification)

After confirming system works:

* Drop old `tenant_id` columns
* Remove legacy header support
* Remove any fallback logic

---

## Constraints

* PostgreSQL (Supabase)
* RLS enabled
* Production-safe
* No breaking API responses
* No schema redesign

---

## Deliverables

Provide:

* SQL migration file
* Updated RPC definitions
* List of backend files modified
* Any risks to validate before dropping old columns
