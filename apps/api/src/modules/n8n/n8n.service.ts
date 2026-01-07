// n8n Service
// Handles outgoing calls to n8n webhooks for workflow automation

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface N8nWorkflowTriggerPayload {
    /** Workflow name/identifier for logging */
    workflow: string;
    /** The data to send to n8n */
    data: Record<string, unknown>;
}

export interface N8nHandoffPayload {
    /** Conversation/session ID */
    sessionId: string;
    /** Tenant ID */
    tenantId: string;
    /** User message that triggered handoff */
    userMessage: string;
    /** Conversation history */
    conversationHistory?: Array<{ role: string; content: string }>;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}

export interface N8nLeadCapturePayload {
    /** Tenant ID */
    tenantId: string;
    /** Lead email */
    email: string;
    /** Lead name */
    name?: string;
    /** Lead phone */
    phone?: string;
    /** Source of the lead (widget, form, etc.) */
    source: string;
    /** Additional custom fields */
    customFields?: Record<string, unknown>;
}

@Injectable()
export class N8nService {
    private readonly logger = new Logger(N8nService.name);
    private readonly webhookBaseUrl: string | null;
    private readonly apiKey: string | null;
    private readonly enabled: boolean;

    constructor(
        private configService: ConfigService,
        enabled: boolean,
    ) {
        this.enabled = enabled;
        this.webhookBaseUrl = this.configService.get<string>('N8N_WEBHOOK_BASE_URL') || null;
        this.apiKey = this.configService.get<string>('N8N_API_KEY') || null;

        if (enabled && !this.webhookBaseUrl) {
            this.logger.warn('N8N_ENABLED is true but N8N_WEBHOOK_BASE_URL is not set');
        }
    }

    /**
     * Check if n8n integration is enabled
     */
    isEnabled(): boolean {
        return this.enabled && !!this.webhookBaseUrl;
    }

    /**
     * Trigger a generic n8n webhook workflow
     */
    async triggerWorkflow(webhookPath: string, data: Record<string, unknown>): Promise<boolean> {
        if (!this.isEnabled()) {
            this.logger.debug('n8n is disabled, skipping workflow trigger');
            return false;
        }

        try {
            const url = `${this.webhookBaseUrl}/${webhookPath}`;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                this.logger.error(`n8n webhook failed: ${response.status} ${response.statusText}`);
                return false;
            }

            this.logger.log(`n8n workflow triggered: ${webhookPath}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to trigger n8n workflow: ${error}`);
            return false;
        }
    }

    /**
     * Trigger handoff workflow - notify human agents
     */
    async triggerHandoff(payload: N8nHandoffPayload): Promise<boolean> {
        return this.triggerWorkflow('handoff', {
            type: 'handoff',
            timestamp: new Date().toISOString(),
            ...payload,
        });
    }

    /**
     * Trigger lead capture workflow - send lead to CRM
     */
    async triggerLeadCapture(payload: N8nLeadCapturePayload): Promise<boolean> {
        return this.triggerWorkflow('lead-capture', {
            type: 'lead_capture',
            timestamp: new Date().toISOString(),
            ...payload,
        });
    }

    /**
     * Trigger a custom workflow by name
     */
    async triggerCustom(workflowName: string, data: Record<string, unknown>): Promise<boolean> {
        return this.triggerWorkflow(workflowName, {
            type: 'custom',
            workflow: workflowName,
            timestamp: new Date().toISOString(),
            ...data,
        });
    }
}
