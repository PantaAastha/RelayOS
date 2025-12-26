// RelayOS Database Schema
// Using Drizzle for migrations only, Supabase client for queries

import { pgTable, uuid, text, timestamp, jsonb, integer, serial, vector, index } from 'drizzle-orm/pg-core';

// Multi-tenancy
export const tenants = pgTable('tenants', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    config: jsonb('config').default({}).$type<{
        widgetTitle?: string;
        primaryColor?: string;
        welcomeMessage?: string;
        escalationEnabled?: boolean;
    }>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Conversations
export const conversations = pgTable('conversations', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    externalId: text('external_id'),
    channel: text('channel').notNull().default('web'), // web, whatsapp, api
    status: text('status').notNull().default('active'), // active, handed_off, closed
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
    index('idx_conversations_tenant').on(table.tenantId),
    index('idx_conversations_status').on(table.status),
]);

// Messages
export const messages = pgTable('messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id').references(() => conversations.id),
    role: text('role').notNull(), // user, assistant, system
    content: text('content').notNull(),
    citations: jsonb('citations').default([]).$type<Array<{
        docId: string;
        chunkId: string;
        text: string;
        sourceUrl?: string;
    }>>(),
    toolCalls: jsonb('tool_calls').default([]),
    tokensUsed: integer('tokens_used'),
    model: text('model'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
    index('idx_messages_conversation').on(table.conversationId),
]);

// Knowledge base documents
export const documents = pgTable('documents', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    title: text('title').notNull(),
    content: text('content').notNull(),
    sourceUrl: text('source_url'),
    docType: text('doc_type').default('faq'), // faq, article, policy, product
    version: integer('version').default(1),
    status: text('status').default('active'), // active, archived
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
    index('idx_documents_tenant').on(table.tenantId),
    index('idx_documents_status').on(table.status),
]);

// Document chunks with embeddings (pgvector)
export const documentChunks = pgTable('document_chunks', {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id').references(() => documents.id),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }), // OpenAI text-embedding-3-small
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
    index('idx_chunks_document').on(table.documentId),
    // Vector index created separately via raw SQL for ivfflat
]);

// Append-only event log (THE CORE OF "OS")
export const events = pgTable('events', {
    id: serial('id').primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    conversationId: uuid('conversation_id').references(() => conversations.id),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
    index('idx_events_tenant').on(table.tenantId),
    index('idx_events_conversation').on(table.conversationId),
    index('idx_events_type').on(table.eventType),
    index('idx_events_created').on(table.createdAt),
]);
