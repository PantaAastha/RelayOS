// LLM Service - High-level service for LLM operations
import { Injectable } from '@nestjs/common';
import { OpenAIProvider } from './openai.provider';
import {
    LLMProvider,
    LLMMessage,
    LLMCompletionOptions,
    LLMCompletionResult,
    LLMStreamChunk,
    EmbeddingResult,
} from './llm.interface';

@Injectable()
export class LLMService {
    private provider: LLMProvider;

    constructor(openaiApiKey: string) {
        // Default to OpenAI, can be extended to support multiple providers
        this.provider = new OpenAIProvider(openaiApiKey);
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
     */
    buildRAGPrompt(
        systemPrompt: string,
        context: string[],
        userQuestion: string,
    ): LLMMessage[] {
        const contextText = context.length > 0
            ? `\n\nRelevant information:\n${context.map((c, i) => `[${i + 1}] ${c}`).join('\n\n')}`
            : '';

        return [
            {
                role: 'system',
                content: `${systemPrompt}${contextText}

IMPORTANT RULES:
1. Only answer based on the provided information above.
2. If the information doesn't contain the answer, say "I don't have information about that."
3. Always cite your sources using [1], [2], etc. when referencing the provided information.
4. Never make up information that isn't in the provided context.`,
            },
            {
                role: 'user',
                content: userQuestion,
            },
        ];
    }
}
