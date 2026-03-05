'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useOrg } from '@/components/OrgContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Conversation {
    id: string;
    createdAt: string;
    status: string;
    messageCount: number;
    lastMessage?: string;
    assistantName?: string;
}

export default function ConversationsPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const { orgId, loading: orgLoading } = useOrg();

    const fetchConversations = useCallback(async () => {
        try {
            const headers: Record<string, string> = {};
            if (orgId) headers['X-Organization-ID'] = orgId;
            const res = await fetch(`${API_URL}/conversation`, { headers });
            const data = await res.json();
            setConversations(data.conversations || []);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        if (!orgLoading) fetchConversations();
    }, [orgLoading, fetchConversations]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="chip chip-live"><span className="chip-dot" />Active</span>;
            case 'handed_off':
                return <span className="chip chip-attn"><span className="chip-dot" />Handed Off</span>;
            case 'closed':
                return <span className="chip chip-conservative">Closed</span>;
            default:
                return <span className="chip chip-draft">{status}</span>;
        }
    };

    if (orgLoading || loading) {
        return (
            <>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Conversations</h1>
                    </div>
                </div>
                <div className="page-body">
                    <div className="loading">Loading...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Conversations</h1>
                    <p className="page-description">View chat transcripts and user interactions</p>
                </div>
            </div>

            <div className="page-body">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : conversations.length === 0 ? (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <h3>No conversations yet</h3>
                        <p>Conversations will appear here once users start chatting with your widget</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Preview</th>
                                    <th>Messages</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th style={{ width: '100px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conversations.map((conv) => (
                                    <tr key={conv.id}>
                                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {conv.lastMessage || 'No messages'}
                                        </td>
                                        <td>{conv.messageCount}</td>
                                        <td>{getStatusBadge(conv.status)}</td>
                                        <td>{formatDate(conv.createdAt)}</td>
                                        <td>
                                            <Link
                                                href={`/conversations/${conv.id}`}
                                                className="btn btn-secondary btn-sm"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
