import React from 'react';

interface WidgetButtonProps {
    onClick: () => void;
    testMode?: boolean;
    avatar?: string;
    mode?: 'popup' | 'side-panel' | 'floating-avatar';
    sidePanelTrigger?: 'handle' | 'button';
}

export const WidgetButton: React.FC<WidgetButtonProps> = ({ onClick, testMode, avatar, mode, sidePanelTrigger }) => {
    return (
        <div className="widget-button-container">
            {testMode && (
                <div className="test-mode-badge">TEST</div>
            )}
            <button
                className={`widget-button ${mode === 'side-panel' && sidePanelTrigger === 'handle' ? 'trigger-handle' : ''}`}
                onClick={onClick}
                aria-label="Open chat"
            >
                {mode === 'side-panel' && sidePanelTrigger === 'handle' ? (
                    <div className="handle-content">
                        {avatar ? <span className="handle-avatar">{avatar}</span> : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        )}
                        <span className="handle-label">Ask a question</span>
                    </div>
                ) : avatar ? (
                    <span style={{ fontSize: '26px' }}>{avatar}</span>
                ) : (
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                )}
            </button>
        </div>
    );
};

