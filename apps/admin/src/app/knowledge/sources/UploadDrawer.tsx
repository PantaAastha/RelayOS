'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrg } from '@/components/OrgContext';
import Drawer from '@/components/Drawer';

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

interface UploadDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (jobCount: number) => void;
}

export default function UploadDrawer({ isOpen, onClose, onSuccess }: UploadDrawerProps) {
    const { orgId, assistants, loading: orgLoading } = useOrg();
    const assistantId = assistants[0]?.id || '';
    const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [docType, setDocType] = useState('general');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [supportedTypes, setSupportedTypes] = useState<SupportedTypes | null>(null);

    // Text mode state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        if (!isOpen) {
            // Reset state when strictly closed
            setFiles([]);
            setTitle('');
            setContent('');
            setError('');
            setLoading(false);
            return;
        }

        fetch(`${API_URL}/knowledge/upload/supported`)
            .then((res) => res.json())
            .then((data) => setSupportedTypes(data))
            .catch(() => {
                setSupportedTypes({
                    extensions: ['.pdf', '.docx', '.txt', '.md'],
                    maxSizeMB: 10,
                    maxFiles: 10,
                });
            });
    }, [isOpen]);

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
    }, [supportedTypes, files]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            addFiles(selectedFiles);
        }
    }, [supportedTypes, files]);

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

        setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' as const })));

        try {
            const formData = new FormData();
            files.forEach((f) => formData.append('files', f.file));
            formData.append('docType', docType);

            const res = await fetch(`${API_URL}/knowledge/upload-batch`, {
                method: 'POST',
                headers: {
                    'X-Assistant-ID': assistantId,
                    ...(orgId ? { 'X-Organization-ID': orgId } : {}),
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Upload failed');
            }

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

            const allSucceeded = data.results?.every((r: { success: boolean }) => r.success);
            if (allSucceeded) {
                setTimeout(() => {
                    onSuccess(files.length);
                    onClose();
                }, 1000);
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
                    ...(orgId ? { 'X-Organization-ID': orgId } : {}),
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

            setTimeout(() => {
                onSuccess(1);
                onClose();
            }, 500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Upload Documents"
            width="420px"
            footer={
                <>
                    <button
                        onClick={uploadMode === 'file' ? uploadFiles : handleTextSubmit}
                        className="btn btn-primary"
                        style={{ flex: 1, justifyContent: 'center' }}
                        disabled={loading || (uploadMode === 'file' && files.length === 0)}
                    >
                        {loading ? 'Uploading...' : uploadMode === 'file' ? `Upload ${files.length} File${files.length !== 1 ? 's' : ''}` : 'Upload Document'}
                    </button>
                    <button onClick={onClose} className="btn btn-secondary">
                        Cancel
                    </button>
                </>
            }
        >
            <div className="filter-row" style={{ marginBottom: '20px' }}>
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
                <div className="attn-banner" style={{ marginBottom: '16px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                </div>
            )}

            {uploadMode === 'file' ? (
                <div className="studio-section" style={{ border: 'none', padding: 0 }}>
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="card-empty"
                        style={{
                            border: `1px dashed ${isDragOver ? 'var(--mint)' : 'var(--border)'}`,
                            background: isDragOver ? 'var(--mint1)' : 'transparent',
                            marginBottom: '20px',
                            padding: '32px 20px',
                            cursor: 'pointer'
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
                        <div className="ce-icon" style={{ fontSize: '24px', border: 'none', marginBottom: '8px' }}>📄</div>
                        <div className="ce-t">Drop files here or click to browse</div>
                        <div className="ce-d">
                            {supportedTypes?.extensions.join(', ')} · Max {supportedTypes?.maxSizeMB}MB
                        </div>
                    </div>

                    {files.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--t2)', marginBottom: '8px', fontWeight: 500 }}>
                                Selected Files ({files.length}/{supportedTypes?.maxFiles})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {files.map((f, index) => (
                                    <div
                                        key={index}
                                        className="card"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 12px',
                                            borderColor:
                                                f.status === 'success' ? 'var(--mint)' :
                                                    f.status === 'error' ? 'var(--red)' : 'var(--border)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                            <span style={{ fontSize: '14px' }}>
                                                {f.status === 'success' ? '✅' : f.status === 'error' ? '❌' : '📄'}
                                            </span>
                                            <div style={{ overflow: 'hidden' }}>
                                                <div className="card-name" style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.file.name}</div>
                                                <div className="card-desc" style={{ fontSize: '10px' }}>
                                                    {formatFileSize(f.file.size)}
                                                    {f.error && <span style={{ color: 'var(--red)' }}> • {f.error}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {f.status === 'pending' && (
                                            <button onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="more-btn">✕</button>
                                        )}
                                        {f.status === 'uploading' && (
                                            <span style={{ color: 'var(--t2)', fontSize: '10px' }}>Uploading...</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                </div>
            ) : (
                <form onSubmit={handleTextSubmit} id="text-upload-form" className="studio-section" style={{ border: 'none', padding: 0 }}>
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
                            rows={10}
                        />
                    </div>
                </form>
            )}
        </Drawer>
    );
}
