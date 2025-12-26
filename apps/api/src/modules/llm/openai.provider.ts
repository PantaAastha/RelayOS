// OpenAI Provider Implementation
import OpenAI from 'openai';
import {
    LLMProvider,
    LLMMessage,
    LLMCompletionOptions,
    LLMCompletionResult,
    LLMStreamChunk,
    EmbeddingResult,
} from './llm.interface';

export class OpenAIProvider implements LLMProvider {
    readonly name = 'openai';
    private client: OpenAI;
    private defaultModel: string;
    private embeddingModel: string;

    constructor(
        apiKey: string,
        defaultModel = 'gpt-4o-mini',
        embeddingModel = 'text-embedding-3-small', // 1536 dimensions, Supabase compatible
    ) {
        this.client = new OpenAI({ apiKey });
        this.defaultModel = defaultModel;
        this.embeddingModel = embeddingModel;
    }

    async complete(
        messages: LLMMessage[],
        options?: LLMCompletionOptions,
    ): Promise<LLMCompletionResult> {
        const response = await this.client.chat.completions.create({
            model: options?.model ?? this.defaultModel,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens,
        });

        const choice = response.choices[0];
        return {
            content: choice.message.content ?? '',
            model: response.model,
            tokensUsed: {
                prompt: response.usage?.prompt_tokens ?? 0,
                completion: response.usage?.completion_tokens ?? 0,
                total: response.usage?.total_tokens ?? 0,
            },
            finishReason: this.mapFinishReason(choice.finish_reason),
        };
    }

    async *streamComplete(
        messages: LLMMessage[],
        options?: LLMCompletionOptions,
    ): AsyncGenerator<LLMStreamChunk> {
        const stream = await this.client.chat.completions.create({
            model: options?.model ?? this.defaultModel,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens,
            stream: true,
            stream_options: { include_usage: true },
        });

        let totalTokens = { prompt: 0, completion: 0, total: 0 };

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;

            if (delta?.content) {
                yield { type: 'token', content: delta.content };
            }

            if (chunk.usage) {
                totalTokens = {
                    prompt: chunk.usage.prompt_tokens,
                    completion: chunk.usage.completion_tokens,
                    total: chunk.usage.total_tokens,
                };
            }
        }

        yield { type: 'done', tokensUsed: totalTokens };
    }

    async embed(text: string): Promise<EmbeddingResult> {
        const response = await this.client.embeddings.create({
            model: this.embeddingModel,
            input: text,
        });

        return {
            embedding: response.data[0].embedding,
            model: response.model,
            tokensUsed: response.usage.total_tokens,
        };
    }

    async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
        const response = await this.client.embeddings.create({
            model: this.embeddingModel,
            input: texts,
        });

        const tokensPerText = Math.ceil(response.usage.total_tokens / texts.length);

        return response.data.map((d) => ({
            embedding: d.embedding,
            model: response.model,
            tokensUsed: tokensPerText,
        }));
    }

    private mapFinishReason(
        reason: string | null,
    ): LLMCompletionResult['finishReason'] {
        switch (reason) {
            case 'stop':
                return 'stop';
            case 'length':
                return 'length';
            case 'tool_calls':
                return 'tool_calls';
            case 'content_filter':
                return 'content_filter';
            default:
                return 'stop';
        }
    }
}
