'use client';

import { useState, useCallback, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PreviewMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: Array<{ docId: string; chunkId: string; text: string }>;
    confidence?: number | null;
    grade?: 'SUPPORTED' | 'PARTIAL' | 'UNSUPPORTED' | null;
    thresholdTriggered?: boolean;
    delegationDecision?: 'answer' | 'answer_with_caveat' | 'escalate';
}

interface PreviewConfig {
    persona?: Record<string, any>;
    assistantType?: string;
    confidenceThreshold?: number;
}

export function usePreviewChat(assistantId: string) {
    const [messages, setMessages] = useState<PreviewMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const conversationIdRef = useRef<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (content: string, config: PreviewConfig) => {
        if (!content.trim() || isStreaming) return;

        // Add user message
        const userMsg: PreviewMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: content.trim(),
        };

        // Add placeholder assistant message
        const assistantMsgId = `assistant-${Date.now()}`;
        const assistantMsg: PreviewMessage = {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
        };

        setMessages(prev => [...prev, userMsg, assistantMsg]);
        setIsStreaming(true);

        // Abort previous request if any
        abortRef.current?.abort();
        const abortController = new AbortController();
        abortRef.current = abortController;

        try {
            const response = await fetch(`${API_URL}/conversation/preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Assistant-ID': assistantId,
                },
                body: JSON.stringify({
                    content: content.trim(),
                    conversationId: conversationIdRef.current,
                    config,
                }),
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`Preview failed: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse SSE events from buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                let eventType = '';
                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        eventType = line.substring(7).trim();
                    } else if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        try {
                            const parsed = JSON.parse(data);

                            if (eventType === 'token' && parsed.token) {
                                // Append token to the assistant message
                                setMessages(prev => prev.map(m =>
                                    m.id === assistantMsgId
                                        ? { ...m, content: m.content + parsed.token }
                                        : m
                                ));
                            } else if (eventType === 'done') {
                                // Attach metadata to the already-streamed message (no re-render of content)
                                conversationIdRef.current = parsed.conversationId;
                                setMessages(prev => prev.map(m =>
                                    m.id === assistantMsgId
                                        ? {
                                            ...m,
                                            id: parsed.messageId || m.id,
                                            citations: parsed.citations,
                                            confidence: parsed.confidence,
                                            grade: parsed.grade,
                                            thresholdTriggered: parsed.thresholdTriggered,
                                            delegationDecision: parsed.delegationDecision,
                                        }
                                        : m
                                ));
                            } else if (eventType === 'error') {
                                setMessages(prev => prev.map(m =>
                                    m.id === assistantMsgId
                                        ? { ...m, content: 'Preview failed. Please try again.' }
                                        : m
                                ));
                            }
                        } catch {
                            // Ignore JSON parse errors for incomplete data
                        }
                    }
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('[Preview] Error:', error);
            setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                    ? { ...m, content: 'Failed to connect to preview. Check that the API is running.' }
                    : m
            ));
        } finally {
            setIsStreaming(false);
        }
    }, [assistantId, isStreaming]);

    const clearChat = useCallback(() => {
        setMessages([]);
        conversationIdRef.current = null;
    }, []);

    return { messages, isStreaming, sendMessage, clearChat };
}
