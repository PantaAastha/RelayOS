// Main Widget Component
import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { WidgetButton } from './components/WidgetButton';

interface WidgetConfig {
    apiUrl: string;
    tenantId: string;
    position?: 'bottom-right' | 'bottom-left';
    primaryColor?: string;
    title?: string;
    testMode?: boolean;
}

interface WidgetRef {
    open: () => void;
    close: () => void;
}

interface WidgetProps {
    config: WidgetConfig;
}

export const Widget = forwardRef<WidgetRef, WidgetProps>(({ config }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Array<{
        id: string;
        role: 'user' | 'assistant' | 'system';
        content: string;
        citations?: Array<{ text: string; sourceUrl?: string }>;
    }>>([]);

    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Persistence Key
    const storageKey = `relayos_widget_${config.tenantId}`;

    // Load from storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const { conversationId: savedId } = JSON.parse(saved);
                if (savedId) {
                    setConversationId(savedId);
                    // Fetch latest history from API
                    fetchConversation(savedId);
                }
            } catch (e) {
                console.error('Failed to parse saved conversation', e);
            }
        }
    }, [config.tenantId]);

    // Save to storage when conversationId changes
    useEffect(() => {
        if (conversationId) {
            localStorage.setItem(storageKey, JSON.stringify({ conversationId }));
        }
    }, [conversationId, config.tenantId]);

    const fetchConversation = async (id: string) => {
        setIsLoadingHistory(true);
        try {
            const response = await fetch(`${config.apiUrl}/conversation/${id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.messages) {
                    setMessages(data.messages);
                }
            }
        } catch (e) {
            console.error('Failed to fetch conversation history', e);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useImperativeHandle(ref, () => ({
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
    }));

    const position = config.position || 'bottom-right';
    const primaryColor = config.primaryColor || '#2563eb';
    const title = config.title || 'Chat with us';
    const testMode = config.testMode || false;

    return (
        <div
            className="relayos-widget"
            data-position={position}
            style={{ '--primary-color': primaryColor } as React.CSSProperties}
        >
            {isOpen ? (
                <ChatWindow
                    apiUrl={config.apiUrl}
                    tenantId={config.tenantId}
                    title={title}
                    testMode={testMode}
                    conversationId={conversationId}
                    messages={messages as any} // Cast to match ChatWindow props if needed
                    isLoadingHistory={isLoadingHistory}
                    onConversationStart={setConversationId}
                    onMessagesUpdate={setMessages}
                    onClose={() => setIsOpen(false)}
                />
            ) : (
                <WidgetButton onClick={() => setIsOpen(true)} testMode={testMode} />
            )}
        </div>
    );
});

Widget.displayName = 'Widget';

