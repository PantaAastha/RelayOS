'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOrg } from '@/components/OrgContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UploadedFile {
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    documentId?: string;
}

interface SupportedTypes {
    extensions: string[];
    maxSizeMB: number;
    maxFiles: number;
}

export default function UploadDocumentPage() {
    const router = useRouter();
    const { assistants, loading: orgLoading } = useOrg();
    const assistantId = assistants[0]?.id || '';
    const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [docType, setDocType] = useState('general');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [supportedTypes, setSupportedTypes] = useState<SupportedTypes | null>(null);

    // Text mode state (existing functionality)
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        // Fetch supported file types
        fetch(`${API_URL}/knowledge/upload/supported`)
            .then((res) => res.json())
            .then((data) => setSupportedTypes(data))
            .catch(() => {
                // Fallback defaults
                setSupportedTypes({
                    extensions: ['.pdf', '.docx', '.txt', '.md'],
                    maxSizeMB: 10,
                    maxFiles: 10,
                });
            });
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            addFiles(selectedFiles);
        }
    }, []);

    const addFiles = (newFiles: File[]) => {
        const maxFiles = supportedTypes?.maxFiles ?? 10;
        const remaining = maxFiles - files.length;

        if (remaining <= 0) {
            setError(`Maximum ${maxFiles} files allowed`);
            return;
        }

        const filesToAdd = newFiles.slice(0, remaining).map((file) => ({
            file,
            status: 'pending' as const,
        }));

        setFiles((prev) => [...prev, ...filesToAdd]);
        setError('');
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const uploadFiles = async () => {
        if (files.length === 0) {
            setError('Please select at least one file');
            return;
        }

        setLoading(true);
        setError('');

        // Update all files to uploading status
        setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' as const })));

        try {
            const formData = new FormData();
            files.forEach((f) => formData.append('files', f.file));
            formData.append('docType', docType);

            const res = await fetch(`${API_URL}/knowledge/upload-batch`, {
                method: 'POST',
                headers: {
                    'X-Assistant-ID': assistantId,
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            // Update file statuses based on results
            setFiles((prev) =>
                prev.map((f, index) => {
                    const result = data.results?.[index];
                    if (result?.success) {
                        return { ...f, status: 'success' as const, documentId: result.documentId };
                    } else {
                        return { ...f, status: 'error' as const, error: result?.error || 'Upload failed' };
                    }
                }),
            );

            // Redirect after a short delay if all succeeded
            const allSucceeded = data.results?.every((r: { success: boolean }) => r.success);
            if (allSucceeded) {
                setTimeout(() => router.push('/knowledge'), 1500);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setFiles((prev) => prev.map((f) => ({ ...f, status: 'error' as const })));
        } finally {
            setLoading(false);
        }
    };

    const handleTextSubmit = async (e: React.FormEvent) => {
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
                    'X-Assistant-ID': assistantId,
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

            router.push('/knowledge');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (!assistantId) {
        return (
            <div className="studio-container">
                {/* Top bar */}
                <div className="topbar">
                    <div className="topbar-l">
                        <span className="topbar-name">Upload Document</span>
                    </div>
                </div>
                <div className="page-body">
                    <div className="empty-state">
                        <p>Please set your assistant ID on the dashboard first.</p>
                        <Link href="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="studio-container">
            {/* Top bar (matching Assistant Detail) */}
            <div className="topbar">
                <div className="topbar-l">
                    <Link href="/knowledge" className="back-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Knowledge
                    </Link>
                    <div className="topbar-sep" />
                    <span className="topbar-name">Upload Document</span>
                </div>
            </div>

            <div className="page-body">
                {/* Mode Toggle */}
                <div className="filter-row" style={{ marginBottom: '24px' }}>
                    <button
                        onClick={() => setUploadMode('file')}
                        className={`filter-chip ${uploadMode === 'file' ? 'active' : ''}`}
                    >
                        📁 File Upload
                    </button>
                    <button
                        onClick={() => setUploadMode('text')}
                        className={`filter-chip ${uploadMode === 'text' ? 'active' : ''}`}
                    >
                        📝 Paste Text
                    </button>
                </div>

                {error && (
                    <div className="attn-banner">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                {uploadMode === 'file' ? (
                    <div className="studio-section" style={{ maxWidth: '600px' }}>
                        {/* Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className="card-empty"
                            style={{
                                border: `2px dashed ${isDragOver ? 'var(--mint)' : 'var(--border)'}`,
                                background: isDragOver ? 'var(--mint1)' : 'transparent',
                                marginBottom: '20px',
                            }}
                            onClick={() => document.getElementById('file-input')?.click()}
                        >
                            <input
                                id="file-input"
                                type="file"
                                multiple
                                accept={supportedTypes?.extensions.join(',')}
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            <div className="ce-icon" style={{ fontSize: '24px', border: 'none' }}>📄</div>
                            <div className="ce-t">Drop files here or click to browse</div>
                            <div className="ce-d">
                                Supports: {supportedTypes?.extensions.join(', ')} • Max {supportedTypes?.maxSizeMB}MB per file
                            </div>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="studio-section">
                                <div className="studio-section-title">
                                    Selected Files ({files.length}/{supportedTypes?.maxFiles})
                                </div>
                                {files.map((f, index) => (
                                    <div
                                        key={index}
                                        className="card"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px',
                                            marginBottom: '8px',
                                            borderColor:
                                                f.status === 'success'
                                                    ? 'var(--mint)'
                                                    : f.status === 'error'
                                                        ? 'var(--red)'
                                                        : 'var(--border)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '20px' }}>
                                                {f.status === 'success' ? '✅' : f.status === 'error' ? '❌' : '📄'}
                                            </span>
                                            <div>
                                                <div className="card-name" style={{ fontSize: '13px' }}>{f.file.name}</div>
                                                <div className="card-desc">
                                                    {formatFileSize(f.file.size)}
                                                    {f.error && <span style={{ color: 'var(--red)' }}> • {f.error}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {f.status === 'pending' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                                className="more-btn"
                                            >
                                                ✕
                                            </button>
                                        )}
                                        {f.status === 'uploading' && (
                                            <span style={{ color: 'var(--t2)', fontSize: '12px' }}>Uploading...</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Document Type */}
                        <div className="field">
                            <label className="flabel">Document Type</label>
                            <select
                                className="finput"
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

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button
                                onClick={uploadFiles}
                                className="btn btn-primary"
                                disabled={loading || files.length === 0}
                            >
                                {loading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
                            </button>
                            <Link href="/knowledge" className="btn btn-secondary">
                                Cancel
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Text Mode (existing functionality) */
                    <form onSubmit={handleTextSubmit} className="studio-section" style={{ maxWidth: '600px' }}>
                        <div className="field">
                            <label className="flabel">Title</label>
                            <input
                                type="text"
                                className="finput"
                                placeholder="e.g., Return Policy FAQ"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label className="flabel">Type</label>
                            <select
                                className="finput"
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

                        <div className="field">
                            <label className="flabel">Content</label>
                            <textarea
                                className="fta"
                                placeholder="Paste your document content here. Markdown formatting is supported."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={12}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Uploading...' : 'Upload Document'}
                            </button>
                            <Link href="/knowledge" className="btn btn-secondary">
                                Cancel
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
