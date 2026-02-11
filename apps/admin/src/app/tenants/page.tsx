'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    created_at: string;
}

interface Toast {
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
}

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTenantName, setNewTenantName] = useState('');
    const [newTenantSlug, setNewTenantSlug] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const showToast = (type: Toast['type'], title: string, message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const handleCopy = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteTargetId(id);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        try {
            const res = await fetch(`${API_URL}/tenants/${deleteTargetId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setTenants(prev => prev.filter(t => t.id !== deleteTargetId));

                // Clear from localStorage if this was the current tenant
                const currentTenantId = localStorage.getItem('relayos_tenant_id');
                if (currentTenantId === deleteTargetId) {
                    localStorage.removeItem('relayos_tenant_id');
                    showToast('info', 'Tenant Changed', 'The current tenant was deleted. Please select a new one.');
                } else {
                    showToast('success', 'Deleted', 'Tenant deleted successfully');
                }
            } else {
                throw new Error('Failed to delete tenant');
            }
        } catch (error) {
            console.error('Failed to delete tenant:', error);
            showToast('error', 'Error', 'Failed to delete tenant');
        } finally {
            setDeleteTargetId(null);
        }
    };

    const fetchTenants = async () => {
        try {
            const res = await fetch(`${API_URL}/tenants`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setTenants(data || []);
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
            showToast('error', 'Error', 'Failed to load tenants');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const handleCreate = async () => {
        if (!newTenantName || !newTenantSlug) {
            showToast('error', 'Validation', 'Name and Slug are required');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/tenants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTenantName, slug: newTenantSlug }),
            });

            const data = await res.json();

            if (res.ok) {
                setTenants(prev => [data, ...prev]);
                showToast('success', 'Created', `Tenant "${data.name}" created`);
                setShowCreateModal(false);
                setNewTenantName('');
                setNewTenantSlug('');
            } else {
                throw new Error(data.message || 'Failed to create tenant');
            }
        } catch (error: any) {
            console.error('Failed to create tenant:', error);
            showToast('error', 'Error', error.message);
        } finally {
            setSubmitting(false);
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

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">Create New Tenant</h3>
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Acme Corp"
                                    value={newTenantName}
                                    onChange={e => {
                                        setNewTenantName(e.target.value);
                                        // Auto-slug
                                        if (!newTenantSlug) {
                                            setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                                        }
                                    }}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Slug (Unique ID)</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="acme-corp"
                                    value={newTenantSlug}
                                    onChange={e => setNewTenantSlug(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>
                        <div className="modal-actions" style={{ marginTop: '24px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create Tenant'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTargetId && (
                <div className="modal-overlay" onClick={() => setDeleteTargetId(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">Delete Tenant?</h3>
                        <p className="modal-message">
                            Are you sure you want to delete this tenant? This action cannot be undone.
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
                    <h1 className="page-title">Tenants</h1>
                    <p className="page-description">Manage system tenants</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Create Tenant
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : tenants.length === 0 ? (
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <h3>No tenants yet</h3>
                    <p>Create your first tenant to get started</p>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)} style={{ marginTop: '12px' }}>
                        Create Tenant
                    </button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Slug</th>
                                <th>ID</th>
                                <th>Created</th>
                                <th style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map((tenant) => (
                                <tr key={tenant.id}>
                                    <td style={{ fontWeight: 500 }}>{tenant.name}</td>
                                    <td>
                                        <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{tenant.slug}</span>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {tenant.id}
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={(e) => handleCopy(tenant.id, e)}
                                                title="Copy ID"
                                                style={{ marginLeft: '8px', padding: '4px', height: 'auto' }}
                                            >
                                                {copiedId === tenant.id ? (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" width="14" height="14">
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{formatDate(tenant.created_at)}</td>
                                    <td style={{ width: '80px' }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <Link href={`/tenants/${tenant.id}`} title="Configure Persona">
                                                <button className="btn btn-ghost btn-icon" style={{ color: 'var(--text-secondary)' }}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                        <circle cx="12" cy="12" r="3" />
                                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                                    </svg>
                                                </button>
                                            </Link>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => handleDeleteClick(tenant.id)}
                                                title="Delete Tenant"
                                                style={{ color: 'var(--error)' }}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
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
