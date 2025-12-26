// LLM Module - NestJS module for LLM providers
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LLMService } from './llm.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: LLMService,
            useFactory: (configService: ConfigService) => {
                const openaiKey = configService.get<string>('OPENAI_API_KEY');
                if (!openaiKey) {
                    throw new Error('OPENAI_API_KEY is required');
                }
                return new LLMService(openaiKey);
            },
            inject: [ConfigService],
        },
    ],
    exports: [LLMService],
})
export class LLMModule { }
