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
                    content: `You are a helpful, friendly customer support assistant.

=== KNOWLEDGE BASE START ===
${contextBlock}
=== KNOWLEDGE BASE END ===

GUIDELINES:
1. For greetings (hi, hello, how are you, etc.) - respond warmly and offer to help.
2. For questions about your purpose - explain you're here to help with questions about the company's products/services.
3. For substantive questions - use ONLY the KNOWLEDGE BASE above to answer. Cite sources as [Source 1], [Source 2], etc.
4. If the knowledge base doesn't have the answer to a substantive question, say "I don't have information about that in my knowledge base. Is there something else I can help with?"
5. Be helpful, professional, and concise.
6. DO NOT make up product details, policies, or facts not in the knowledge base.`,
                },
                {
                    role: 'user',
                    content: userQuestion,
                },
            ];
        }

        // No context available - be conversational but honest about limitations
        return [
            {
                role: 'system',
                content: `You are a helpful, friendly customer support assistant.

GUIDELINES:
1. For greetings (hi, hello, etc.) - respond warmly and offer to help.
2. For questions about your purpose - explain you're here to help with questions about the company's products/services.
3. For substantive questions - apologize that you don't currently have information in your knowledge base, and offer to help with something else or connect them with a human.
4. Be helpful, professional, and conversational.
5. DO NOT make up information.`,
            },
            {
                role: 'user',
                content: userQuestion,
            },
        ];
    }
}
