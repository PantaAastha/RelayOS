# RelayOS: AI Chat for Internal Tools

A ready-to-deploy AI chat solution with RAG (Retrieval-Augmented Generation) for enterprise internal tools.

---

## What You Get

### Core Features ✅

| Feature | Details |
|---------|---------|
| **Embeddable Chat Widget** | Drop-in JavaScript widget for any web app |
| **Knowledge Base RAG** | Upload docs, PDFs, FAQs → AI answers using your data |
| **Multi-tenant** | One system, multiple clients/teams |
| **Conversation Memory** | Context-aware follow-up questions |
| **Admin Dashboard** | Upload docs, view conversations, monitor events |

### Production-Ready Guardrails ✅

| Guardrail | Benefit |
|-----------|---------|
| **Rate Limiting** | Prevent abuse (configurable per tenant) |
| **Error Boundaries** | Graceful fallbacks when AI is unavailable |
| **Event Logging** | Full audit trail for compliance |
| **Correlation IDs** | End-to-end request tracing |

---

## Integration Options

### Option 1: Embed the Widget (5 min setup)

```html
<script src="https://your-api.com/widget.js"></script>
<script>
  RelayWidget.init({
    apiUrl: 'https://your-api.com',
    tenantId: 'client-uuid-here',
    title: 'Ask anything',
    primaryColor: '#4f46e5'
  });
</script>
```

### Option 2: Direct API Integration

```bash
# Send a message
curl -X POST https://your-api.com/conversation/message \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"message": "How do I reset my password?"}'
```

---

## Setup for Client

### 1. Create Tenant
Each client/team gets their own isolated tenant ID.

### 2. Upload Knowledge Base
- PDF, DOCX, TXT, MD supported
- Drag-and-drop in Admin Dashboard
- Or batch upload via API

### 3. Embed Widget
Add the script to their internal tool. Done.

---

## Deployment

| Option | Best For | Effort |
|--------|----------|--------|
| **Railway/Render** | Quick start | 10 min |
| **Docker Compose** | Self-hosted | 30 min |
| **Kubernetes** | Enterprise scale | 2 hrs |

All require:
- PostgreSQL (with pgvector)
- LLM API key (Gemini, OpenAI, or Anthropic)

---

## Cost Estimate

| Component | Cost |
|-----------|------|
| Hosting (Railway) | ~$20/month |
| LLM API (Gemini) | ~$5-50/month based on usage |
| **Total** | **$25-70/month** for typical internal tool |

---

## Demo

**Admin Dashboard**: Manage documents, view conversations, monitor events  
**Chat Widget**: Embeddable AI assistant

Both are included and ready to customize.

---

## Next Steps

1. **Provide client's sample documents** → I'll configure the knowledge base
2. **Define branding** → Colors, logo, welcome message
3. **Choose deployment** → Cloud or self-hosted
4. **Go live** → Usually 1-2 days after requirements

---

## Questions?

- What internal tools do they want to add chat to?
- Do they have existing FAQs/documentation to upload?
- Any specific compliance requirements (data residency, SSO)?
