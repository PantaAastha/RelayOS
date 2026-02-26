#!/usr/bin/env node

/**
 * RelayOS Demo Seed Script
 *
 * Creates a demo organization with 3 assistants, sample documents, and conversations.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env or .env.local.
 *
 * Usage:
 *   node scripts/seed-demo.mjs
 *   # or
 *   npm run seed
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
function loadEnv() {
    const envFiles = ['.env.local', '.env'];
    for (const file of envFiles) {
        try {
            const content = readFileSync(resolve(__dirname, '..', file), 'utf-8');
            for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const eqIndex = trimmed.indexOf('=');
                if (eqIndex === -1) continue;
                const key = trimmed.slice(0, eqIndex).trim();
                const value = trimmed.slice(eqIndex + 1).trim();
                if (!process.env[key]) process.env[key] = value;
            }
        } catch { /* skip if file doesn't exist */ }
    }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env / .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Seed Data ──────────────────────────────────────────────

const ORG = {
    name: 'Acme SaaS',
    slug: 'acme-saas',
};

const ASSISTANTS = [
    {
        name: 'Acme Support',
        slug: 'acme-support',
        assistant_type: 'reactive',
        welcome_message: 'Hey there! I\'m the Acme Support assistant. How can I help you today?',
        starter_questions: [
            { label: 'How do I reset my password?', message: 'How do I reset my password?' },
            { label: 'What are your pricing plans?', message: 'What are your pricing plans?' },
            { label: 'How do I contact billing?', message: 'How do I contact the billing team?' },
        ],
        persona: {
            name: 'Acme Support',
            tone: 'friendly, concise, helpful',
            voice: 'professional',
            boundaries: 'Only answer questions about Acme products. Do not provide legal or medical advice.',
            customInstructions: 'Always cite the relevant help article when possible.',
        },
        config: {
            widgetTitle: 'Acme Support',
            primaryColor: '#3ecf8e',
            welcomeMessage: 'Hey there! How can I help?',
        },
    },
    {
        name: 'Acme Developer Docs',
        slug: 'acme-dev-docs',
        assistant_type: 'reference',
        welcome_message: 'Welcome to Acme Developer Docs. Ask me about our API, SDKs, or integrations.',
        starter_questions: [
            { label: 'How do I authenticate API requests?', message: 'How do I authenticate API requests?' },
            { label: 'Show me a webhook example', message: 'Can you show me a webhook integration example?' },
            { label: 'What are the rate limits?', message: 'What are the API rate limits?' },
        ],
        persona: {
            name: 'Acme Docs',
            tone: 'precise, technical, example-heavy',
            voice: 'developer-friendly',
            boundaries: 'Focus on Acme API and technical docs. Do not answer general programming questions unrelated to Acme.',
            customInstructions: 'Include code snippets in answers whenever possible. Use markdown formatting.',
        },
        config: {
            widgetTitle: 'Acme Dev Docs',
            primaryColor: '#6366f1',
            welcomeMessage: 'Ask me about the Acme API',
        },
    },
    {
        name: 'Acme Onboarding',
        slug: 'acme-onboarding',
        assistant_type: 'guided',
        welcome_message: 'Welcome to Acme! I\'ll help you get set up step by step. Ready to start?',
        starter_questions: [
            { label: 'Let\'s get started!', message: 'Help me set up my Acme account' },
            { label: 'What should I do first?', message: 'What are the first steps to get started with Acme?' },
            { label: 'How do I invite my team?', message: 'How do I invite team members to my organization?' },
        ],
        persona: {
            name: 'Acme Onboarding Guide',
            tone: 'encouraging, patient, step-by-step',
            voice: 'warm and guiding',
            boundaries: 'Guide users through onboarding steps only. For support issues, redirect to the Support assistant.',
            customInstructions: 'Break down tasks into numbered steps. Ask ≤2 clarifying questions before proceeding. Celebrate progress.',
        },
        config: {
            widgetTitle: 'Getting Started',
            primaryColor: '#f59e0b',
            welcomeMessage: 'Let\'s get you set up!',
        },
    },
];

