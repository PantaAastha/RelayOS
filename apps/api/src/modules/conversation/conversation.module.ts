// Conversation Module
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
    imports: [ConfigModule, KnowledgeModule],
    providers: [ConversationService],
    controllers: [ConversationController],
    exports: [ConversationService],
})
export class ConversationModule { }
