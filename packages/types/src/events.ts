// Event types for append-only audit log

export interface BaseEvent {
    id: number;
    tenantId: string;
    conversationId: string | null;
    eventType: EventType;
    payload: Record<string, unknown>;
    createdAt: Date;
}

export type EventType =
    // Conversation lifecycle
    | 'conversation.started'
    | 'conversation.ended'
    // Messages
    | 'message.received'
    | 'message.sent'
    // Agent operations
    | 'agent.invoked'
    | 'agent.completed'
    | 'agent.failed'
    // RAG operations
    | 'rag.searched'
    | 'rag.cited'
    | 'rag.refused'
    // Workflow operations
    | 'workflow.triggered'
    | 'workflow.completed'
    | 'workflow.failed'
    // Handoff
    | 'handoff.requested'
    | 'handoff.completed';

// Typed event payloads
export interface ConversationStartedPayload {
    channel: string;
    metadata?: Record<string, unknown>;
}

export interface MessageReceivedPayload {
    messageId: string;
    content: string;
    role: 'user' | 'assistant';
}

export interface AgentInvokedPayload {
    agentType: 'router' | 'knowledge' | 'action' | 'guardrail';
    input: string;
    model?: string;
}

export interface AgentCompletedPayload {
    agentType: string;
    output: string;
    tokensUsed?: number;
    durationMs?: number;
}

export interface RagSearchedPayload {
    query: string;
    chunksRetrieved: number;
    topScore?: number;
}

export interface RagCitedPayload {
    citations: Array<{ docId: string; chunkId: string }>;
}

export interface RagRefusedPayload {
    reason: 'no_relevant_docs' | 'out_of_scope' | 'policy_violation';
    query: string;
}

export interface WorkflowTriggeredPayload {
    workflowId: string;
    workflowName: string;
    inputs: Record<string, unknown>;
}

export interface HandoffRequestedPayload {
    reason: string;
    agentSummary?: string;
}
