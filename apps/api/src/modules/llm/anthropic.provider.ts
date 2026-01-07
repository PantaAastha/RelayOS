// Anthropic (Claude) Provider
// Implements LLMProvider interface for Claude models

import {
    LLMProvider,
    LLMMessage,
    LLMCompletionOptions,
    LLMCompletionResult,
    LLMStreamChunk,
    EmbeddingResult,
} from './llm.interface';

interface AnthropicMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface AnthropicResponse {
    id: string;
    type: string;
    role: string;
    content: Array<{ type: string; text: string }>;
    model: string;
    stop_reason: string;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}

export class AnthropicProvider implements LLMProvider {
    readonly name = 'anthropic';
    private apiKey: string;
    private baseUrl = 'https://api.anthropic.com/v1';
    private defaultModel = 'claude-3-5-sonnet-20241022';

    constructor(apiKey: string, model?: string) {
        this.apiKey = apiKey;
        if (model) {
            this.defaultModel = model;
        }
    }

    async complete(
        messages: LLMMessage[],
        options?: LLMCompletionOptions,
    ): Promise<LLMCompletionResult> {
        const model = options?.model || this.defaultModel;

        // Extract system message and convert to Anthropic format
        const systemMessage = messages.find((m) => m.role === 'system');
        const conversationMessages = messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            }));

        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: options?.maxTokens || 4096,
                system: systemMessage?.content,
                messages: conversationMessages,
                temperature: options?.temperature ?? 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API error: ${response.status} - ${error}`);
        }

        const data: AnthropicResponse = await response.json();
        const content = data.content[0]?.text || '';

        return {
            content,
            model: data.model,
            tokensUsed: {
                prompt: data.usage.input_tokens,
                completion: data.usage.output_tokens,
                total: data.usage.input_tokens + data.usage.output_tokens,
            },
            finishReason: this.mapStopReason(data.stop_reason),
        };
    }

    async *streamComplete(
        messages: LLMMessage[],
        options?: LLMCompletionOptions,
    ): AsyncGenerator<LLMStreamChunk> {
        const model = options?.model || this.defaultModel;

        // Extract system message and convert to Anthropic format
        const systemMessage = messages.find((m) => m.role === 'system');
        const conversationMessages = messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            }));

        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: options?.maxTokens || 4096,
                system: systemMessage?.content,
                messages: conversationMessages,
                temperature: options?.temperature ?? 0.7,
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API error: ${response.status} - ${error}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const event = JSON.parse(data);

                        if (event.type === 'content_block_delta' && event.delta?.text) {
                            yield { type: 'token', content: event.delta.text };
                        }

                        if (event.type === 'message_delta' && event.usage) {
                            totalOutputTokens = event.usage.output_tokens;
                        }

                        if (event.type === 'message_start' && event.message?.usage) {
                            totalInputTokens = event.message.usage.input_tokens;
                        }
                    } catch {
                        // Skip unparseable lines
                    }
                }
            }
        }

        yield {
            type: 'done',
            tokensUsed: {
                prompt: totalInputTokens,
                completion: totalOutputTokens,
                total: totalInputTokens + totalOutputTokens,
            },
        };
    }

    async embed(text: string): Promise<EmbeddingResult> {
        // Anthropic doesn't have a native embedding API
        // For production, you'd use a separate embedding provider
        throw new Error(
            'Anthropic does not provide embeddings. Use OpenAI or a dedicated embedding service for embeddings.',
        );
    }

    async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
        throw new Error(
            'Anthropic does not provide embeddings. Use OpenAI or a dedicated embedding service for embeddings.',
        );
    }

    private mapStopReason(
        reason: string,
    ): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
        switch (reason) {
            case 'end_turn':
            case 'stop_sequence':
                return 'stop';
            case 'max_tokens':
                return 'length';
            case 'tool_use':
                return 'tool_calls';
            default:
                return 'stop';
        }
    }
}
