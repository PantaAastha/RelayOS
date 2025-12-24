// Core conversation types for RelayOS

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    config: TenantConfig;
    createdAt: Date;
    updatedAt: Date;
}

export interface TenantConfig {
    widgetTitle?: string;
    primaryColor?: string;
    welcomeMessage?: string;
    escalationEnabled?: boolean;
}

export interface Conversation {
    id: string;
    tenantId: string;
    externalId: string | null;
    channel: ConversationChannel;
    status: ConversationStatus;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export type ConversationChannel = 'web' | 'whatsapp' | 'api';
export type ConversationStatus = 'active' | 'handed_off' | 'closed';

export interface Message {
    id: string;
    conversationId: string;
    role: MessageRole;
    content: string;
    citations: Citation[];
    toolCalls: ToolCall[];
    tokensUsed: number | null;
    model: string | null;
    createdAt: Date;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Citation {
    docId: string;
    chunkId: string;
    text: string;
    sourceUrl?: string;
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
}

export interface Document {
    id: string;
    tenantId: string;
    title: string;
    content: string;
    sourceUrl: string | null;
    docType: DocumentType;
    version: number;
    status: DocumentStatus;
    createdAt: Date;
    updatedAt: Date;
}

export type DocumentType = 'faq' | 'article' | 'policy' | 'product';
export type DocumentStatus = 'active' | 'archived';

export interface DocumentChunk {
    id: string;
    documentId: string;
    chunkIndex: number;
    content: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
}
