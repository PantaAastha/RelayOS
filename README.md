# RelayOS

A multi-tenant support + sales copilot OS you can embed on any website (and later WhatsApp) to answer customer questions using approved company knowledge (RAG with citations) and run workflows via n8n.

## Project Structure

```
relayos/
├── apps/
│   ├── api/          # NestJS backend API
│   ├── widget/       # Embeddable React chat widget
│   └── admin/        # Next.js admin dashboard
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── db/           # Drizzle schema & migrations
│   ├── ui/           # Shared UI components
│   ├── eslint-config/
│   └── typescript-config/
└── n8n/              # n8n workflow exports
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm (comes with Node.js)
- Supabase project (for PostgreSQL + pgvector + Auth)

### Installation

```bash
# Install all dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Development

```bash
# Start all services in development mode
npm run dev

# Start just the API
npm run dev --filter=api

# Start just the widget
npm run dev --filter=@relayos/widget

# Start just the admin dashboard
npm run dev --filter=admin
```

### Database

```bash
# Generate migration from schema changes
npm run db:generate --filter=@relayos/db

# Push schema to database (dev only)
npm run db:push --filter=@relayos/db

# Run migrations (production)
npm run db:migrate --filter=@relayos/db
```

### Widget Embedding

Once built, embed the widget on any website:

```html
<script 
  src="https://your-cdn.com/relayos-widget.iife.js"
  data-api-url="https://api.relayos.com"
  data-tenant-id="your-tenant-id"
  data-primary-color="#2563eb"
  data-title="Chat with us"
></script>
```

Or initialize programmatically:

```javascript
window.RelayOS.init({
  apiUrl: 'https://api.relayos.com',
  tenantId: 'your-tenant-id',
  position: 'bottom-right',
  primaryColor: '#2563eb',
  title: 'Chat with us',
});

// Open/close programmatically
window.RelayOS.open();
window.RelayOS.close();
```

## Architecture

See [implementation_plan.md](./docs/implementation_plan.md) for full architecture details.

## License

Private - All rights reserved.
