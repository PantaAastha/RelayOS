// Main Widget Component
import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { WidgetButton } from './components/WidgetButton';

interface WidgetConfig {
    apiUrl: string;
    assistantId: string;
    tenantId?: string; // Deprecated
    position?: 'bottom-right' | 'bottom-left';
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    mode?: 'popup' | 'side-panel' | 'floating-avatar';
    sidePanelBehavior?: 'push' | 'overlay';
    sidePanelWidth?: 'narrow' | 'standard' | 'wide';
    sidePanelTrigger?: 'handle' | 'button';
    avatar?: string;
    avatarSize?: 'medium' | 'large';
    avatarAnimation?: boolean;
    title?: string;
    testMode?: boolean;
}

interface StarterQuestion {
    label: string;
    message: string;
}

interface TenantWidgetConfig {
    assistantName: string;
    welcomeMessage: string;
    starterQuestions: StarterQuestion[];
    persona: { name?: string };
    config: {
        primaryColor?: string;
        backgroundColor?: string;
        textColor?: string;
        widgetTitle?: string;
        avatarIcon?: string;
        widgetMode?: 'popup' | 'side-panel' | 'floating-avatar';
        sidePanelBehavior?: 'push' | 'overlay';
        sidePanelWidth?: 'narrow' | 'standard' | 'wide';
        sidePanelTrigger?: 'handle' | 'button';
        avatarSize?: 'medium' | 'large';
        avatarAnimation?: boolean;
    };
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

    // Persistence Key (Migration: use assistantId, falling back to tenantId for backward compat)
    // We'll stick to 'relayos_widget_tenantId' format for now to avoid losing history for existing users
    // or we can migrate it. Let's use the new ID but check old key if empty.
    const storageKey = `relayos_widget_${config.assistantId}`;

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
    }, [config.assistantId]);

    // Save to storage when conversationId changes
    useEffect(() => {
        if (conversationId) {
            localStorage.setItem(storageKey, JSON.stringify({ conversationId }));
        }
    }, [conversationId, config.assistantId]);

    // Fetch tenant widget config on mount
    useEffect(() => {
        const fetchWidgetConfig = async () => {
            try {
                // CHANGED: Use /assistants alias /tenants
                const response = await fetch(`${config.apiUrl}/assistants/${config.assistantId}/widget-config`);
                if (response.ok) {
                    const data = await response.json();
                    setTenantConfig(data);
                } else {
                    // Fallback to /tenants if /assistants fails (migration safety)
                    const retry = await fetch(`${config.apiUrl}/tenants/${config.assistantId}/widget-config`);
                    if (retry.ok) {
                        const data = await retry.json();
                        setTenantConfig(data);
                    }
                }
            } catch (e) {
                console.warn('Failed to fetch widget config, using defaults', e);
            }
        };
        fetchWidgetConfig();
    }, [config.apiUrl, config.assistantId]);

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
    const primaryColor = config.primaryColor || tenantConfig?.config?.primaryColor || '#2563eb';
    const backgroundColor = config.backgroundColor || tenantConfig?.config?.backgroundColor || '#ffffff';
    const textColor = config.textColor || tenantConfig?.config?.textColor || '#1f2937';
    const mode = config.mode || tenantConfig?.config?.widgetMode || 'popup';
    const sidePanelBehavior = config.sidePanelBehavior || tenantConfig?.config?.sidePanelBehavior || 'push';
    const sidePanelWidth = config.sidePanelWidth || tenantConfig?.config?.sidePanelWidth || 'standard';
    const sidePanelTrigger = config.sidePanelTrigger || tenantConfig?.config?.sidePanelTrigger || 'handle';
    const avatar = config.avatar || tenantConfig?.config?.avatarIcon || '';
    const avatarSize = config.avatarSize || tenantConfig?.config?.avatarSize || 'medium';
    const avatarAnimation = config.avatarAnimation ?? tenantConfig?.config?.avatarAnimation ?? true;

    // Title priority: Config Prop -> Assistant Config -> Assistant Name -> Default
    const title = config.title || tenantConfig?.config?.widgetTitle || tenantConfig?.assistantName || 'Chat with us';

    const testMode = config.testMode || false;

    // Handle Push behavior logic for side panels
    useEffect(() => {
        if (isOpen && mode === 'side-panel' && sidePanelBehavior === 'push') {
            const width = sidePanelWidth === 'narrow' ? 320 : sidePanelWidth === 'wide' ? 540 : 420;
            const prop = position === 'bottom-left' ? 'padding-left' : 'padding-right';

            // To ensure the padding actively squishes content, we must enforce border-box on body
            const originalBoxSizing = document.body.style.boxSizing;
            document.body.style.boxSizing = 'border-box';
            document.body.style.setProperty(prop, `${width}px`);
            document.body.style.setProperty('transition', 'padding 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)');

            return () => {
                document.body.style.removeProperty(prop);
                // We leave the transition so it animates back smoothly, 
                // but realistically the user might notice a global transition change.
                setTimeout(() => {
                    document.body.style.removeProperty('transition');
                    document.body.style.boxSizing = originalBoxSizing;
                }, 350);
            };
        }
    }, [isOpen, mode, sidePanelBehavior, sidePanelWidth, position]);

    const handleReset = () => {
        setConversationId(null);
        setMessages([]);
        localStorage.removeItem(storageKey);
    };

    return (
        <div
            className="relayos-widget"
            data-position={position}
            data-mode={mode}
            data-side-panel-behavior={sidePanelBehavior}
            data-side-panel-width={sidePanelWidth}
            data-avatar-size={avatarSize}
            data-avatar-animation={avatarAnimation}
            style={{
                '--primary-color': primaryColor,
                '--bg-color': backgroundColor,
                '--text-color': textColor,
            } as React.CSSProperties}
        >
            {isOpen ? (
                <ChatWindow
                    apiUrl={config.apiUrl}
                    assistantId={config.assistantId}
                    tenantId={config.tenantId}
                    title={title}
                    avatar={avatar}
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
                <WidgetButton
                    onClick={() => setIsOpen(true)}
                    testMode={testMode}
                    avatar={avatar}
                    mode={mode}
                    sidePanelTrigger={sidePanelTrigger}
                />
            )}
        </div>
    );
});

Widget.displayName = 'Widget';
