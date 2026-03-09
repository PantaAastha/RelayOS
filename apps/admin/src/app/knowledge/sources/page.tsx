'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useOrg } from '@/components/OrgContext';
import { useToast } from '@/components/Toast';
import UploadDrawer from './UploadDrawer';
import EmptyState from '@/components/EmptyState';
import KnowledgeHeaderPortal from '@/components/KnowledgeHeaderPortal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Document {
    id: string;
    title: string;
    sourceUrl?: string;
    docType: string;
    chunkCount: number;
    createdAt: string;
    assistantName?: string;
}

export default function KnowledgePage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const { orgId, loading: orgLoading } = useOrg();
    const { addToast } = useToast();

    // UI State
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedSource, setSelectedSource] = useState<string | null>(null);

    const fetchDocuments = useCallback(async () => {
        try {
            const headers: Record<string, string> = {};
            if (orgId) headers['X-Organization-ID'] = orgId;
            const res = await fetch(`${API_URL}/knowledge/documents`, { headers });
            const data = await res.json();
            setDocuments(Array.isArray(data?.documents) ? data.documents : Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        if (!orgLoading) fetchDocuments();
    }, [orgLoading, fetchDocuments]);

    const handleUploadSuccess = (count: number) => {
        addToast({
            title: 'Processing started',
            message: `${count} file${count !== 1 ? 's' : ''} uploaded. View progress in Ingestion Jobs →`,
            variant: 'success'
        });
        fetchDocuments(); // Refresh list
    };

    // Calculate aggregate stats for File Upload
    const totalDocs = documents.length;
    const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunkCount || 0), 0);
    // Find the most recent document date
    const lastUpload = documents.length > 0
        ? new Date(Math.max(...documents.map(d => new Date(d.createdAt).getTime())))
        : null;

    if (orgLoading || loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
            <KnowledgeHeaderPortal>
                <button
                    onClick={() => setIsUploadOpen(true)}
                    className="btn btn-primary btn-sm"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload Documents
                </button>
            </KnowledgeHeaderPortal>

            <div className="page-body" style={{ height: '100%', overflowY: 'auto' }}>
                {!selectedSource ? (
                    // LEVEL 1: SOURCE CARDS
                    <div>
                        {documents.length === 0 ? (
                            <EmptyState
                                title="No documents yet"
                                description="Upload your first document to start building your knowledge base."
                                action={
                                    <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary">
                                        Upload Documents
                                    </button>
                                }
                            />
                        ) : (
                            <div className="card-grid">
                                {/* File Upload Source Card */}
                                <div
                                    className="card"
                                    onClick={() => setSelectedSource('file-upload')}
                                >
                                    <div className="card-top">
                                        <div className="card-header">
                                            <div className="card-icon ci-docs">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                                                </svg>
                                            </div>
                                            <div className="card-meta">
                                                <span className="chip chip-live">
                                                    <span className="chip-dot" />
                                                    Active
                                                </span>
                                            </div>
                                        </div>
                                        <div className="card-name">File Upload</div>
                                        <div className="card-desc">Direct PDF, DOCX, & TXT uploads</div>
                                    </div>
                                    <div className="card-stats">
                                        <div className="stat">
                                            <div className="stat-val">{totalDocs}</div>
                                            <div className="stat-lbl">documents</div>
                                        </div>
                                        <div className="stat">
                                            <div className="stat-val">{totalChunks}</div>
                                            <div className="stat-lbl">chunks</div>
                                        </div>
                                        <div className="stat">
                                            <div className="stat-val trend-up">No</div>
                                            <div className="stat-lbl">errors</div>
                                        </div>
                                    </div>
                                    <div className="card-footer">
                                        <div style={{ fontSize: '11px', color: 'var(--t2)' }}>
                                            Last sync: {lastUpload ? lastUpload.toLocaleDateString() : 'Never'}
                                        </div>
                                        <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); fetchDocuments(); }}>
                                            Sync
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // LEVEL 2: DOCUMENT LIST
                    <div>
                        <div style={{ padding: '0 0 16px 0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button onClick={() => setSelectedSource(null)} className="more-btn" style={{ padding: '4px' }}>
                                ←
                            </button>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--t2)' }}>
                                Knowledge / <span style={{ color: 'var(--t1)' }}>File Upload</span>
                            </span>
                        </div>

                        <div className="card">
                            <div className="table-container" style={{ margin: 0, border: 'none' }}>
                                <table className="table" style={{ border: 'none' }}>
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Type</th>
                                            <th>Chunks</th>
                                            <th>Collections</th>
                                            <th>Added</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {documents.map((doc) => (
                                            <tr key={doc.id}>
                                                <td style={{ fontWeight: 500, color: 'var(--t1)' }}>{doc.title}</td>
                                                <td>
                                                    <span className="chip" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--t2)' }}>
                                                        {doc.docType || 'general'}
                                                    </span>
                                                </td>
                                                <td>{doc.chunkCount ?? 'Processing...'}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ color: 'var(--amber)', fontSize: '11px', fontWeight: 500 }}>
                                                            Not in any collection — this doc won't be retrieved by any assistant.
                                                        </span>
                                                        <Link href="/knowledge/collections" style={{ color: 'var(--blue)', fontSize: '11px', textDecoration: 'none' }}>
                                                            [Add →]
                                                        </Link>
                                                    </div>
                                                </td>
                                                <td style={{ color: 'var(--t2)' }}>
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <UploadDrawer
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onSuccess={handleUploadSuccess}
            />
        </div>
    );
}
