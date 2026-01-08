// n8n Controller
// Handles incoming webhooks from n8n (callbacks)

import { Controller, Post, Body, Param, Logger, HttpCode, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface N8nCallbackPayload {
    type: string;
    sessionId?: string;
    conversationId?: string;
    status?: string;
    message?: string;
    agentName?: string;
    agentEmail?: string;
    leadId?: string;
    data?: Record<string, unknown>;
}

@Controller('api/n8n')
export class N8nController {
    private readonly logger = new Logger(N8nController.name);
    private supabase: SupabaseClient | null = null;

    constructor(
        @Inject('N8N_ENABLED') private readonly n8nEnabled: boolean,
        private configService: ConfigService,
    ) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        if (supabaseUrl && serviceRoleKey) {
            this.supabase = createClient(supabaseUrl, serviceRoleKey);
        }
    }

    /**
     * Generic webhook endpoint for n8n callbacks
     * n8n can call POST /api/n8n/webhook/:event to notify the API
     */
    @Post('webhook/:event')
    @HttpCode(200)
    async handleWebhook(
        @Param('event') event: string,
        @Body() payload: N8nCallbackPayload,
    ) {
        if (!this.n8nEnabled) {
            return { success: false, message: 'n8n integration is disabled' };
        }

        this.logger.log(`Received n8n webhook: ${event}`, payload);

        // Route to specific handlers
        switch (event) {
            case 'handoff-complete':
                return this.handleHandoffCallback(payload);
            case 'lead-processed':
                return this.handleLeadCallback(payload);
            default:
                this.logger.debug(`Unknown n8n event: ${event}`);
                return { success: true, event, received: true };
        }
    }

    /**
     * Handoff callback - human agent has taken over
     */
    @Post('handoff')
    @HttpCode(200)
    async handleHandoffCallback(@Body() payload: N8nCallbackPayload) {
        if (!this.n8nEnabled) {
            return { success: false, message: 'n8n integration is disabled' };
        }

        this.logger.log('Handoff callback received', payload);

        const conversationId = payload.conversationId || payload.sessionId;

        if (!conversationId || !this.supabase) {
            return { success: false, message: 'Missing conversationId or database not configured' };
        }

        try {
            // Update conversation status and store agent info
            const { error } = await this.supabase
                .from('conversations')
                .update({
                    status: 'handed_off',
                    metadata: {
                        handoff_agent_name: payload.agentName,
                        handoff_agent_email: payload.agentEmail,
                        handoff_time: new Date().toISOString(),
                    },
                })
                .eq('id', conversationId);

            if (error) {
                this.logger.error(`Failed to update conversation: ${error.message}`);
                return { success: false, error: error.message };
            }

            // Log event
            await this.supabase.from('events').insert({
                event_type: 'handoff.completed',
                context: { conversationId, agentName: payload.agentName },
                conversation_id: conversationId,
            });

            this.logger.log(`Handoff completed for conversation ${conversationId}`);
            return { success: true, type: 'handoff', conversationId };
        } catch (error) {
            this.logger.error('Handoff callback error:', error);
            return { success: false, error: 'Internal error' };
        }
    }

    /**
     * Lead callback - confirmation from CRM
     */
    @Post('lead')
    @HttpCode(200)
    async handleLeadCallback(@Body() payload: N8nCallbackPayload) {
        if (!this.n8nEnabled) {
            return { success: false, message: 'n8n integration is disabled' };
        }

        this.logger.log('Lead callback received', payload);

        if (!payload.leadId || !this.supabase) {
            return { success: false, message: 'Missing leadId or database not configured' };
        }

        try {
            // Update lead status in database
            const { error } = await this.supabase
                .from('leads')
                .update({
                    status: payload.status || 'processed',
                    crm_synced_at: new Date().toISOString(),
                    crm_data: payload.data,
                })
                .eq('id', payload.leadId);

            if (error) {
                this.logger.error(`Failed to update lead: ${error.message}`);
                return { success: false, error: error.message };
            }

            this.logger.log(`Lead ${payload.leadId} processed`);
            return { success: true, type: 'lead', leadId: payload.leadId };
        } catch (error) {
            this.logger.error('Lead callback error:', error);
            return { success: false, error: 'Internal error' };
        }
    }

    /**
     * Health check for n8n integration
     */
    @Post('health')
    @HttpCode(200)
    async healthCheck() {
        return {
            success: true,
            n8nEnabled: this.n8nEnabled,
            timestamp: new Date().toISOString(),
        };
    }
}

