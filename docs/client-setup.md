# RelayOS Client Setup Guide

Quick onboarding guide for deploying RelayOS for a client.

## What You Need From the Client (5 minutes)

### Required

| Credential | Where to Get It | Example |
|------------|----------------|---------|
| **Database** | Supabase project or any PostgreSQL | `postgresql://user:pass@host:5432/db` |
| **LLM API Key** | OpenAI, Anthropic, or Google | `sk-...` or `sk-ant-...` |

### Optional

| Credential | Purpose | When Needed |
|------------|---------|-------------|
| **n8n Webhook URL** | Workflow automation | If client wants handoff/lead capture |
| **Custom Domain** | Branding | If not using subdomains |

---

## Deployment Options

### Option A: Using Client's Supabase (Recommended)

Best for clients who already have a Supabase project or want managed database.

```bash
# 1. Clone the repo
git clone <repo-url> && cd relayos

# 2. Copy environment template
cp .env.example .env

# 3. Fill in client credentials
# Edit .env with:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - LLM API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY)

# 4. Install and run
npm install
npm run dev
```

**Deploy to:**
- **Vercel** - Push to GitHub, connect to Vercel, add env vars
- **Railway** - `railway up` with env vars configured
- **Client's VPS** - Docker (see Option B)

---

### Option B: Docker (Self-Hosted)

Best for clients who want everything on their own infrastructure.

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Fill in client credentials in .env

# 3. Build and run
docker-compose up -d

# Access:
# - Admin: http://localhost:3000
# - API: http://localhost:3001
```

---

### Option C: Fully Self-Hosted (with bundled DB + n8n)

Best for clients who want zero external dependencies.

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Configure passwords in .env
# - POSTGRES_PASSWORD
# - N8N_PASSWORD

# 3. Run everything
docker-compose -f docker-compose.yml -f docker-compose.full.yml up -d

# Access:
# - Admin: http://localhost:3000
# - API: http://localhost:3001
# - n8n: http://localhost:5678
```

---

## Environment Variables Reference

### Database (One of these)

```bash
# Supabase (managed)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OR Direct PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/database
```

### LLM Provider (One of these)

```bash
# Optional: Explicitly set provider
LLM_PROVIDER=openai  # openai | anthropic | gemini

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o  # optional

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # optional

# Google (Gemini)
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-pro  # optional
```

### n8n Integration (Optional)

```bash
N8N_ENABLED=true
N8N_WEBHOOK_BASE_URL=https://n8n.client.com/webhook
N8N_API_KEY=  # if n8n requires auth
```

---

## Post-Setup Checklist

- [ ] API health check: `curl http://localhost:3001/health`
- [ ] Admin dashboard loads: `http://localhost:3000`
- [ ] Upload test document via admin
- [ ] Test chat in widget
- [ ] If n8n: Test handoff workflow

---

## Common Issues

### "No LLM API key found"
→ Add one of: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY`

### "Cannot connect to database" 
→ Check `SUPABASE_URL` or `DATABASE_URL` is correct and database is accessible

### "n8n webhook failed"
→ Verify `N8N_WEBHOOK_BASE_URL` is correct and n8n workflow is active

---

## Time Estimate

| Task | Time |
|------|------|
| Get credentials from client | 5 min |
| Clone + configure | 5 min |
| Deploy to Vercel/Railway | 10 min |
| Test + verify | 5 min |
| **Total** | **~25 min** |
