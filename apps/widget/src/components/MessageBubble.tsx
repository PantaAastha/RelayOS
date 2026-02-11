import React, { useState } from 'react';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    citations?: Array<{ text: string; sourceUrl?: string }>;
    confidence?: number;
    grade?: string;
}

interface MessageBubbleProps {
    message: Message;
    apiUrl?: string;
    tenantId?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, apiUrl, tenantId }) => {
    const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);

    const submitFeedback = async (type: 'positive' | 'negative') => {
        if (feedbackGiven || !apiUrl || !tenantId) return;

        try {
            const res = await fetch(`${apiUrl}/conversation/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-ID': tenantId,
                },
                body: JSON.stringify({ messageId: message.id, type }),
            });
            if (res.ok) {
                setFeedbackGiven(type);
            }
        } catch (err) {
            console.error('Feedback failed:', err);
        }
    };

    const getConfidenceBadge = () => {
        if (message.role !== 'assistant') return null;

        const confidence = message.confidence;
        // Debug

        if (typeof confidence !== 'number') {
            return null; // Don't show N/A anymore, just hide if invalid
        }

        const percent = Math.round(confidence * 100);
        let className = 'confidence-badge confidence-high';
        if (message.grade === 'UNSUPPORTED' || percent < 50) {
            className = 'confidence-badge confidence-low';
        } else if (message.grade === 'PARTIAL' || percent < 70) {
            className = 'confidence-badge confidence-medium';
        }

        return <span className={className}>{percent}%</span>;
    };

    return (
        <div className={`message-bubble ${message.role}`}>
            <div className="message-content">{message.content}</div>

            {/* Confidence and Feedback - only for substantive responses with grading */}
            {message.role === 'assistant' && typeof message.confidence === 'number' && (
                <div className="message-actions">
                    {getConfidenceBadge()}
                    <button
                        className={`feedback-btn ${feedbackGiven === 'positive' ? 'active' : ''}`}
                        onClick={() => submitFeedback('positive')}
                        disabled={!!feedbackGiven}
                        title="Helpful"
                    >
                        👍
                    </button>
                    <button
                        className={`feedback-btn ${feedbackGiven === 'negative' ? 'active' : ''}`}
                        onClick={() => submitFeedback('negative')}
                        disabled={!!feedbackGiven}
                        title="Not helpful"
                    >
                        👎
                    </button>
                </div>
            )}

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
