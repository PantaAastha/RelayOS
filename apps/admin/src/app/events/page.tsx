'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Event {
    id: number;
    tenant_id: string;
    conversation_id: string | null;
    event_type: string;
    payload: Record<string, unknown>;
    created_at: string;
}

const EVENT_ICONS: Record<string, string> = {
    'conversation.started': '💬',
    'conversation.ended': '✅',
    'message.received': '📩',
    'message.sent': '📤',
    'agent.invoked': '⚡',
    'agent.completed': '✓',
    'agent.failed': '❌',
    'rag.searched': '🔍',
    'rag.cited': '📎',
    'rag.refused': '🚫',
    'workflow.triggered': '⚙️',
    'workflow.completed': '✓',
    'workflow.failed': '❌',
    'handoff.requested': '🙋',
    'handoff.completed': '👤',
    'n8n.handoff.triggered': '🔗',
    'n8n.lead.triggered': '🔗',
};

const EVENT_CATEGORIES: Record<string, string> = {
    'conversation': 'conversation',
    'message': 'message',
    'agent': 'agent',
    'rag': 'rag',
    'workflow': 'workflow',
    'handoff': 'handoff',
    'n8n': 'workflow',
};

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState('');
    const [eventTypes, setEventTypes] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    useEffect(() => {
        const savedTenantId = localStorage.getItem('relayos_tenant_id');
        if (savedTenantId) {
            setTenantId(savedTenantId);
        }
    }, []);

    const fetchEvents = async () => {
        if (!tenantId) return;

        try {
            const params = new URLSearchParams();
            if (selectedType) params.append('type', selectedType);
            if (searchQuery) params.append('search', searchQuery);
            params.append('limit', '100');

            const res = await fetch(`${API_URL}/events?${params}`, {
                headers: { 'X-Tenant-ID': tenantId },
            });
            const data = await res.json();
            setEvents(data.events || []);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEventTypes = async () => {
        try {
            const res = await fetch(`${API_URL}/events/types`);
            const data = await res.json();
            setEventTypes(data.types || []);
        } catch (error) {
            console.error('Failed to fetch event types:', error);
        }
    };

    useEffect(() => {
        fetchEventTypes();
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [tenantId, selectedType, searchQuery]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchEvents, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, tenantId, selectedType, searchQuery]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const getEventCategory = (eventType: string) => {
        const prefix = eventType.split('.')[0];
        return EVENT_CATEGORIES[prefix] || 'other';
    };

    const getEventPreview = (event: Event) => {
        const payload = event.payload;

        if (event.event_type === 'rag.searched') {
            const chunks = payload.chunksRetrieved as number || 0;
            const topScore = payload.topScore as number || 0;
            const latency = payload.latencyMs as number;
            return `${chunks} chunks, top: ${(topScore * 100).toFixed(0)}%${latency ? ` • ${latency}ms` : ''}`;
        }

        if (event.event_type === 'message.received' || event.event_type === 'message.sent') {
            const content = payload.content as string;
            return content ? `"${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"` : '';
        }

        if (event.event_type === 'agent.completed') {
            const duration = payload.durationMs as number;
            const tokens = payload.tokensUsed as number;
            return `${duration}ms${tokens ? ` • ${tokens} tokens` : ''}`;
        }

        if (event.event_type === 'agent.failed') {
            return payload.error as string || 'Unknown error';
        }

        return '';
    };

    if (!tenantId) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Events</h1>
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
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Events</h1>
                    <p className="page-description">Observability timeline for RAG and conversations</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label className="auto-refresh-toggle">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        <span>Auto-refresh</span>
                    </label>
                    <button className="btn btn-ghost btn-sm" onClick={fetchEvents} title="Refresh">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 16h5v5" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="events-filters">
                <select
                    className="form-input"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    style={{ width: '200px' }}
                >
                    <option value="">All Types</option>
                    {eventTypes.map(type => (
                        <option key={type} value={type}>
                            {EVENT_ICONS[type] || '•'} {type}
                        </option>
                    ))}
                </select>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1, maxWidth: '300px' }}
                />
                <span className="events-count">{events.length} events</span>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : events.length === 0 ? (
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <h3>No events yet</h3>
                    <p>Events will appear here as users interact with your AI assistant</p>
                </div>
            ) : (
                <div className="events-timeline">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className={`event-card event-${getEventCategory(event.event_type)} ${expandedId === event.id ? 'expanded' : ''}`}
                        >
                            <div
                                className="event-header"
                                onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                            >
                                <div className="event-time">
                                    <span className="event-time-time">{formatTime(event.created_at)}</span>
                                    <span className="event-time-date">{formatDate(event.created_at)}</span>
                                </div>
                                <div className="event-icon">{EVENT_ICONS[event.event_type] || '•'}</div>
                                <div className="event-content">
                                    <div className="event-type">{event.event_type}</div>
                                    <div className="event-preview">{getEventPreview(event)}</div>
                                </div>
                                <div className="event-expand">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
                                        width: '16px',
                                        height: '16px',
                                        transform: expandedId === event.id ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s'
                                    }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </div>
                            </div>
                            {expandedId === event.id && (
                                <div className="event-details">
                                    {event.conversation_id && (
                                        <div className="event-detail-row">
                                            <span className="event-detail-label">Conversation:</span>
                                            <code className="event-detail-value">{event.conversation_id}</code>
                                        </div>
                                    )}
                                    <div className="event-detail-row">
                                        <span className="event-detail-label">Payload:</span>
                                    </div>
                                    <pre className="event-payload">{JSON.stringify(event.payload, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
