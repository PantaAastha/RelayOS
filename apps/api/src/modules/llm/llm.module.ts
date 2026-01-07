// LLM Module - NestJS module for LLM providers
// Supports OpenAI, Gemini, and Anthropic (Claude)

import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LLMService } from './llm.service';

type LLMProviderType = 'openai' | 'gemini' | 'anthropic';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: LLMService,
            useFactory: (configService: ConfigService) => {
                // Check for explicit provider selection via LLM_PROVIDER
                const explicitProvider = configService.get<string>('LLM_PROVIDER')?.toLowerCase() as LLMProviderType | undefined;

                if (explicitProvider) {
                    const apiKey = getApiKeyForProvider(explicitProvider, configService);
                    console.log(`🤖 Using ${explicitProvider} provider (explicit)`);
                    return new LLMService({ provider: explicitProvider, apiKey });
                }

                // Auto-detect: Check for API keys in order of preference
                const anthropicKey = configService.get<string>('ANTHROPIC_API_KEY');
                if (anthropicKey) {
                    console.log('🤖 Using Anthropic (Claude) provider');
                    return new LLMService({ provider: 'anthropic', apiKey: anthropicKey });
                }

                const geminiKey = configService.get<string>('GEMINI_API_KEY');
                if (geminiKey) {
                    console.log('🤖 Using Gemini provider (free tier)');
                    return new LLMService({ provider: 'gemini', apiKey: geminiKey });
                }

                const openaiKey = configService.get<string>('OPENAI_API_KEY');
                if (openaiKey) {
                    console.log('🤖 Using OpenAI provider');
                    return new LLMService({ provider: 'openai', apiKey: openaiKey });
                }

                throw new Error(
                    'No LLM API key found. Provide one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY. ' +
                    'Optionally set LLM_PROVIDER to explicitly select a provider.'
                );
            },
            inject: [ConfigService],
        },
    ],
    exports: [LLMService],
})
export class LLMModule { }

function getApiKeyForProvider(provider: LLMProviderType, configService: ConfigService): string {
    const keyMap: Record<LLMProviderType, string> = {
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        gemini: 'GEMINI_API_KEY',
    };

    const key = configService.get<string>(keyMap[provider]);
    if (!key) {
        throw new Error(`LLM_PROVIDER is set to "${provider}" but ${keyMap[provider]} is not provided`);
    }
    return key;
}

