'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    const [assistantId, setAssistantId] = useState('');
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
        const savedAssistantId = localStorage.getItem('relayos_assistant_id') || localStorage.getItem('relayos_tenant_id');
        if (savedAssistantId) {
            setAssistantId(savedAssistantId);
        }

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
                setTimeout(() => router.push('/documents'), 1500);
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

            router.push('/documents');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (!assistantId) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Upload Document</h1>
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
            <div className="page-header">
                <Link
                    href="/documents"
                    style={{
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '8px',
                    }}
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ width: '16px', height: '16px' }}
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back to Documents
                </Link>
                <h1 className="page-title">Upload Document</h1>
                <p className="page-description">Add content to your knowledge base</p>
            </div>

            {/* Mode Toggle */}
            <div
                style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '24px',
                    padding: '4px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    width: 'fit-content',
                }}
            >
                <button
                    onClick={() => setUploadMode('file')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: uploadMode === 'file' ? 'var(--bg-primary)' : 'transparent',
                        color: uploadMode === 'file' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: uploadMode === 'file' ? '500' : '400',
                        boxShadow: uploadMode === 'file' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                >
                    📁 File Upload
                </button>
                <button
                    onClick={() => setUploadMode('text')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: uploadMode === 'text' ? 'var(--bg-primary)' : 'transparent',
                        color: uploadMode === 'text' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: uploadMode === 'text' ? '500' : '400',
                        boxShadow: uploadMode === 'text' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                >
                    📝 Paste Text
                </button>
            </div>

            {error && (
                <div
                    style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: 'var(--error)',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        fontSize: '14px',
                        maxWidth: '600px',
                    }}
                >
                    {error}
                </div>
            )}

            {uploadMode === 'file' ? (
                <div style={{ maxWidth: '600px' }}>
                    {/* Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                            border: `2px dashed ${isDragOver ? 'var(--primary)' : 'var(--border-color)'}`,
                            borderRadius: '12px',
                            padding: '40px',
                            textAlign: 'center',
                            background: isDragOver ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
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
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                        <p style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: '8px' }}>
                            Drop files here or click to browse
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Supports: {supportedTypes?.extensions.join(', ')} • Max {supportedTypes?.maxSizeMB}MB per file
                        </p>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
                                Selected Files ({files.length}/{supportedTypes?.maxFiles})
                            </h3>
                            {files.map((f, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        border:
                                            f.status === 'success'
                                                ? '1px solid var(--success)'
                                                : f.status === 'error'
                                                    ? '1px solid var(--error)'
                                                    : '1px solid var(--border-color)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '20px' }}>
                                            {f.status === 'success' ? '✅' : f.status === 'error' ? '❌' : '📄'}
                                        </span>
                                        <div>
                                            <p style={{ fontWeight: '500', fontSize: '14px' }}>{f.file.name}</p>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                                {formatFileSize(f.file.size)}
                                                {f.error && <span style={{ color: 'var(--error)' }}> • {f.error}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    {f.status === 'pending' && (
                                        <button
                                            onClick={() => removeFile(index)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                padding: '4px',
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                    {f.status === 'uploading' && (
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Uploading...</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Document Type */}
                    <div className="form-group">
                        <label className="form-label">Document Type</label>
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

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={uploadFiles}
                            className="btn btn-primary"
                            disabled={loading || files.length === 0}
                        >
                            {loading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
                        </button>
                        <Link href="/documents" className="btn btn-secondary">
                            Cancel
                        </Link>
                    </div>
                </div>
            ) : (
                /* Text Mode (existing functionality) */
                <form onSubmit={handleTextSubmit} style={{ maxWidth: '600px' }}>
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
            )}
        </div>
    );
}
