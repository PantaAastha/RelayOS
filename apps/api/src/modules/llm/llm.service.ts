// LLM Service - High-level service for LLM operations
// Supports multiple providers: OpenAI, Gemini

import { Injectable } from '@nestjs/common';
import { OpenAIProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import {
    LLMProvider,
    LLMMessage,
    LLMCompletionOptions,
    LLMCompletionResult,
    LLMStreamChunk,
    EmbeddingResult,
} from './llm.interface';

interface LLMServiceConfig {
    provider: 'openai' | 'gemini' | 'anthropic';
    apiKey: string;
}

@Injectable()
export class LLMService {
    private provider: LLMProvider;

    constructor(config: LLMServiceConfig) {
        switch (config.provider) {
            case 'anthropic':
                // Lazy import to avoid loading unused providers
                const { AnthropicProvider } = require('./anthropic.provider');
                this.provider = new AnthropicProvider(config.apiKey);
                break;
            case 'gemini':
                this.provider = new GeminiProvider(config.apiKey);
                break;
            case 'openai':
            default:
                this.provider = new OpenAIProvider(config.apiKey);
                break;
        }
    }

    get providerName(): string {
        return this.provider.name;
    }

    /**
     * Generate a chat completion
     */
    async complete(
        messages: LLMMessage[],
        options?: LLMCompletionOptions,
    ): Promise<LLMCompletionResult> {
        return this.provider.complete(messages, options);
    }

    /**
     * Generate a streaming chat completion
     */
    streamComplete(
        messages: LLMMessage[],
        options?: LLMCompletionOptions,
    ): AsyncGenerator<LLMStreamChunk> {
        return this.provider.streamComplete(messages, options);
    }

    /**
     * Generate embedding for a single text
     */
    async embed(text: string): Promise<EmbeddingResult> {
        return this.provider.embed(text);
    }

    /**
     * Generate embeddings for multiple texts
     */
    async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
        return this.provider.embedBatch(texts);
    }

    /**
     * Helper: Build a system prompt with RAG context
     * The context is placed prominently so the LLM uses it
     */
    buildRAGPrompt(
        systemPrompt: string,
        context: string[],
        userQuestion: string,
    ): LLMMessage[] {
        // If we have context, make it VERY explicit that the LLM should use it
        if (context.length > 0) {
            const contextBlock = context.map((c, i) => `[Source ${i + 1}]:\n${c}`).join('\n\n---\n\n');

            return [
                {
                    role: 'system',
                    content: `You are a helpful customer support assistant for a company.

CRITICAL: You MUST answer ONLY using the KNOWLEDGE BASE provided below. Do NOT use your general knowledge.

=== KNOWLEDGE BASE START ===
${contextBlock}
=== KNOWLEDGE BASE END ===

RULES:
1. Answer the user's question using ONLY the information from the KNOWLEDGE BASE above.
2. When you use information, cite it as [Source 1], [Source 2], etc.
3. If the knowledge base doesn't contain relevant information, say "I don't have information about that in my knowledge base."
4. Be helpful, professional, and concise.
5. DO NOT make up information that is not in the knowledge base.`,
                },
                {
                    role: 'user',
                    content: userQuestion,
                },
            ];
        }

        // No context available
        return [
            {
                role: 'system',
                content: `${systemPrompt}

IMPORTANT: You currently have no knowledge base documents to reference. 
If the user asks a question you cannot answer, politely say you don't have that information.`,
            },
            {
                role: 'user',
                content: userQuestion,
            },
        ];
    }
}
