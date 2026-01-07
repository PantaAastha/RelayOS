// n8n Controller
// Handles incoming webhooks from n8n (callbacks)

import { Controller, Post, Body, Param, Logger, HttpCode, Inject } from '@nestjs/common';

interface N8nCallbackPayload {
    type: string;
    sessionId?: string;
    status?: string;
    message?: string;
    data?: Record<string, unknown>;
}

@Controller('api/n8n')
export class N8nController {
    private readonly logger = new Logger(N8nController.name);

    constructor(
        @Inject('N8N_ENABLED') private readonly n8nEnabled: boolean,
    ) { }

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

        // Handle different event types
        switch (event) {
            case 'handoff-complete':
                // Human agent has responded
                this.logger.log(`Handoff completed for session: ${payload.sessionId}`);
                // TODO: Update conversation state, notify widget
                break;

            case 'lead-processed':
                // Lead has been processed by CRM
                this.logger.log(`Lead processed: ${payload.data?.email}`);
                break;

            default:
                this.logger.debug(`Unknown n8n event: ${event}`);
        }

        return { success: true, event, received: true };
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

        // TODO: Implement handoff logic
        // - Update session state to "human_agent"
        // - Notify widget that human is now responding
        // - Store agent info if provided

        return { success: true, type: 'handoff', received: true };
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

        // TODO: Implement lead confirmation logic
        // - Update lead status in database
        // - Trigger any follow-up actions

        return { success: true, type: 'lead', received: true };
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
