'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: Array<{ docId: string; chunkId: string; text: string }>;
}

interface Conversation {
    id: string;
    tenantId: string;
    status: string;
    messages: Message[];
}

export default function ConversationDetailPage() {
    const params = useParams();
    const conversationId = params.id as string;

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConversation = async () => {
            try {
                const res = await fetch(`${API_URL}/conversation/${conversationId}`);
                const data = await res.json();
                setConversation(data);
            } catch (error) {
                console.error('Failed to fetch conversation:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConversation();
    }, [conversationId]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="badge badge-success">Active</span>;
            case 'handed_off':
                return <span className="badge badge-warning">Handed Off</span>;
            case 'closed':
                return <span className="badge badge-error">Closed</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!conversation) {
        return (
            <div className="empty-state">
                <h3>Conversation not found</h3>
                <Link href="/conversations" className="btn btn-primary" style={{ marginTop: '16px' }}>
                    Back to Conversations
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <Link href="/conversations" style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back to Conversations
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 className="page-title" style={{ margin: 0 }}>Conversation</h1>
                    {getStatusBadge(conversation.status)}
                </div>
                <p className="page-description" style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '12px' }}>
                    {conversation.id}
                </p>
            </div>

            <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '800px'
            }}>
                <div className="message-list">
                    {conversation.messages.map((msg) => (
                        <div key={msg.id} className={`message message-${msg.role}`}>
                            <div>{msg.content}</div>
                            {msg.citations && msg.citations.length > 0 && (
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Sources
                                    </div>
                                    {msg.citations.map((c, i) => (
                                        <div key={i} style={{ fontSize: '12px', color: 'rgba(0,0,0,0.7)', marginBottom: '4px' }}>
                                            [{i + 1}] {c.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {conversation.messages.length === 0 && (
                    <div className="empty-state">
                        <p>No messages in this conversation</p>
                    </div>
                )}
            </div>
        </div>
    );
}
