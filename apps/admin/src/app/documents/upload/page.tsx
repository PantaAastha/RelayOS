'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function UploadDocumentPage() {
    const router = useRouter();
    const [tenantId, setTenantId] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [docType, setDocType] = useState('general');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const savedTenantId = localStorage.getItem('relayos_tenant_id');
        if (savedTenantId) {
            setTenantId(savedTenantId);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            setError('Title and content are required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/knowledge/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-ID': tenantId,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    docType,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to upload document');
            }

            router.push('/documents');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (!tenantId) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Upload Document</h1>
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
                <Link href="/documents" style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back to Documents
                </Link>
                <h1 className="page-title">Upload Document</h1>
                <p className="page-description">Add content to your knowledge base</p>
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: 'var(--error)',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Title</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Return Policy FAQ"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                        className="form-input"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                    >
                        <option value="general">General</option>
                        <option value="faq">FAQ</option>
                        <option value="policy">Policy</option>
                        <option value="product">Product</option>
                        <option value="guide">Guide</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Content</label>
                    <textarea
                        className="form-textarea"
                        placeholder="Paste your document content here. Markdown formatting is supported."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={12}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Uploading...' : 'Upload Document'}
                    </button>
                    <Link href="/documents" className="btn btn-secondary">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
