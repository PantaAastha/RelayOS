// Events Service - Append-only audit log
// This is the "OS" part - every decision is logged for replay and audits

import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

export type EventType =
    | 'conversation.started'
    | 'conversation.ended'
    | 'message.received'
    | 'message.sent'
    | 'agent.invoked'
    | 'agent.completed'
    | 'agent.failed'
    | 'rag.searched'
    | 'rag.cited'
    | 'rag.refused'
    | 'workflow.triggered'
    | 'workflow.completed'
    | 'workflow.failed'
    | 'handoff.requested'
    | 'handoff.completed'
    | 'n8n.handoff.triggered'
    | 'n8n.lead.triggered';

export interface EventPayload {
    [key: string]: unknown;
}

@Injectable()
export class EventsService {
    private supabase: SupabaseClient;

    constructor(private configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
        }

        // Use service role key for server-side operations (bypasses RLS)
        this.supabase = createClient(supabaseUrl, serviceRoleKey);
    }

    /**
     * Log an event to the append-only audit log.
     * This is the core of what makes RelayOS an "OS" - everything is logged.
     */
    async log(
        tenantId: string,
        eventType: EventType,
        payload: EventPayload,
        conversationId?: string,
        correlationId?: string,
    ): Promise<void> {
        const enrichedPayload = {
            ...payload,
            correlationId,
            loggedAt: new Date().toISOString(),
        };

        const { error } = await this.supabase.from('events').insert({
            tenant_id: tenantId,
            conversation_id: conversationId,
            event_type: eventType,
            payload: enrichedPayload,
        });

        if (error) {
            console.error('Failed to log event:', error);
            // Don't throw - logging should never break the main flow
        }
    }

    /**
     * Get events for a conversation (for replay/debugging)
     */
    async getConversationEvents(conversationId: string, limit = 100) {
        const { data, error } = await this.supabase
            .from('events')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            throw new Error(`Failed to fetch events: ${error.message}`);
        }

        return data;
    }

    /**
     * Get events by type for a tenant (for analytics)
     */
    async getEventsByType(
        tenantId: string,
        eventType: EventType,
        since?: Date,
        limit = 100,
    ) {
        let query = this.supabase
            .from('events')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('event_type', eventType)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (since) {
            query = query.gte('created_at', since.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch events: ${error.message}`);
        }

        return data;
    }

    /**
     * List events for a tenant with optional filters (for observability UI)
     */
    async listEvents(
        tenantId: string,
        options?: {
            eventType?: EventType;
            since?: Date;
            search?: string;
            limit?: number;
        },
    ) {
        const limit = options?.limit ?? 50;

        let query = this.supabase
            .from('events')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (options?.eventType) {
            query = query.eq('event_type', options.eventType);
        }

        if (options?.since) {
            query = query.gte('created_at', options.since.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch events: ${error.message}`);
        }

        // Client-side search if query provided (search in payload)
        if (options?.search && data) {
            const searchLower = options.search.toLowerCase();
            return data.filter(event =>
                JSON.stringify(event.payload).toLowerCase().includes(searchLower) ||
                event.event_type.toLowerCase().includes(searchLower)
            );
        }

        return data;
    }

    /**
     * Get a single event by ID
     */
    async getEventById(eventId: number) {
        const { data, error } = await this.supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error) {
            throw new Error(`Failed to fetch event: ${error.message}`);
        }

        return data;
    }

    /**
     * Get available event types
     */
    getEventTypes(): EventType[] {
        return [
            'conversation.started',
            'conversation.ended',
            'message.received',
            'message.sent',
            'agent.invoked',
            'agent.completed',
            'agent.failed',
            'rag.searched',
            'rag.cited',
            'rag.refused',
            'workflow.triggered',
            'workflow.completed',
            'workflow.failed',
            'handoff.requested',
            'handoff.completed',
            'n8n.handoff.triggered',
            'n8n.lead.triggered',
        ];
    }
}
