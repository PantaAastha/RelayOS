# RelayOS Deployment Guide

Comprehensive guide for deploying RelayOS to production.

## Table of Contents

- [Quick Start](#quick-start)
- [Deployment Options](#deployment-options)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [SSL/TLS Setup](#ssltls-setup)
- [Backup & Restore](#backup--restore)
- [Upgrade & Rollback](#upgrade--rollback)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# 1. Clone and configure
git clone <repo-url> && cd relayos
cp .env.example .env
# Edit .env with your credentials

# 2. Build and run
docker compose up -d

# 3. Verify
curl http://localhost:3001/health
# Open http://localhost:3000 for admin dashboard
```

---

## Deployment Options

| Option | Best For | Includes |
|--------|----------|----------|
| **BYOK** (`docker-compose.yml`) | Clients with own Supabase/DB | API + Admin only |
| **Full Stack** (`docker-compose.full.yml`) | Zero dependencies | API + Admin + PostgreSQL + n8n |

---

## Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum (4GB recommended)
- 10GB disk space

### Option 1: BYOK (Bring Your Own Keys)

Client provides their own Supabase/PostgreSQL and LLM API key.

```bash
# Configure environment
cp .env.example .env
nano .env  # Add SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY

# Build and start
docker compose build
docker compose up -d

# Check status
docker compose ps
docker compose logs -f api
```

**Ports:**
- `3000` - Admin Dashboard
- `3001` - API Server

### Option 2: Full Stack (Self-Hosted)

Everything bundled including PostgreSQL and n8n.

```bash
# Configure environment
cp .env.example .env
nano .env  # Set passwords: POSTGRES_PASSWORD, N8N_PASSWORD

# Build and start with full stack
docker compose -f docker-compose.yml -f docker-compose.full.yml build
docker compose -f docker-compose.yml -f docker-compose.full.yml up -d

# Check status
docker compose -f docker-compose.yml -f docker-compose.full.yml ps
```

**Ports:**
- `3000` - Admin Dashboard  
- `3001` - API Server
- `5432` - PostgreSQL
- `5678` - n8n Workflow Editor

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (NOT anon key) | `eyJ...` |
| `LLM_PROVIDER` | AI provider: `openai`, `anthropic`, or `gemini` | `openai` |

### LLM Provider Keys (one required)

| Variable | Provider |
|----------|----------|
| `OPENAI_API_KEY` | OpenAI (GPT-4) |
| `ANTHROPIC_API_KEY` | Anthropic (Claude) |
| `GOOGLE_API_KEY` | Google (Gemini) |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `3001` | API server port |
| `N8N_ENABLED` | `false` | Enable n8n integration |
| `N8N_WEBHOOK_BASE_URL` | - | Client's n8n webhook URL |
| `OPENAI_MODEL` | `gpt-4o` | OpenAI model to use |
| `ANTHROPIC_MODEL` | `claude-3-5-sonnet-20241022` | Claude model to use |

### Full Stack Only

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `relayos` | App database user |
| `POSTGRES_PASSWORD` | `relayos_secret` | App database password |
| `POSTGRES_DB` | `relayos` | App database name |
| `N8N_USER` | `admin` | n8n login username |
| `N8N_PASSWORD` | `changeme` | n8n login password |

---

## SSL/TLS Setup

### Using a Reverse Proxy (Recommended)

Put RelayOS behind Nginx or Traefik with SSL termination.

**Nginx example:**

```nginx
server {
    listen 443 ssl;
    server_name app.example.com;
    
    ssl_certificate /etc/ssl/certs/app.example.com.crt;
    ssl_certificate_key /etc/ssl/private/app.example.com.key;
    
    # Admin Dashboard
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl;
    server_name api.example.com;
    
    ssl_certificate /etc/ssl/certs/api.example.com.crt;
    ssl_certificate_key /etc/ssl/private/api.example.com.key;
    
    # API Server
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Update Environment for HTTPS

```bash
# In .env
API_URL=https://api.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
```

---

## Backup & Restore

### Backup PostgreSQL (Full Stack)

```bash
# Create backup
docker compose -f docker-compose.yml -f docker-compose.full.yml exec postgres \
  pg_dump -U relayos relayos > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup n8n database
docker compose -f docker-compose.yml -f docker-compose.full.yml exec n8n-postgres \
  pg_dump -U n8n n8n > n8n_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore PostgreSQL

```bash
# Stop the API first
docker compose stop api admin

# Restore
cat backup_20260107_120000.sql | docker compose exec -T postgres \
  psql -U relayos relayos

# Restart services
docker compose up -d
```

### Backup Supabase (BYOK)

Use Supabase dashboard → Settings → Database → Backups, or:

```bash
# Using pg_dump with Supabase connection string
pg_dump "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  > supabase_backup_$(date +%Y%m%d).sql
```

---

## Upgrade & Rollback

### Upgrade to New Version

```bash
# 1. Pull latest code
git pull origin main

# 2. Backup current state (recommended)
docker compose exec postgres pg_dump -U relayos relayos > pre_upgrade_backup.sql

# 3. Rebuild and restart
docker compose build --no-cache
docker compose up -d

# 4. Verify health
curl http://localhost:3001/health
```

### Rollback

```bash
# 1. Checkout previous version
git checkout <previous-tag-or-commit>

# 2. Rebuild
docker compose build --no-cache
docker compose up -d

# 3. If needed, restore database
cat pre_upgrade_backup.sql | docker compose exec -T postgres psql -U relayos relayos
```

---

## Troubleshooting

### API Won't Start

```bash
# Check logs
docker compose logs api

# Common causes:
# - Missing environment variables
# - Database connection failed
# - Port 3001 already in use
```

### "No LLM API key found"

Add one of these to `.env`:
- `OPENAI_API_KEY=sk-...`
- `ANTHROPIC_API_KEY=sk-ant-...`
- `GOOGLE_API_KEY=...`

### "Cannot connect to database"

```bash
# Check if postgres is running (full stack)
docker compose ps postgres

# Test connection
docker compose exec postgres psql -U relayos -c "SELECT 1"

# If using Supabase, verify URL and key in .env
```

### "n8n webhook failed"

1. Verify n8n is running: `docker compose ps n8n`
2. Check webhook URL in `.env`
3. Ensure workflow is activated in n8n dashboard

### Container Uses Too Much Memory

Add resource limits to docker-compose.yml:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1G
```

### Health Check Fails

```bash
# Manual health check
curl http://localhost:3001/health

# Should return:
# {"status":"ok","timestamp":"...","version":"0.0.1"}
```

---

## Support

For issues not covered here, check the logs:

```bash
# All services
docker compose logs

# Specific service
docker compose logs api --tail 100 -f
```