const SAMPLE_DOCS = [
    {
        title: 'Getting Started with Acme',
        content: `# Getting Started with Acme

Welcome to Acme! This guide will walk you through setting up your account and getting started with our platform.

## Step 1: Create Your Account
Visit app.acme.com/signup and enter your email address. You'll receive a confirmation email within 2 minutes.

## Step 2: Set Up Your Organization
After confirming your email, you'll be prompted to create your organization. Choose a name and invite your team members.

## Step 3: Connect Your First Integration
Navigate to Settings > Integrations and connect your preferred tools. We support Slack, GitHub, Jira, and 30+ others.

## Step 4: Configure Your First Workflow
Go to Workflows > Create New and use one of our templates to automate your first process.

## Need Help?
Contact support@acme.com or use the chat widget for instant answers.`,
        doc_type: 'article',
        assistantSlug: 'acme-support',
    },
    {
        title: 'Acme Pricing Plans',
        content: `# Acme Pricing Plans

## Free Tier
- Up to 3 users
- 1,000 API calls per month
- Community support
- Basic integrations

## Pro Plan — $29/user/month
- Unlimited API calls
- Priority support (< 4hr SLA)
- Advanced integrations
- Custom workflows
- SSO support

## Enterprise — Custom pricing
- Dedicated account manager
- Custom SLA
- On-premise deployment option
- Advanced security (SOC 2, HIPAA)
- Custom integrations

All plans include a 14-day free trial. No credit card required to start.

## Billing FAQ
- **How do I upgrade?** Go to Settings > Billing > Change Plan.
- **Can I get a refund?** Yes, within the first 30 days. Contact billing@acme.com.
- **Do you offer annual billing?** Yes, 20% discount for annual plans.`,
        doc_type: 'faq',
        assistantSlug: 'acme-support',
    },
    {
        title: 'Acme API Authentication',
        content: `# API Authentication

All Acme API requests require authentication using API keys.

## Getting Your API Key
1. Log into your Acme dashboard
2. Go to Settings > API Keys
3. Click "Generate New Key"
4. Copy and securely store your key

## Using the API Key

Include your key in the Authorization header:

\`\`\`bash
curl -X GET https://api.acme.com/v1/workflows \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"
\`\`\`

## SDK Authentication

\`\`\`javascript
const acme = new AcmeSDK({
  apiKey: process.env.ACME_API_KEY,
  environment: 'production' // or 'sandbox'
});
\`\`\`

## Rate Limits
- Free: 100 requests/minute
- Pro: 1,000 requests/minute
- Enterprise: 10,000 requests/minute

Exceeding rate limits returns HTTP 429. Implement exponential backoff.`,
        doc_type: 'article',
        assistantSlug: 'acme-dev-docs',
    },
    {
        title: 'Webhook Integration Guide',
        content: `# Webhooks

Acme sends real-time event notifications to your endpoints via webhooks.

## Setting Up Webhooks
1. Go to Settings > Webhooks
2. Click "Add Endpoint"
3. Enter your HTTPS URL
4. Select the events you want to receive
5. Click "Create"

## Event Types
- \`workflow.completed\` — A workflow run finished
- \`user.created\` — A new user was added to your org
- \`billing.invoice.paid\` — An invoice was paid
- \`integration.error\` — An integration encountered an error

## Payload Format

\`\`\`json
{
  "id": "evt_abc123",
  "type": "workflow.completed",
  "created_at": "2026-01-15T10:30:00Z",
  "data": {
    "workflow_id": "wf_xyz789",
    "status": "succeeded",
    "duration_ms": 1250
  }
}
\`\`\`

## Verifying Webhook Signatures
We sign all webhooks with HMAC-SHA256. Verify the \`X-Acme-Signature\` header:

\`\`\`javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');
const isValid = signature === req.headers['x-acme-signature'];
\`\`\``,
        doc_type: 'article',
        assistantSlug: 'acme-dev-docs',
    },
    {
        title: 'Onboarding Checklist',
        content: `# Your Acme Onboarding Checklist

Complete these steps to get the most out of Acme.

## Week 1: Setup
- [ ] Create your organization
- [ ] Invite at least 2 team members
- [ ] Connect Slack integration
- [ ] Set up your first workflow

## Week 2: Configure
- [ ] Customize your dashboard layout
- [ ] Set up notification preferences
- [ ] Create API keys for your dev team
- [ ] Configure SSO (Pro/Enterprise only)

## Week 3: Launch
- [ ] Run your first automated workflow
- [ ] Review the analytics dashboard
- [ ] Share results with your team
- [ ] Schedule a review call with your account manager

## Tips for Success
- Start with a template workflow — don't build from scratch
- Invite your whole team early to get buy-in
- Use the mobile app for on-the-go notifications
- Check the "What's New" section weekly for updates

Need help? Your onboarding guide is always available in the chat widget.`,
        doc_type: 'article',
        assistantSlug: 'acme-onboarding',
    },
];

const SAMPLE_CONVERSATIONS = [
    {
        assistantSlug: 'acme-support',
        messages: [
            { role: 'user', content: 'How do I reset my password?' },
            { role: 'assistant', content: 'To reset your password, go to app.acme.com/forgot-password and enter your email address. You\'ll receive a password reset link within 2 minutes. Click the link and set a new password.\n\nIf you don\'t see the email, check your spam folder or contact support@acme.com.' },
        ],
    },
    {
        assistantSlug: 'acme-dev-docs',
        messages: [
            { role: 'user', content: 'How do I authenticate API requests?' },
            { role: 'assistant', content: 'Include your API key in the Authorization header:\n\n```bash\ncurl -X GET https://api.acme.com/v1/workflows \\\n  -H "Authorization: Bearer YOUR_API_KEY"\n```\n\nYou can generate an API key in Settings > API Keys. Rate limits depend on your plan:\n- Free: 100 req/min\n- Pro: 1,000 req/min\n- Enterprise: 10,000 req/min' },
        ],
    },
    {
        assistantSlug: 'acme-onboarding',
        messages: [
            { role: 'user', content: 'Help me get started with Acme' },
            { role: 'assistant', content: 'Great, let\'s get you started! Here\'s what we\'ll do:\n\n**Step 1:** Set up your organization (you\'ve already done this! ✅)\n**Step 2:** Invite your team members — go to Settings > Team > Invite\n**Step 3:** Connect your first integration (I recommend Slack)\n\nWhich step would you like help with first?' },
        ],
    },
];

