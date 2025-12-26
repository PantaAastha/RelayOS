// LLM Provider Abstraction Layer
// This allows swapping between OpenAI, Anthropic, or other providers

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMCompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}

export interface LLMCompletionResult {
    content: string;
    model: string;
    tokensUsed: {
        prompt: number;
        completion: number;
        total: number;
    };
    finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
}

export interface LLMStreamChunk {
    type: 'token' | 'done';
    content?: string;
    tokensUsed?: LLMCompletionResult['tokensUsed'];
}

export interface EmbeddingResult {
    embedding: number[];
    model: string;
    tokensUsed: number;
}

/**
 * Abstract interface for LLM providers.
 * Implementing this interface allows easy swapping between providers.
 */
export interface LLMProvider {
    /**
     * Provider name for logging/debugging
     */
    readonly name: string;

    /**
     * Generate a completion (non-streaming)
     */
    complete(
        messages: LLMMessage[],
        options?: LLMCompletionOptions,
    ): Promise<LLMCompletionResult>;

    /**
     * Generate a streaming completion
     */
    streamComplete(
        messages: LLMMessage[],
        options?: LLMCompletionOptions,
    ): AsyncGenerator<LLMStreamChunk>;

    /**
     * Generate embeddings for text
     */
    embed(text: string): Promise<EmbeddingResult>;

    /**
     * Generate embeddings for multiple texts (batch)
     */
    embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
}
