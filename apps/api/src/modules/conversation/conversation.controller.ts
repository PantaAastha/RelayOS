// Conversation Controller - REST API for chat
import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Headers,
    Req,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { ConversationService } from './conversation.service';

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
    constructor(private conversationService: ConversationService) { }

    /**
     * POST /conversation/message - Send a message and get AI response
     */
    @Post('message')
    async sendMessage(
        @Headers() headers: Record<string, string>,
        @Body() dto: SendMessageDto,
        @Req() req: Request,
    ) {
        const tenantId = headers['x-assistant-id'] || headers['x-tenant-id'];
        if (!tenantId) {
            throw new HttpException('X-Assistant-ID or X-Tenant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        if (!dto.content) {
            throw new HttpException('content is required', HttpStatus.BAD_REQUEST);
        }

        try {
            const result = await this.conversationService.sendMessage(
                tenantId,
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
     * POST /conversation/escalate - Request handoff to human
     */
    @Post('escalate')
    async escalate(
        @Headers() headers: Record<string, string>,
        @Body() dto: EscalateDto,
    ) {
        const tenantId = headers['x-assistant-id'] || headers['x-tenant-id'];
        if (!tenantId) {
            throw new HttpException('X-Assistant-ID or X-Tenant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        if (!dto.conversationId) {
            throw new HttpException('conversationId is required', HttpStatus.BAD_REQUEST);
        }

        const result = await this.conversationService.requestHandoff(
            tenantId,
            dto.conversationId,
            dto.reason,
        );

        return result;
    }

    /**
     * GET /conversation/stats - Get dashboard statistics
     * IMPORTANT: Must be defined BEFORE :id route
     */
    @Get('stats')
    @Get('stats')
    async getStats(@Headers() headers: Record<string, string>) {
        const tenantId = headers['x-assistant-id'] || headers['x-tenant-id'];
        if (!tenantId) {
            throw new HttpException('X-Assistant-ID or X-Tenant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        const stats = await this.conversationService.getStats(tenantId);
        return stats;
    }

    /**
     * GET /conversation - List all conversations for tenant
     */
    @Get()
    @Get()
    async listConversations(@Headers() headers: Record<string, string>) {
        const tenantId = headers['x-assistant-id'] || headers['x-tenant-id'];
        if (!tenantId) {
            throw new HttpException('X-Assistant-ID or X-Tenant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        const conversations = await this.conversationService.listConversations(tenantId);
        return { conversations };
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
        const tenantId = headers['x-assistant-id'] || headers['x-tenant-id'];
        if (!tenantId) {
            throw new HttpException('X-Assistant-ID or X-Tenant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        if (!dto.messageId || !dto.type) {
            throw new HttpException('messageId and type are required', HttpStatus.BAD_REQUEST);
        }

        const result = await this.conversationService.submitFeedback(
            tenantId,
            dto.messageId,
            dto.type,
            dto.comment,
        );

        return result;
    }
}
