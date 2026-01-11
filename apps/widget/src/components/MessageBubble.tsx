import React from 'react';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    citations?: Array<{ text: string; sourceUrl?: string }>;
}

interface MessageBubbleProps {
    message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    return (
        <div className={`message-bubble ${message.role}`}>
            <div className="message-content">{message.content}</div>
            {message.citations && message.citations.length > 0 && (
                <div className="message-citations">
                    <span className="citation-label">Sources:</span>
                    {message.citations.map((citation, idx) => (
                        <span key={idx} className="citation">
                            {citation.sourceUrl ? (
                                <a href={citation.sourceUrl} target="_blank" rel="noopener noreferrer">
                                    {citation.text}
                                </a>
                            ) : (
                                <span>{citation.text}</span>
                            )}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
