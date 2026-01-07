// Main Widget Component
import React, { useState, useImperativeHandle, forwardRef } from 'react';
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
        role: 'user' | 'assistant';
        content: string;
        citations?: Array<{ text: string; sourceUrl?: string }>;
    }>>([]);

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
                    messages={messages}
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

