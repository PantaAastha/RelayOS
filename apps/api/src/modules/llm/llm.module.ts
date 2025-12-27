// LLM Module - NestJS module for LLM providers
// Supports OpenAI and Gemini (with free tier)

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
                // Check for Gemini API key first (free tier available)
                const geminiKey = configService.get<string>('GEMINI_API_KEY');
                if (geminiKey) {
                    console.log('🤖 Using Gemini provider (free tier)');
                    return new LLMService({ provider: 'gemini', apiKey: geminiKey });
                }

                // Fall back to OpenAI
                const openaiKey = configService.get<string>('OPENAI_API_KEY');
                if (openaiKey) {
                    console.log('🤖 Using OpenAI provider');
                    return new LLMService({ provider: 'openai', apiKey: openaiKey });
                }

                throw new Error(
                    'Either GEMINI_API_KEY or OPENAI_API_KEY is required. ' +
                    'Get a free Gemini API key at: https://aistudio.google.com/app/apikey'
                );
            },
            inject: [ConfigService],
        },
    ],
    exports: [LLMService],
})
export class LLMModule { }
