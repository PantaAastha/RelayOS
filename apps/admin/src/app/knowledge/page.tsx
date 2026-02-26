'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Document {
    id: string;
    title: string;
    source: string;
    doc_type: string;
    chunk_count: number;
    created_at: string;
}

export default function KnowledgePage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [assistantId, setAssistantId] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('relayos_assistant_id');
        if (saved) setAssistantId(saved);
    }, []);

    const fetchDocuments = useCallback(async () => {
        if (!assistantId) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/knowledge/documents`, {
                headers: { 'X-Assistant-ID': assistantId },
            });
            const data = await res.json();
            setDocuments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setLoading(false);
        }
    }, [assistantId]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    if (!assistantId) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Knowledge</h1>
                    <p className="page-description">Manage your knowledge sources, ingestion jobs, and collections.</p>
                </div>
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <h3>No assistant connected</h3>
                    <p>Connect an assistant from the <Link href="/">Dashboard</Link> to manage knowledge.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Knowledge</h1>
                    <p className="page-description">Manage your knowledge sources and documents.</p>
                </div>
                <Link href="/documents/upload" className="btn btn-primary">
                    Upload Documents
                </Link>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : documents.length === 0 ? (
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <h3>No documents yet</h3>
                    <p>Upload your first document to start building your knowledge base.</p>
                    <Link href="/documents/upload" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
                        Upload Documents
                    </Link>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Source</th>
                                <th>Type</th>
                                <th>Chunks</th>
                                <th>Added</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc) => (
                                <tr key={doc.id}>
                                    <td style={{ fontWeight: 500 }}>{doc.title}</td>
                                    <td>
                                        <span className="badge badge-success">Upload</span>
                                    </td>
                                    <td>{doc.doc_type || '—'}</td>
                                    <td>{doc.chunk_count ?? '—'}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                        {new Date(doc.created_at).toLocaleDateString()}
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
