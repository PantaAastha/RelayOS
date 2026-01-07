import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LLMModule } from './modules/llm/llm.module';
import { EventsModule } from './modules/events/events.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { N8nModule } from './modules/n8n/n8n.module';
import * as path from 'path';

@Module({
  imports: [
    // Load environment variables from repo root .env.local
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(__dirname, '../../../.env.local'),  // apps/api/.env.local
        path.resolve(__dirname, '../../../../.env.local'), // repo root .env.local
        '.env.local',
        '.env',
      ],
    }),
    // Core modules
    LLMModule,
    EventsModule,
    KnowledgeModule,
    ConversationModule,
    // Optional integrations
    N8nModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
