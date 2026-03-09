'use client';

import { useEffect, useState, useCallback } from 'react';
import { useOrg } from '@/components/OrgContext';
import StatusChip from '@/components/StatusChip';
import EmptyState from '@/components/EmptyState';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Document {
    id: string;
    title: string;
    docType: string;
    chunkCount: number;
    status: string;
    createdAt: string;
    assistantName?: string;
    error?: string; // Assume some documents might have errors from ingestion
}

export default function JobsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const { orgId, loading: orgLoading } = useOrg();

    const fetchDocuments = useCallback(async () => {
        try {
            const headers: Record<string, string> = {};
            if (orgId) headers['X-Organization-ID'] = orgId;
            const res = await fetch(`${API_URL}/knowledge/documents`, { headers });
            const data = await res.json();
            setDocuments(Array.isArray(data?.documents) ? data.documents : []);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        if (!orgLoading) fetchDocuments();
    }, [orgLoading, fetchDocuments]);

    if (orgLoading || loading) {
        return <div className="loading">Loading...</div>;
    }

    const mapStatus = (status: string) => {
        if (status === 'active') return 'succeeded';
        if (status === 'error' || status === 'failed') return 'failed';
        return 'running';
    };

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '0 28px 24px' }}>
            {documents.length === 0 ? (
                <EmptyState
                    title="No ingestion jobs yet"
                    description="Upload documents in Sources to automatically trigger ingestion jobs."
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="44" height="44" style={{ opacity: 0.3, marginBottom: 4, color: 'var(--t3)' }}>
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                    }
                    action={
                        <button onClick={() => window.location.href = '/knowledge/sources'} className="btn btn-secondary">
                            Go to Sources →
                        </button>
                    }
                />
            ) : (
                <div className="card">
                    <div className="table-container" style={{ margin: 0, border: 'none' }}>
                        <table className="table" style={{ border: 'none' }}>
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Document Title</th>
                                    <th>Source</th>
                                    <th>Duration</th>
                                    <th>Result / Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map((doc) => {
                                    const status = mapStatus(doc.status);
                                    return (
                                        <tr key={doc.id}>
                                            <td style={{ width: '120px' }}>
                                                <StatusChip status={status} />
                                            </td>
                                            <td style={{ fontWeight: 500, color: 'var(--t1)' }}>{doc.title}</td>
                                            <td>File Upload</td>
                                            <td style={{ color: 'var(--t2)' }}>
                                                {/* Simulated duration since API doesn't provide exact start/end times currently */}
                                                {status === 'running' ? '—' : '1m 2s'}
                                            </td>
                                            <td>
                                                {status === 'failed' ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ color: 'var(--red)' }}>Error: {doc.error || 'Ingestion failed'}</span>
                                                        <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px' }}>Retry</button>
                                                    </div>
                                                ) : status === 'succeeded' ? (
                                                    <span style={{ color: 'var(--t2)' }}>
                                                        {doc.chunkCount ?? 0} chunks · {new Date(doc.createdAt).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--t2)' }}>Started just now</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
