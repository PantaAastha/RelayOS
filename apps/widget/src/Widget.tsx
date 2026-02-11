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

interface StarterQuestion {
    label: string;
    message: string;
}

interface TenantWidgetConfig {
    welcomeMessage: string;
    starterQuestions: StarterQuestion[];
    persona: { name?: string };
    config: { primaryColor?: string; widgetTitle?: string };
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
    const [tenantConfig, setTenantConfig] = useState<TenantWidgetConfig | null>(null);

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

    // Fetch tenant widget config on mount
    useEffect(() => {
        const fetchWidgetConfig = async () => {
            try {
                const response = await fetch(`${config.apiUrl}/tenants/${config.tenantId}/widget-config`);
                if (response.ok) {
                    const data = await response.json();
                    setTenantConfig(data);
                }
            } catch (e) {
                console.warn('Failed to fetch widget config, using defaults', e);
            }
        };
        fetchWidgetConfig();
    }, [config.apiUrl, config.tenantId]);

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

    const handleReset = () => {
        setConversationId(null);
        setMessages([]);
        localStorage.removeItem(storageKey);
    };

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
                    messages={messages as any}
                    isLoadingHistory={isLoadingHistory}
                    welcomeMessage={tenantConfig?.welcomeMessage}
                    starterQuestions={tenantConfig?.starterQuestions}
                    onConversationStart={setConversationId}
                    onMessagesUpdate={setMessages}
                    onClose={() => setIsOpen(false)}
                    onReset={handleReset}
                />
            ) : (
                <WidgetButton onClick={() => setIsOpen(true)} testMode={testMode} />
            )}
        </div>
    );
});

Widget.displayName = 'Widget';

