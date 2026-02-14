import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    citations?: Array<{ text: string; sourceUrl?: string }>;
    confidence?: number;
    grade?: string;
}

interface StarterQuestion {
    label: string;
    message: string;
}

interface ChatWindowProps {
    apiUrl: string;
    assistantId: string;
    tenantId?: string; // Deprecated
    title: string;
    testMode?: boolean;
    conversationId: string | null;
    messages: Message[];
    isLoadingHistory?: boolean;
    welcomeMessage?: string;
    starterQuestions?: StarterQuestion[];
    onConversationStart: (id: string) => void;
    onMessagesUpdate: (messages: Message[]) => void;
    onClose: () => void;
    onReset?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    apiUrl,
    assistantId,
    tenantId, // Keeping for backward compat if needed internally, but prefer assistantId
    title,
    testMode,
    conversationId,
    messages,
    isLoadingHistory = false,
    welcomeMessage,
    starterQuestions,
    onConversationStart,
    onMessagesUpdate,
    onClose,
    onReset,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoadingHistory]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        // Add user message immediately
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: content.trim(),
        };
        const updatedMessages = [...messages, userMessage];
        onMessagesUpdate(updatedMessages);
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${apiUrl}/conversation/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Assistant-ID': assistantId,
                    ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
                } as HeadersInit,
                body: JSON.stringify({
                    conversationId,
                    content: content.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();

            // Update conversation ID if this is the first message
            if (!conversationId && data.conversationId) {
                onConversationStart(data.conversationId);
            }

            // Add assistant response
            const assistantMessage: Message = {
                id: data.messageId,
                role: 'assistant',
                content: data.response.content,
                citations: data.response.citations,
                confidence: data.response.confidence,
                grade: data.response.grade,
            };
            onMessagesUpdate([...updatedMessages, assistantMessage]);
        } catch (err) {
            setError('Something went wrong. Please try again.');
            console.error('RelayOS Widget Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEscalate = async () => {
        if (!conversationId) return;

        try {
            const response = await fetch(`${apiUrl}/conversation/escalate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Assistant-ID': assistantId,
                    ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
                } as HeadersInit,
                body: JSON.stringify({ conversationId }),
            });

            if (response.ok) {
                const systemMessage: Message = {
                    id: `system-${Date.now()}`,
                    role: 'assistant',
                    content: "I've connected you to our support team. They'll be with you shortly.",
                };
                onMessagesUpdate([...messages, systemMessage]);
            }
        } catch (err) {
            console.error('Escalation failed:', err);
        }
    };

    return (
        <div className="chat-window">
            {/* Test Mode Banner */}
            {testMode && (
                <div className="test-mode-banner">
                    ⚠️ TEST MODE - Conversations may not be saved
                </div>
            )}

            {/* Header */}
            <div className="chat-header">
                <h2>{title}</h2>
                <div className="header-actions">
                    {onReset && (
                        <button
                            className="reset-button"
                            onClick={onReset}
                            title="Start new conversation"
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginRight: '8px' }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                <path d="M2.5 2v6h6M21.5 22v-6h-6" />
                                <path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2" />
                            </svg>
                        </button>
                    )}
                    <button
                        className="escalate-button"
                        onClick={handleEscalate}
                        disabled={!conversationId}
                        title="Talk to a human"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </button>
                    <button className="close-button" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {isLoadingHistory && (
                    <div className="history-loading">
                        <div className="spinner"></div>
                        <span>Restoring conversation...</span>
                    </div>
                )}

                {!isLoadingHistory && messages.length === 0 && (
                    <div className="welcome-message">
                        <p>👋 {welcomeMessage || 'Hi there! How can I help you today?'}</p>
                        {starterQuestions && starterQuestions.length > 0 && (
                            <div className="starter-chips">
                                {starterQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        className="starter-chip"
                                        onClick={() => sendMessage(q.message)}
                                    >
                                        {q.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} apiUrl={apiUrl} tenantId={assistantId} />
                ))}
                {isLoading && (
                    <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                )}
                {error && (
                    <div className="error-message">{error}</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
    );
};
