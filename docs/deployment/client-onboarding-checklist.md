# Client Onboarding Checklist

Use this checklist when onboarding a new client to RelayOS.

---

## Required From Client

### 1. Database Access

Choose one:

- [ ] **Supabase** (Recommended)
  - [ ] Supabase project URL (`https://xxx.supabase.co`)
  - [ ] Service Role Key (NOT anon key)
  - [ ] Confirm pgvector extension is enabled

- [ ] **Self-Hosted PostgreSQL**
  - [ ] Connection string (`postgresql://user:pass@host:5432/db`)
  - [ ] Confirm PostgreSQL 15+ with pgvector installed

### 2. LLM API Key

Choose one:

- [ ] **OpenAI** - API key (`sk-...`)
- [ ] **Anthropic** - API key (`sk-ant-...`)  
- [ ] **Google** - API key for Gemini

### 3. Knowledge Base Content

- [ ] Documents to upload (PDF, DOCX, TXT, MD)
- [ ] FAQ/help center content
- [ ] Product catalogs (if applicable)

---

## Optional From Client

### 4. n8n Workflow Automation

If client wants handoff/escalation to humans or CRM integration:

- [ ] n8n instance URL (`https://n8n.client.com`)
- [ ] Webhook endpoints for:
  - [ ] Handoff requests
  - [ ] Lead capture
  - [ ] Custom workflows

### 5. CRM/Support Integration Targets

- [ ] Slack webhook URL
- [ ] Zendesk API credentials
- [ ] HubSpot API key
- [ ] Custom CRM webhook

### 6. Custom Domain

- [ ] Admin dashboard domain (e.g., `admin.client.com`)
- [ ] API domain (e.g., `api.client.com`)
- [ ] SSL certificates (or will use Let's Encrypt)

---

## Pre-Deployment Verification

Before going live, verify:

- [ ] API health check passes: `curl https://api.client.com/health`
- [ ] Admin dashboard loads
- [ ] At least one document uploaded
- [ ] Test conversation works in widget
- [ ] Citations appear when relevant
- [ ] "I don't know" response for out-of-scope questions
- [ ] Handoff flow works (if n8n enabled)

---

## Post-Deployment Handover

- [ ] Share admin dashboard URL and credentials
- [ ] Explain document upload process
- [ ] Demo the chat widget
- [ ] Configure widget on client's website
- [ ] Set up monitoring/alerts (optional)
- [ ] Schedule check-in for first week
