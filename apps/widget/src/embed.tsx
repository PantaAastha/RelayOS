// RelayOS Widget Embed Entry Point
// This file creates a Shadow DOM container and renders the widget

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Widget } from './Widget';
import styles from './styles.css?inline';

interface RelayOSConfig {
    apiUrl: string;
    tenantId: string;
    position?: 'bottom-right' | 'bottom-left';
    primaryColor?: string;
    title?: string;
}

declare global {
    interface Window {
        RelayOS?: {
            init: (config: RelayOSConfig) => void;
            open: () => void;
            close: () => void;
        };
    }
}

function createWidget(config: RelayOSConfig) {
    // Create container element
    const container = document.createElement('div');
    container.id = 'relayos-widget-container';
    document.body.appendChild(container);

    // Attach Shadow DOM for style isolation
    const shadowRoot = container.attachShadow({ mode: 'open' });

    // Inject styles into Shadow DOM
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    shadowRoot.appendChild(styleSheet);

    // Create mount point inside Shadow DOM
    const mountPoint = document.createElement('div');
    mountPoint.id = 'relayos-mount';
    shadowRoot.appendChild(mountPoint);

    // Render React app
    const root = createRoot(mountPoint);

    let widgetRef: { open: () => void; close: () => void } | null = null;

    root.render(
        <React.StrictMode>
            <Widget
                config={config}
                ref={(ref) => { widgetRef = ref; }}
            />
        </React.StrictMode>
    );

    return {
        open: () => widgetRef?.open(),
        close: () => widgetRef?.close(),
    };
}

// Global initialization
let widgetInstance: ReturnType<typeof createWidget> | null = null;

window.RelayOS = {
    init: (config: RelayOSConfig) => {
        if (widgetInstance) {
            console.warn('RelayOS widget already initialized');
            return;
        }
        widgetInstance = createWidget(config);
    },
    open: () => widgetInstance?.open(),
    close: () => widgetInstance?.close(),
};

// Auto-initialize if config is present
const script = document.currentScript as HTMLScriptElement | null;
if (script) {
    const apiUrl = script.dataset.apiUrl;
    const tenantId = script.dataset.tenantId;

    if (apiUrl && tenantId) {
        window.RelayOS.init({
            apiUrl,
            tenantId,
            position: (script.dataset.position as 'bottom-right' | 'bottom-left') || 'bottom-right',
            primaryColor: script.dataset.primaryColor,
            title: script.dataset.title,
        });
    }
}
