// Conversation Module
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { N8nModule } from '../n8n/n8n.module';
import { GuardrailsModule } from '../guardrails/guardrails.module';

@Module({
    imports: [ConfigModule, KnowledgeModule, forwardRef(() => N8nModule), GuardrailsModule],
    providers: [ConversationService],
    controllers: [ConversationController],
    exports: [ConversationService],
})
export class ConversationModule { }

