// Google Gemini Provider Implementation
// Free tier: 1500 requests/day for gemini-flash, 50 requests/day for embeddings

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
    LLMProvider,
    LLMMessage,
    LLMCompletionOptions,
    LLMCompletionResult,
    LLMStreamChunk,
    EmbeddingResult,
} from './llm.interface';

export class GeminiProvider implements LLMProvider {
    readonly name = 'gemini';
    private client: GoogleGenerativeAI;
    private model: GenerativeModel;
    private apiKey: string;
    private defaultModelName: string;

    constructor(
        apiKey: string,
        defaultModel = 'gemini-2.5-flash', // Current stable model with free tier
    ) {
        this.apiKey = apiKey;
        this.client = new GoogleGenerativeAI(apiKey);
        this.defaultModelName = defaultModel;
        this.model = this.client.getGenerativeModel({ model: defaultModel });
    }

    async complete(
        messages: LLMMessage[],
        options?: LLMCompletionOptions,
    ): Promise<LLMCompletionResult> {
        // Get model (use custom if provided)
        const model = options?.model
            ? this.client.getGenerativeModel({ model: options.model })
            : this.model;

        // For Gemini, we need to inject system instructions differently
        // System message becomes part of the prompt, not separate history
        const systemMessage = messages.find(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');
        const lastUserMessage = userMessages[userMessages.length - 1];

        // Build the actual prompt: system instructions + user question
        let prompt: string;
        if (systemMessage) {
            prompt = `${systemMessage.content}\n\n---\nUser Question: ${lastUserMessage.content}\n\nPlease respond based ONLY on the knowledge base provided above.`;
        } else {
            prompt = lastUserMessage.content;
        }

        // Build history from previous messages (excluding system and last user)
        const history = this.convertToGeminiHistory(
            userMessages.slice(0, -1).filter(m => m.role !== 'system')
        );

        const chat = model.startChat({
            history,
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 2048,
            },
        });

        const result = await chat.sendMessage(prompt);
        const response = result.response;
        const text = response.text();

        // Gemini doesn't provide token counts in the same way
        const estimatedTokens = Math.ceil(text.length / 4);

        return {
            content: text,
            model: this.defaultModelName,
            tokensUsed: {
                prompt: 0,
                completion: estimatedTokens,
                total: estimatedTokens,
            },
            finishReason: 'stop',
        };
    }

    async *streamComplete(
        messages: LLMMessage[],
        options?: LLMCompletionOptions,
    ): AsyncGenerator<LLMStreamChunk> {
        const history = this.convertToGeminiHistory(messages);
        const lastMessage = messages[messages.length - 1];

        const model = options?.model
            ? this.client.getGenerativeModel({ model: options.model })
            : this.model;

        const chat = model.startChat({
            history,
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 2048,
            },
        });

        const result = await chat.sendMessageStream(lastMessage.content);
        let fullText = '';

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                fullText += text;
                yield { type: 'token', content: text };
            }
        }

        const estimatedTokens = Math.ceil(fullText.length / 4);
        yield {
            type: 'done',
            tokensUsed: {
                prompt: 0,
                completion: estimatedTokens,
                total: estimatedTokens,
            },
        };
    }

    async embed(text: string): Promise<EmbeddingResult> {
        // Use REST API directly for reliable gemini-embedding-001 support
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: { parts: [{ text }] },
                    outputDimensionality: 768, // MRL to match existing DB schema
                }),
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Embedding failed: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();

        return {
            embedding: data.embedding.values,
            model: 'gemini-embedding-001',
            tokensUsed: Math.ceil(text.length / 4), // Estimate
        };
    }

    async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
        // Gemini doesn't have a native batch API, so we call sequentially
        // For production, you'd want to parallelize this
        const results: EmbeddingResult[] = [];

        for (const text of texts) {
            const result = await this.embed(text);
            results.push(result);
        }

        return results;
    }

    private convertToGeminiHistory(messages: LLMMessage[]): Array<{
        role: 'user' | 'model';
        parts: Array<{ text: string }>;
    }> {
        const history: Array<{
            role: 'user' | 'model';
            parts: Array<{ text: string }>;
        }> = [];

        // Skip the last message (we send it separately)
        // And combine system + first user message if system exists
        for (let i = 0; i < messages.length - 1; i++) {
            const msg = messages[i];

            if (msg.role === 'system') {
                // Prepend system message to next user message or send as user
                if (i === 0 && messages.length > 1 && messages[1].role === 'user') {
                    continue; // Will be combined with next message
                }
                history.push({
                    role: 'user',
                    parts: [{ text: `[System Instructions]: ${msg.content}` }],
                });
            } else if (msg.role === 'user') {
                // Check if previous was system
                let content = msg.content;
                if (i > 0 && messages[i - 1].role === 'system') {
                    content = `[System Instructions]: ${messages[i - 1].content}\n\n${msg.content}`;
                }
                history.push({
                    role: 'user',
                    parts: [{ text: content }],
                });
            } else if (msg.role === 'assistant') {
                history.push({
                    role: 'model',
                    parts: [{ text: msg.content }],
                });
            }
        }

        return history;
    }
}
