// Conversation Controller - REST API for chat
import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Headers,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
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

@Controller('conversation')
export class ConversationController {
    constructor(private conversationService: ConversationService) { }

    /**
     * POST /conversation/message - Send a message and get AI response
     * This is the main endpoint for the widget
     */
    @Post('message')
    async sendMessage(
        @Headers('x-tenant-id') tenantId: string,
        @Body() dto: SendMessageDto,
    ) {
        if (!tenantId) {
            throw new HttpException('X-Tenant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        if (!dto.content) {
            throw new HttpException('content is required', HttpStatus.BAD_REQUEST);
        }

        try {
            const result = await this.conversationService.sendMessage(
                tenantId,
                dto.conversationId ?? null,
                dto.content,
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
        @Headers('x-tenant-id') tenantId: string,
        @Body() dto: EscalateDto,
    ) {
        if (!tenantId) {
            throw new HttpException('X-Tenant-ID header is required', HttpStatus.BAD_REQUEST);
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
     * GET /conversation/:id - Get conversation history
     */
    @Get(':id')
    async getConversation(@Param('id') conversationId: string) {
        const conversation = await this.conversationService.getConversation(conversationId);

        if (!conversation) {
            throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
        }

        return conversation;
    }
}
