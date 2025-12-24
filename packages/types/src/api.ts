// API request/response types

export interface SendMessageRequest {
    conversationId?: string;
    content: string;
    metadata?: Record<string, unknown>;
}

export interface SendMessageResponse {
    conversationId: string;
    messageId: string;
    response: {
        content: string;
        citations: Array<{
            docId: string;
            chunkId: string;
            text: string;
            sourceUrl?: string;
        }>;
    };
}

export interface StreamMessageEvent {
    type: 'token' | 'citation' | 'done' | 'error';
    data: string | object;
}

export interface CreateConversationRequest {
    channel?: 'web' | 'whatsapp' | 'api';
    metadata?: Record<string, unknown>;
}

export interface CreateConversationResponse {
    id: string;
    status: 'active';
}

export interface EscalateRequest {
    conversationId: string;
    reason?: string;
}

export interface EscalateResponse {
    success: boolean;
    ticketId?: string;
    handoffUrl?: string;
}
