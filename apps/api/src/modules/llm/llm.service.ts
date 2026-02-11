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
     * Fallback response messages for different error scenarios
     */
    private static readonly FALLBACK_RESPONSES = {
        timeout: "I'm sorry, I'm taking longer than expected to respond. Please try again in a moment.",
        quota: "I'm temporarily unavailable due to high demand. Please try again in a few minutes.",
        generic: "I apologize, but I'm having trouble responding right now. Please try again.",
    };

    /**
     * Generate a chat completion with error boundaries
     * - Retries up to 2 times with exponential backoff
     * - Returns fallback response on persistent failure
     */
    async safeComplete(
        messages: LLMMessage[],
        options?: LLMCompletionOptions,
    ): Promise<LLMCompletionResult & { fallback?: boolean; error?: string }> {
        const maxRetries = 2;
        const baseDelay = 1000; // 1 second

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.complete(messages, options);
                return result;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const isLastAttempt = attempt === maxRetries;

                // Log retry attempt
                if (!isLastAttempt) {
                    console.warn(`[LLM] Attempt ${attempt + 1} failed: ${errorMessage}. Retrying...`);
                    // Exponential backoff: 1s, 2s
                    await this.sleep(baseDelay * Math.pow(2, attempt));
                    continue;
                }

                // All retries failed - return fallback response
                console.error(`[LLM] All ${maxRetries + 1} attempts failed: ${errorMessage}`);

                // Determine fallback message based on error type
                let fallbackContent = LLMService.FALLBACK_RESPONSES.generic;
                if (errorMessage.toLowerCase().includes('timeout')) {
                    fallbackContent = LLMService.FALLBACK_RESPONSES.timeout;
                } else if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate')) {
                    fallbackContent = LLMService.FALLBACK_RESPONSES.quota;
                }

                return {
                    content: fallbackContent,
                    tokensUsed: { prompt: 0, completion: 0, total: 0 },
                    model: 'fallback',
                    finishReason: 'stop' as const,
                    fallback: true,
                    error: errorMessage,
                };
            }
        }

        // Should never reach here, but TypeScript needs this
        return {
            content: LLMService.FALLBACK_RESPONSES.generic,
            tokensUsed: { prompt: 0, completion: 0, total: 0 },
            model: 'fallback',
            finishReason: 'stop' as const,
            fallback: true,
        };
    }

    /**
     * Helper for delay between retries
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
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
     * The context is placed prominently so the LLM uses it.
     * Uses the dynamic system prompt from tenant persona configuration.
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
                    content: `${systemPrompt}

=== KNOWLEDGE BASE START ===
${contextBlock}
=== KNOWLEDGE BASE END ===

IMPORTANT: You may see previous conversation messages for context. Those questions have ALREADY been answered - do NOT re-address or disclaim about them. Focus ONLY on answering the user's LATEST message.

GUIDELINES:
1. For greetings (hi, hello, how are you, etc.) - respond warmly and offer to help.
2. For questions about your purpose - explain you're here to help with questions about the company's products/services.
3. For substantive questions - use ONLY the KNOWLEDGE BASE above to answer. Cite sources as [Source 1], [Source 2], etc.
4. If the KNOWLEDGE BASE doesn't contain information to answer the LATEST question, say "I don't have information about that in my knowledge base. Is there something else I can help with?"
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
                content: `${systemPrompt}

IMPORTANT: You may see previous conversation messages for context. Those questions have ALREADY been answered - do NOT re-address or disclaim about them. Focus ONLY on answering the user's LATEST message.

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
