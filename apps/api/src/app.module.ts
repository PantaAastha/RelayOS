import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthValidationService } from './health-validation.service';
import { LLMModule } from './modules/llm/llm.module';
import { EventsModule } from './modules/events/events.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { N8nModule } from './modules/n8n/n8n.module';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { TenantThrottlerGuard } from './guards/tenant-throttler.guard';
import { throttlerConfig } from './config/throttler.config';
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
    // Rate limiting
    ThrottlerModule.forRoot(throttlerConfig),
    // Core modules
    LLMModule,
    EventsModule,
    KnowledgeModule,
    ConversationModule,
    // Optional integrations
    N8nModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    HealthValidationService,
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: TenantThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
