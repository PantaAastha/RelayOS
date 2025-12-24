import React, { useState, useRef, KeyboardEvent } from 'react';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = () => {
        if (value.trim() && !disabled) {
            onSend(value);
            setValue('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="chat-input">
            <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={disabled}
                rows={1}
            />
            <button
                onClick={handleSubmit}
                disabled={disabled || !value.trim()}
                aria-label="Send message"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
            </button>
        </div>
    );
};
