// Conversation Controller - REST API for chat
import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Headers,
    Req,
    Res,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ConversationService } from './conversation.service';
import { AssistantsService } from '../assistants/assistants.service';

interface SendMessageDto {
    conversationId?: string;
    content: string;
    metadata?: Record<string, unknown>;
}

interface EscalateDto {
    conversationId: string;
    reason?: string;
}

interface FeedbackDto {
    messageId: string;
    type: 'positive' | 'negative';
    comment?: string;
}

@Controller('conversation')
export class ConversationController {
    constructor(
        private conversationService: ConversationService,
        private assistantsService: AssistantsService,
    ) { }

    /**
     * POST /conversation/message - Send a message and get AI response
     */
    @Post('message')
    async sendMessage(
        @Headers() headers: Record<string, string>,
        @Body() dto: SendMessageDto,
        @Req() req: Request,
    ) {
        const assistantId = headers['x-assistant-id'];
        if (!assistantId) {
            throw new HttpException('X-Assistant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        if (!dto.content) {
            throw new HttpException('content is required', HttpStatus.BAD_REQUEST);
        }

        try {
            const result = await this.conversationService.sendMessage(
                assistantId,
                dto.conversationId ?? null,
                dto.content,
                req.correlationId,
            );
            return result;
        } catch (error) {
            console.error('Error sending message:', error);
            throw new HttpException(
                'Failed to process message',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * POST /conversation/preview - Stream a preview response with ephemeral config (SSE)
     * Used by Studio Live Preview panel. Accepts transient persona config without persisting.
     */
    @Post('preview')
    async previewMessage(
        @Headers() headers: Record<string, string>,
        @Body() dto: {
            content: string;
            conversationId?: string;
            config?: {
                persona?: Record<string, any>;
                assistantType?: string;
                confidenceThreshold?: number;
            };
        },
        @Res() res: Response,
    ) {
        const assistantId = headers['x-assistant-id'];
        if (!assistantId) {
            res.status(400).json({ error: 'X-Assistant-ID header is required' });
            return;
        }

        if (!dto.content) {
            res.status(400).json({ error: 'content is required' });
            return;
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.flushHeaders();

        try {
            const result = await this.conversationService.previewMessage(
                assistantId,
                dto.conversationId ?? null,
                dto.content,
                dto.config || {},
                // onToken callback — stream each token as an SSE event
                (token: string) => {
                    res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
                },
            );

            // Send done event with metadata only (no content — avoids double-render)
            res.write(`event: done\ndata: ${JSON.stringify({
                conversationId: result.conversationId,
                messageId: result.messageId,
                citations: result.citations,
                confidence: result.confidence,
                grade: result.grade,
                thresholdTriggered: result.thresholdTriggered,
                delegationDecision: result.delegationDecision,
            })}\n\n`);

            res.end();
        } catch (error) {
            console.error('Error in preview:', error);
            res.write(`event: error\ndata: ${JSON.stringify({ error: 'Preview failed' })}\n\n`);
            res.end();
        }
    }

    /**
     * POST /conversation/escalate - Request handoff to human
     */
    @Post('escalate')
    async escalate(
        @Headers() headers: Record<string, string>,
        @Body() dto: EscalateDto,
    ) {
        const assistantId = headers['x-assistant-id'];
        if (!assistantId) {
            throw new HttpException('X-Assistant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        if (!dto.conversationId) {
            throw new HttpException('conversationId is required', HttpStatus.BAD_REQUEST);
        }

        const result = await this.conversationService.requestHandoff(
            assistantId,
            dto.conversationId,
            dto.reason,
        );

        return result;
    }

    /**
     * GET /conversation/stats - Get dashboard statistics
     * Supports: X-Organization-ID (org-scoped) or X-Assistant-ID (assistant-scoped)
     * IMPORTANT: Must be defined BEFORE :id route
     */
    @SkipThrottle()
    @Get('stats')
    async getStats(@Headers() headers: Record<string, string>) {
        const orgId = headers['x-organization-id'];
        const assistantId = headers['x-assistant-id'];

        if (orgId) {
            const assistantIds = await this.assistantsService.getAssistantIdsForOrg(orgId);
            return this.conversationService.getStatsByOrg(assistantIds);
        }

        if (assistantId) {
            return this.conversationService.getStats(assistantId);
        }

        // Fallback: auto-detect org
        const defaultOrgId = await this.assistantsService.getDefaultOrgId();
        if (defaultOrgId) {
            const assistantIds = await this.assistantsService.getAssistantIdsForOrg(defaultOrgId);
            return this.conversationService.getStatsByOrg(assistantIds);
        }

        return { documentsCount: 0, conversationsCount: 0, messagesCount: 0, assistantCount: 0 };
    }

    /**
     * GET /conversation - List conversations
     * Supports: X-Organization-ID (org-scoped) or X-Assistant-ID (assistant-scoped)
     */
    @SkipThrottle()
    @Get()
    async listConversations(@Headers() headers: Record<string, string>) {
        const orgId = headers['x-organization-id'];
        const assistantId = headers['x-assistant-id'];

        if (orgId) {
            const assistantIds = await this.assistantsService.getAssistantIdsForOrg(orgId);
            const conversations = await this.conversationService.listConversationsByOrg(assistantIds);
            return { conversations };
        }

        if (assistantId) {
            const conversations = await this.conversationService.listConversations(assistantId);
            return { conversations };
        }

        // Fallback: auto-detect org
        const defaultOrgId = await this.assistantsService.getDefaultOrgId();
        if (defaultOrgId) {
            const assistantIds = await this.assistantsService.getAssistantIdsForOrg(defaultOrgId);
            const conversations = await this.conversationService.listConversationsByOrg(assistantIds);
            return { conversations };
        }

        return { conversations: [] };
    }

    /**
     * GET /conversation/:id - Get conversation history
     * IMPORTANT: Must be defined AFTER static routes like /stats
     */
    @Get(':id')
    async getConversation(@Param('id') conversationId: string) {
        const conversation = await this.conversationService.getConversation(conversationId);

        if (!conversation) {
            throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
        }

        return conversation;
    }

    /**
     * POST /conversation/feedback - Submit thumbs up/down feedback on a message
     */
    @Post('feedback')
    async submitFeedback(
        @Headers() headers: Record<string, string>,
        @Body() dto: FeedbackDto,
    ) {
        const assistantId = headers['x-assistant-id'];
        if (!assistantId) {
            throw new HttpException('X-Assistant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        if (!dto.messageId || !dto.type) {
            throw new HttpException('messageId and type are required', HttpStatus.BAD_REQUEST);
        }

        const result = await this.conversationService.submitFeedback(
            assistantId,
            dto.messageId,
            dto.type,
            dto.comment,
        );

        return result;
    }
}
