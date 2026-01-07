'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Document {
    id: string;
    title: string;
    docType?: string;
    createdAt: string;
    chunkCount?: number;
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
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

        const fetchDocuments = async () => {
            try {
                const res = await fetch(`${API_URL}/knowledge/documents`, {
                    headers: { 'X-Tenant-ID': tenantId },
                });
                const data = await res.json();
                setDocuments(data.documents || []);
            } catch (error) {
                console.error('Failed to fetch documents:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, [tenantId]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await fetch(`${API_URL}/knowledge/documents/${id}`, {
                method: 'DELETE',
                headers: { 'X-Tenant-ID': tenantId },
            });
            setDocuments(documents.filter(d => d.id !== id));
        } catch (error) {
            console.error('Failed to delete document:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (!tenantId) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Documents</h1>
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
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Documents</h1>
                    <p className="page-description">Manage your knowledge base</p>
                </div>
                <Link href="/documents/upload" className="btn btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Upload Document
                </Link>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : documents.length === 0 ? (
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <h3>No documents yet</h3>
                    <p>Upload your first document to start building your knowledge base</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Created</th>
                                <th style={{ width: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc) => (
                                <tr key={doc.id}>
                                    <td>{doc.title}</td>
                                    <td>
                                        <span className="badge badge-success">{doc.docType || 'general'}</span>
                                    </td>
                                    <td>{formatDate(doc.createdAt)}</td>
                                    <td>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '4px 10px', fontSize: '12px' }}
                                            onClick={() => handleDelete(doc.id)}
                                        >
                                            Delete
                                        </button>
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
