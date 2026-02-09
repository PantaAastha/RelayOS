// Guardrails Module
// Provides security guardrails for RAG pipeline

import { Module, forwardRef } from '@nestjs/common';
import { GuardrailsService } from './guardrails.service';
import { LLMModule } from '../llm/llm.module';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [
        forwardRef(() => LLMModule),
        EventsModule,
    ],
    providers: [GuardrailsService],
    exports: [GuardrailsService],
})
export class GuardrailsModule { }
