import React from 'react';

interface WidgetButtonProps {
    onClick: () => void;
    testMode?: boolean;
}

export const WidgetButton: React.FC<WidgetButtonProps> = ({ onClick, testMode }) => {
    return (
        <div className="widget-button-container">
            {testMode && (
                <div className="test-mode-badge">TEST</div>
            )}
            <button
                className="widget-button"
                onClick={onClick}
                aria-label="Open chat"
            >
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
            </button>
        </div>
    );
};

