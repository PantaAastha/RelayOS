'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Document {
    id: string;
    title: string;
    docType?: string;
    createdAt: string;
    version?: number;
}

interface Toast {
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [assistantId, setAssistantId] = useState('');
    const [reingestingId, setReingestingId] = useState<string | null>(null);
    const [reingestingAll, setReingestingAll] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const showToast = (type: Toast['type'], title: string, message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    useEffect(() => {
        const savedAssistantId = localStorage.getItem('relayos_assistant_id') || localStorage.getItem('relayos_tenant_id');
        if (savedAssistantId) {
            setAssistantId(savedAssistantId);
        }
    }, []);

    const fetchDocuments = useCallback(async () => {
        if (!assistantId) return;
        try {
            const res = await fetch(`${API_URL}/knowledge/documents`, {
                headers: { 'X-Assistant-ID': assistantId },
            });
            const data = await res.json();
            setDocuments(data.documents || []);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setLoading(false);
        }
    }, [assistantId]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleDeleteClick = (id: string) => {
        setDeleteTargetId(id);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        try {
            await fetch(`${API_URL}/knowledge/documents/${deleteTargetId}`, {
                method: 'DELETE',
                headers: { 'X-Assistant-ID': assistantId },
            });
            setDocuments(documents.filter(d => d.id !== deleteTargetId));
            showToast('success', 'Deleted', 'Document removed from knowledge base');
        } catch (error) {
            console.error('Failed to delete document:', error);
            showToast('error', 'Error', 'Failed to delete document');
        } finally {
            setDeleteTargetId(null);
        }
    };

    const handleReingest = async (id: string) => {
        setReingestingId(id);
        try {
            const res = await fetch(`${API_URL}/knowledge/documents/${id}/reingest`, {
                method: 'POST',
                headers: { 'X-Assistant-ID': assistantId },
            });
            const data = await res.json();
            if (data.success) {
                setDocuments(docs => docs.map(d =>
                    d.id === id ? { ...d, version: data.document.version } : d
                ));
                showToast('success', 'Refreshed', `Updated to v${data.document.version}`);
            }
        } catch (error) {
            console.error('Failed to re-ingest document:', error);
            showToast('error', 'Error', 'Failed to refresh document');
        } finally {
            setReingestingId(null);
        }
    };

    const handleReingestAll = async () => {
        setShowConfirmModal(false);
        setReingestingAll(true);
        showToast('info', 'Processing', `Refreshing ${documents.length} documents...`);

        try {
            const res = await fetch(`${API_URL}/knowledge/reingest-all`, {
                method: 'POST',
                headers: { 'X-Assistant-ID': assistantId },
            });
            const data = await res.json();

            if (data.failed === 0) {
                showToast('success', 'Complete', `All ${data.processed} documents refreshed`);
            } else {
                showToast('error', 'Partial Success', `${data.processed}/${data.total} succeeded, ${data.failed} failed`);
            }
            await fetchDocuments();
        } catch (error) {
            console.error('Failed to re-ingest all documents:', error);
            showToast('error', 'Error', 'Failed to refresh documents');
        } finally {
            setReingestingAll(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const RefreshIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
        </svg>
    );

    if (!assistantId) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Documents</h1>
                </div>
                <div className="empty-state">
                    <p>Please set your assistant ID on the dashboard first.</p>
                    <Link href="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Toast notifications */}
            {toasts.length > 0 && (
                <div className="toast-container">
                    {toasts.map(toast => (
                        <div key={toast.id} className={`toast toast-${toast.type}`}>
                            <div className="toast-title">{toast.title}</div>
                            <div className="toast-message">{toast.message}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirmation modal */}
            {showConfirmModal && (
                <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">Refresh All Documents?</h3>
                        <p className="modal-message">
                            This will re-process {documents.length} documents with the current chunker settings.
                            This may take a few minutes.
                        </p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowConfirmModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={handleReingestAll}>
                                Refresh All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTargetId && (
                <div className="modal-overlay" onClick={() => setDeleteTargetId(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">Delete Document?</h3>
                        <p className="modal-message">
                            Are you sure you want to delete this document? This action cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => setDeleteTargetId(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={confirmDelete}
                                style={{ background: 'var(--error)', borderColor: 'var(--error)' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Documents</h1>
                    <p className="page-description">Manage your knowledge base</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {documents.length > 0 && (
                        <button
                            className={`btn btn-ghost btn-sm ${reingestingAll ? 'spinning' : ''}`}
                            onClick={() => setShowConfirmModal(true)}
                            disabled={reingestingAll}
                            title="Re-process all documents"
                        >
                            <RefreshIcon />
                            {reingestingAll ? 'Processing...' : 'Refresh All'}
                        </button>
                    )}
                    <Link href="/documents/upload" className="btn btn-primary btn-sm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Upload
                    </Link>
                </div>
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
                                <th>Version</th>
                                <th>Created</th>
                                <th style={{ width: '100px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc) => (
                                <tr key={doc.id}>
                                    <td>{doc.title}</td>
                                    <td>
                                        <span className="badge badge-success">{doc.docType || 'general'}</span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{doc.version || 1}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{formatDate(doc.createdAt)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                            <button
                                                className={`btn btn-ghost btn-icon ${reingestingId === doc.id ? 'spinning' : ''}`}
                                                onClick={() => handleReingest(doc.id)}
                                                disabled={reingestingId === doc.id}
                                                title="Refresh"
                                            >
                                                <RefreshIcon />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => handleDeleteClick(doc.id)}
                                                title="Delete"
                                                style={{ color: 'var(--error)' }}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                </svg>
                                            </button>
                                        </div>
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
