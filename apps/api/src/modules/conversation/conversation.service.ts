// Conversation Service - Core chat logic
// Handles message flow, RAG context, and response generation

import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { LLMService } from '../llm/llm.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { EventsService } from '../events/events.service';
import { N8nService } from '../n8n/n8n.service';

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    citations?: Array<{ docId: string; chunkId: string; text: string }>;
}

export interface Conversation {
    id: string;
    tenantId: string;
    status: 'active' | 'handed_off' | 'closed';
    messages: Message[];
}

@Injectable()
export class ConversationService {
    private supabase: SupabaseClient;

    constructor(
        private configService: ConfigService,
        private llmService: LLMService,
        private knowledgeService: KnowledgeService,
        private eventsService: EventsService,
        private n8nService: N8nService,
    ) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
        }

        this.supabase = createClient(supabaseUrl, serviceRoleKey);
    }

    /**
     * Create a new conversation
     */
    async createConversation(
        tenantId: string,
        channel = 'web',
        metadata?: Record<string, unknown>,
    ): Promise<string> {
        const { data, error } = await this.supabase
            .from('conversations')
            .insert({
                tenant_id: tenantId,
                channel,
                metadata: metadata ?? {},
            })
            .select('id')
            .single();

        if (error) {
            throw new Error(`Failed to create conversation: ${error.message}`);
        }

        await this.eventsService.log(
            tenantId,
            'conversation.started',
            { channel, metadata },
            data.id,
        );

        return data.id;
    }

    /**
     * Send a message and get AI response with RAG
     */
    async sendMessage(
        tenantId: string,
        conversationId: string | null,
        userMessage: string,
        correlationId?: string,
    ): Promise<{
        conversationId: string;
        messageId: string;
        response: {
            content: string;
            citations: Array<{ docId: string; chunkId: string; text: string }>;
        };
    }> {
        const requestStart = Date.now();

        // 1. Create conversation if needed
        if (!conversationId) {
            conversationId = await this.createConversation(tenantId);
        }

        // 2. Save user message
        const { data: userMsg, error: userMsgError } = await this.supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                role: 'user',
                content: userMessage,
            })
            .select('id')
            .single();

        if (userMsgError) {
            throw new Error(`Failed to save message: ${userMsgError.message}`);
        }

        await this.eventsService.log(
            tenantId,
            'message.received',
            { messageId: userMsg.id, content: userMessage, role: 'user' },
            conversationId,
            correlationId,
        );

        // 3. Search knowledge base (with error boundary - proceed without context if search fails)
        let searchResults: Awaited<ReturnType<typeof this.knowledgeService.search>> = [];
        try {
            searchResults = await this.knowledgeService.search(
                tenantId,
                userMessage,
                5,
                conversationId,
                correlationId,
            );
        } catch (error) {
            // Log the error but continue without RAG context
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`[RAG] Search failed, proceeding without context: ${errorMessage}`);
            await this.eventsService.log(
                tenantId,
                'rag.refused',
                {
                    reason: 'search_error',
                    error: errorMessage,
                    query: userMessage.substring(0, 100),
                },
                conversationId,
                correlationId,
            );
        }

        // 4. Get conversation history (last 10 messages for context)
        const { data: history } = await this.supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(10);

        // 5. Build RAG prompt
        const context = searchResults.map((r) => r.content);
        const systemPrompt = this.buildSystemPrompt(tenantId);

        // 6. Log agent invocation
        await this.eventsService.log(
            tenantId,
            'agent.invoked',
            { agentType: 'knowledge', input: userMessage },
            conversationId,
        );

        // 7. Generate response
        const messages = this.llmService.buildRAGPrompt(
            systemPrompt,
            context,
            userMessage,
        );

        // Add conversation history
        if (history && history.length > 1) {
            // Insert history before the new user message
            const historyMessages = history.slice(0, -1).map((m) => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content,
            }));
            messages.splice(1, 0, ...historyMessages);
        }

        const startTime = Date.now();

        // Use safeComplete for automatic retry and fallback on errors
        const response = await this.llmService.safeComplete(messages);

        // Log if we got a fallback response
        if ('fallback' in response && response.fallback) {
            await this.eventsService.log(
                tenantId,
                'agent.failed',
                {
                    agentType: 'knowledge',
                    error: 'error' in response ? response.error : 'Unknown error',
                    fallbackUsed: true,
                },
                conversationId,
            );
        }

        const durationMs = Date.now() - startTime;

        // 8. Build citations
        const citations = searchResults.length > 0
            ? searchResults.map((r) => ({
                docId: r.documentId,
                chunkId: r.chunkId,
                text: r.content.substring(0, 100) + '...',
            }))
            : [];

        // Log based on whether we had relevant context
        if (searchResults.length > 0) {
            await this.eventsService.log(
                tenantId,
                'rag.cited',
                { citations: citations.map((c) => ({ docId: c.docId, chunkId: c.chunkId })) },
                conversationId,
            );
        } else if (response.content.includes("don't have information")) {
            await this.eventsService.log(
                tenantId,
                'rag.refused',
                { reason: 'no_relevant_docs', query: userMessage },
                conversationId,
            );
        }

        // 9. Save assistant response
        const { data: assistantMsg, error: assistantMsgError } = await this.supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: response.content,
                citations,
                tokens_used: response.tokensUsed.total,
                model: response.model,
            })
            .select('id')
            .single();

        if (assistantMsgError) {
            throw new Error(`Failed to save response: ${assistantMsgError.message}`);
        }

        await this.eventsService.log(
            tenantId,
            'agent.completed',
            {
                agentType: 'knowledge',
                output: response.content.substring(0, 200),
                tokensUsed: response.tokensUsed.total,
                durationMs,
            },
            conversationId,
        );

        await this.eventsService.log(
            tenantId,
            'message.sent',
            { messageId: assistantMsg.id, role: 'assistant' },
            conversationId,
        );

        return {
            conversationId,
            messageId: assistantMsg.id,
            response: {
                content: response.content,
                citations,
            },
        };
    }

    /**
     * Request handoff to human support
     */
    async requestHandoff(
        tenantId: string,
        conversationId: string,
        reason?: string,
    ): Promise<{ success: boolean; ticketId?: string; n8nTriggered?: boolean }> {
        // Update conversation status
        const { error } = await this.supabase
            .from('conversations')
            .update({ status: 'handed_off' })
            .eq('id', conversationId);

        if (error) {
            throw new Error(`Failed to update conversation: ${error.message}`);
        }

        await this.eventsService.log(
            tenantId,
            'handoff.requested',
            { reason },
            conversationId,
        );

        // Get conversation history for context
        const { data: messages } = await this.supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(20);

        // Trigger n8n handoff workflow
        const n8nTriggered = await this.n8nService.triggerHandoff({
            sessionId: conversationId,
            tenantId,
            userMessage: reason || 'User requested human support',
            conversationHistory: messages?.map(m => ({
                role: m.role,
                content: m.content,
            })),
            metadata: { reason },
        });

        if (n8nTriggered) {
            await this.eventsService.log(
                tenantId,
                'n8n.handoff.triggered',
                { conversationId },
                conversationId,
            );
        }

        return {
            success: true,
            ticketId: `TICKET-${Date.now()}`,
            n8nTriggered,
        };
    }

    /**
     * Get conversation history
     */
    async getConversation(conversationId: string): Promise<Conversation | null> {
        const { data: conv, error: convError } = await this.supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single();

        if (convError || !conv) {
            return null;
        }

        const { data: messages, error: msgError } = await this.supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (msgError) {
            throw new Error(`Failed to fetch messages: ${msgError.message}`);
        }

        return {
            id: conv.id,
            tenantId: conv.tenant_id,
            status: conv.status,
            messages: messages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                citations: m.citations,
            })),
        };
    }

    /**
     * List all conversations for a tenant
     */
    async listConversations(tenantId: string): Promise<Array<{
        id: string;
        createdAt: string;
        status: string;
        messageCount: number;
        lastMessage?: string;
    }>> {
        // Get conversations
        const { data: conversations, error } = await this.supabase
            .from('conversations')
            .select('id, created_at, status')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch conversations: ${error.message}`);
        }

        // Get message counts and last messages
        const results = await Promise.all(
            (conversations || []).map(async (conv) => {
                const { data: messages } = await this.supabase
                    .from('messages')
                    .select('content, role, created_at')
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: false });

                const lastUserMessage = messages?.find(m => m.role === 'user');

                return {
                    id: conv.id,
                    createdAt: conv.created_at,
                    status: conv.status,
                    messageCount: messages?.length || 0,
                    lastMessage: lastUserMessage?.content?.substring(0, 100),
                };
            })
        );

        return results;
    }

    /**
     * Get statistics for dashboard
     */
    async getStats(tenantId: string): Promise<{
        documentsCount: number;
        conversationsCount: number;
        messagesCount: number;
    }> {
        const [docsResult, convsResult, msgsResult] = await Promise.all([
            this.supabase
                .from('documents')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tenantId),
            this.supabase
                .from('conversations')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tenantId),
            this.supabase
                .from('messages')
                .select('id, conversation_id', { count: 'exact', head: true }),
        ]);

        return {
            documentsCount: docsResult.count || 0,
            conversationsCount: convsResult.count || 0,
            messagesCount: msgsResult.count || 0,
        };
    }

    private buildSystemPrompt(tenantId: string): string {
        // TODO: Load tenant-specific configuration
        return `You are a helpful customer support assistant. 
Your job is to answer customer questions accurately and helpfully.
Be professional, friendly, and concise.
If you're unsure about something, admit it instead of making things up.`;
    }
}
