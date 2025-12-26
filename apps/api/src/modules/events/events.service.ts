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
    | 'handoff.completed';

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
    ): Promise<void> {
        const { error } = await this.supabase.from('events').insert({
            tenant_id: tenantId,
            conversation_id: conversationId,
            event_type: eventType,
            payload,
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
}
