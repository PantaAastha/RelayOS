'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Conversation {
    id: string;
    createdAt: string;
    status: string;
    messageCount: number;
    lastMessage?: string;
}

export default function ConversationsPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState('');

    useEffect(() => {
        const savedTenantId = localStorage.getItem('relayos_tenant_id');
        if (savedTenantId) {
            setTenantId(savedTenantId);
        }
    }, []);

    useEffect(() => {
        if (!tenantId) return;

        const fetchConversations = async () => {
            try {
                const res = await fetch(`${API_URL}/conversation`, {
                    headers: { 'X-Tenant-ID': tenantId },
                });
                const data = await res.json();
                setConversations(data.conversations || []);
            } catch (error) {
                console.error('Failed to fetch conversations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [tenantId]);

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
                return <span className="badge badge-success">Active</span>;
            case 'handed_off':
                return <span className="badge badge-warning">Handed Off</span>;
            case 'closed':
                return <span className="badge badge-error">Closed</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    if (!tenantId) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Conversations</h1>
                </div>
                <div className="empty-state">
                    <p>Please set your tenant ID on the dashboard first.</p>
                    <Link href="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Conversations</h1>
                <p className="page-description">View chat transcripts and user interactions</p>
            </div>

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
                                            className="btn btn-secondary"
                                            style={{ padding: '4px 10px', fontSize: '12px' }}
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
    );
}