// ─── Seed Logic ──────────────────────────────────────────────

async function seed() {
    console.log('🌱 Starting RelayOS demo seed...\n');

    // 1. Clean existing demo data (idempotent)
    console.log('  Cleaning existing demo data...');
    const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', ORG.slug)
        .single();

    if (existingOrg) {
        // Get all assistants in this org
        const { data: existingAssistants } = await supabase
            .from('assistants')
            .select('id')
            .eq('organization_id', existingOrg.id);

        const assistantIds = (existingAssistants || []).map((a) => a.id);

        if (assistantIds.length > 0) {
            // Delete in order due to foreign keys
            await supabase.from('events').delete().in('assistant_id', assistantIds);

            // Get conversations
            const { data: convs } = await supabase
                .from('conversations')
                .select('id')
                .in('assistant_id', assistantIds);
            const convIds = (convs || []).map((c) => c.id);

            if (convIds.length > 0) {
                await supabase.from('messages').delete().in('conversation_id', convIds);
            }
            await supabase.from('conversations').delete().in('assistant_id', assistantIds);

            // Get documents
            const { data: docs } = await supabase
                .from('documents')
                .select('id')
                .in('assistant_id', assistantIds);
            const docIds = (docs || []).map((d) => d.id);

            if (docIds.length > 0) {
                await supabase.from('document_chunks').delete().in('document_id', docIds);
            }
            await supabase.from('documents').delete().in('assistant_id', assistantIds);
            await supabase.from('assistants').delete().in('id', assistantIds);
        }
        await supabase.from('organizations').delete().eq('id', existingOrg.id);
        console.log('  ✓ Cleaned previous demo data');
    }

    // 2. Create organization
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert(ORG)
        .select()
        .single();

    if (orgError) {
        console.error('❌ Failed to create organization:', orgError.message);
        process.exit(1);
    }
    console.log(`  ✓ Created org: ${org.name} (${org.id})`);

    // 3. Create assistants
    const assistantMap = {};
    for (const a of ASSISTANTS) {
        const { data: assistant, error } = await supabase
            .from('assistants')
            .insert({
                organization_id: org.id,
                name: a.name,
                slug: a.slug,
                assistant_type: a.assistant_type,
                welcome_message: a.welcome_message,
                starter_questions: a.starter_questions,
                persona: a.persona,
                config: a.config,
            })
            .select()
            .single();

        if (error) {
            console.error(`❌ Failed to create assistant "${a.name}":`, error.message);
            process.exit(1);
        }
        assistantMap[a.slug] = assistant;
        console.log(`  ✓ Created assistant: ${assistant.name} (${assistant.assistant_type}) → ${assistant.id}`);
    }

    // 4. Create sample documents
    for (const doc of SAMPLE_DOCS) {
        const assistant = assistantMap[doc.assistantSlug];
        const { error } = await supabase.from('documents').insert({
            assistant_id: assistant.id,
            title: doc.title,
            content: doc.content,
            doc_type: doc.doc_type,
        });
        if (error) {
            console.error(`❌ Failed to create doc "${doc.title}":`, error.message);
        } else {
            console.log(`  ✓ Created document: "${doc.title}" → ${assistant.name}`);
        }
    }

    // 5. Create sample conversations
    for (const conv of SAMPLE_CONVERSATIONS) {
        const assistant = assistantMap[conv.assistantSlug];
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({
                assistant_id: assistant.id,
                channel: 'web',
                status: 'active',
            })
            .select()
            .single();

        if (convError) {
            console.error(`❌ Failed to create conversation:`, convError.message);
            continue;
        }

        for (const msg of conv.messages) {
            await supabase.from('messages').insert({
                conversation_id: conversation.id,
                role: msg.role,
                content: msg.content,
            });
        }
        console.log(`  ✓ Created conversation (${conv.messages.length} msgs) → ${assistant.name}`);
    }

    // 6. Summary
    console.log('\n✅ Demo seed complete!\n');
    console.log('  Organization:', org.name);
    console.log('  Assistants:');
    for (const [slug, a] of Object.entries(assistantMap)) {
        console.log(`    • ${a.name} (${a.assistant_type}): ${a.id}`);
    }
    console.log('\n  Copy any assistant ID above and paste it into the Admin Dashboard to get started.');
    console.log('  Or set NEXT_PUBLIC_ASSISTANT_ID in your .env.local\n');
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
