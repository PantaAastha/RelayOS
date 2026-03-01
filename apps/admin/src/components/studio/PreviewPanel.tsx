'use client';

import { useState, useRef, useEffect } from 'react';
import { PreviewMessage } from '@/hooks/usePreviewChat';

interface PreviewPanelProps {
    assistantName: string;
    welcomeMessage: string;
    starterQuestions: string[];
    messages: PreviewMessage[];
    isStreaming: boolean;
    onSend: (content: string) => void;
    onClear: () => void;
}

export default function PreviewPanel({
    assistantName,
    welcomeMessage,
    starterQuestions,
    messages,
    isStreaming,
    onSend,
    onClear,
}: PreviewPanelProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || isStreaming) return;
        onSend(input.trim());
        setInput('');
    };

    const toggleCitations = (messageId: string) => {
        setExpandedCitations(prev => {
            const next = new Set(prev);
            if (next.has(messageId)) next.delete(messageId);
            else next.add(messageId);
            return next;
        });
    };

    const gradeColor = (grade?: string | null) => {
        switch (grade) {
            case 'SUPPORTED': return 'var(--mint)';
            case 'PARTIAL': return 'var(--amber)';
            case 'UNSUPPORTED': return 'var(--red)';
            default: return 'var(--t3)';
        }
    };

    const gradeBg = (grade?: string | null) => {
        switch (grade) {
            case 'SUPPORTED': return 'var(--mint1)';
            case 'PARTIAL': return 'var(--amb1)';
            case 'UNSUPPORTED': return 'rgba(255,80,80,0.08)';
            default: return 'var(--elevated)';
        }
    };

    const delegationLabel = (decision?: string) => {
        switch (decision) {
            case 'escalate': return '⚠ Would escalate';
            case 'answer_with_caveat': return '⚡ Answer with caveat';
            default: return null;
        }
    };

    const delegationColor = (decision?: string) => {
        switch (decision) {
            case 'escalate': return { bg: 'rgba(255,80,80,0.08)', color: 'var(--red)', border: '1px solid rgba(255,80,80,0.2)' };
            case 'answer_with_caveat': return { bg: 'var(--amb1)', color: 'var(--amber)', border: '1px solid var(--amb2)' };
            default: return null;
        }
    };

    return (
        <div className="preview-panel">
            {/* Header */}
            <div className="preview-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="live-dot" />
                    <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase' as const, color: 'var(--t2)' }}>
                        Live Preview
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="ctx-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>
                        📚 Saved knowledge
                    </span>
                    {messages.length > 0 && (
                        <button
                            onClick={onClear}
                            style={{
                                background: 'none', border: 'none', color: 'var(--t3)',
                                cursor: 'pointer', fontSize: '9px', padding: '2px 4px',
                            }}
                            title="Clear chat"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Messages area */}
            <div className="preview-messages">
                {messages.length === 0 ? (
                    <>
                        {/* Welcome card */}
                        <div className="preview-welcome">
                            <div className="preview-welcome-title">{assistantName || 'Assistant'}</div>
                            <div className="preview-welcome-msg">
                                {welcomeMessage || 'Hi! How can I help you today?'}
                            </div>
                        </div>

                        {/* Starter chips */}
                        {starterQuestions.length > 0 && (
                            <div className="starter-chips">
                                {starterQuestions.filter(Boolean).map((q, i) => (
                                    <button
                                        key={i}
                                        className="starter-chip"
                                        onClick={() => onSend(q)}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id}>
                            <div className={msg.role === 'user' ? 'msg-user' : 'msg-assistant'}>
                                {msg.role === 'assistant' && (
                                    <div className="msg-avatar">
                                        {(assistantName || 'A').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="msg-content">
                                    {msg.content || (isStreaming && msg.role === 'assistant' ? (
                                        <span className="typing-indicator">
                                            <span /><span /><span />
                                        </span>
                                    ) : '')}
                                </div>
                            </div>

                            {/* Metadata row for assistant messages */}
                            {msg.role === 'assistant' && msg.grade && (
                                <div className="msg-meta">
                                    {/* Confidence badge */}
                                    <span
                                        className="confidence-badge"
                                        style={{
                                            background: gradeBg(msg.grade),
                                            color: gradeColor(msg.grade),
                                            border: `1px solid ${gradeColor(msg.grade)}22`,
                                        }}
                                    >
                                        {msg.grade === 'SUPPORTED' ? '✓' : msg.grade === 'PARTIAL' ? '~' : '✗'}{' '}
                                        {msg.grade} · {Math.round((msg.confidence || 0) * 100)}%
                                    </span>

                                    {/* Delegation indicator */}
                                    {msg.thresholdTriggered && msg.delegationDecision && delegationLabel(msg.delegationDecision) && (
                                        <span
                                            className="delegation-badge"
                                            style={{
                                                ...delegationColor(msg.delegationDecision),
                                                padding: '2px 7px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                fontWeight: 500,
                                            }}
                                        >
                                            {delegationLabel(msg.delegationDecision)}
                                        </span>
                                    )}

                                    {/* Citations toggle */}
                                    {msg.citations && msg.citations.length > 0 && (
                                        <button
                                            className="citations-toggle"
                                            onClick={() => toggleCitations(msg.id)}
                                        >
                                            📎 {msg.citations.length} source{msg.citations.length > 1 ? 's' : ''}
                                            {expandedCitations.has(msg.id) ? ' ▴' : ' ▾'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Expanded citations */}
                            {msg.citations && expandedCitations.has(msg.id) && (
                                <div className="citations-list">
                                    {msg.citations.map((c, i) => (
                                        <div key={i} className="citation-card">
                                            <div className="citation-title">Source {i + 1}</div>
                                            <div className="citation-text">{c.text}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="preview-input">
                <div className="preview-input-wrap">
                    <input
                        className="preview-input-field"
                        placeholder="Ask a question to preview..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        disabled={isStreaming}
                    />
                    <button
                        className="preview-send"
                        onClick={handleSend}
                        disabled={!input.trim() || isStreaming}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
