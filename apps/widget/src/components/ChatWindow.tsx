import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: Array<{ text: string; sourceUrl?: string }>;
}

interface ChatWindowProps {
    apiUrl: string;
    tenantId: string;
    title: string;
    conversationId: string | null;
    messages: Message[];
    onConversationStart: (id: string) => void;
    onMessagesUpdate: (messages: Message[]) => void;
    onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    apiUrl,
    tenantId,
    title,
    conversationId,
    messages,
    onConversationStart,
    onMessagesUpdate,
    onClose,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
                    'X-Tenant-ID': tenantId,
                },
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
                    'X-Tenant-ID': tenantId,
                },
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
            {/* Header */}
            <div className="chat-header">
                <h2>{title}</h2>
                <div className="header-actions">
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
                {messages.length === 0 && (
                    <div className="welcome-message">
                        <p>👋 Hi there! How can I help you today?</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
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
