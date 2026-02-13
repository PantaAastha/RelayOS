'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Organization {
    id: string;
    name: string;
    slug: string;
}

interface Assistant {
    id: string;
    name: string;
    slug: string;
    organization_id: string;
    created_at: string;
}

interface Toast {
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
}

export default function AssistantsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
    const [showCreateAssistantModal, setShowCreateAssistantModal] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgSlug, setNewOrgSlug] = useState('');
    const [newAssistantName, setNewAssistantName] = useState('');
    const [newAssistantSlug, setNewAssistantSlug] = useState('');
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
            const res = await fetch(`${API_URL}/assistants/${deleteTargetId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setAssistants(prev => prev.filter(a => a.id !== deleteTargetId));

                // Clear from localStorage if this was the current assistant
                const currentAssistantId = localStorage.getItem('relayos_assistant_id');
                // Also check legacy key
                const currentTenantId = localStorage.getItem('relayos_tenant_id');

                if (currentAssistantId === deleteTargetId || currentTenantId === deleteTargetId) {
                    localStorage.removeItem('relayos_assistant_id');
                    localStorage.removeItem('relayos_tenant_id');
                    showToast('info', 'Assistant Changed', 'The current assistant was deleted. Please select a new one.');
                } else {
                    showToast('success', 'Deleted', 'Assistant deleted successfully');
                }
            } else {
                throw new Error('Failed to delete assistant');
            }
        } catch (error) {
            console.error('Failed to delete assistant:', error);
            showToast('error', 'Error', 'Failed to delete assistant');
        } finally {
            setDeleteTargetId(null);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const res = await fetch(`${API_URL}/organizations`);
            if (!res.ok) throw new Error('Failed to fetch organizations');
            const data = await res.json();
            setOrganizations(data || []);

            // Auto-select first org if none selected
            if (data && data.length > 0 && !selectedOrgId) {
                setSelectedOrgId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
            showToast('error', 'Error', 'Failed to load organizations');
        }
    };

    const fetchAssistants = async () => {
        if (!selectedOrgId) return;

        setLoading(true);
        try {
            // Updated endpoint to filter by organization
            const res = await fetch(`${API_URL}/assistants`, {
                headers: { 'x-organization-id': selectedOrgId }
            });
            if (!res.ok) throw new Error('Failed to fetch assistants');
            const data = await res.json();
            setAssistants(data || []);
        } catch (error) {
            console.error('Failed to fetch assistants:', error);
            showToast('error', 'Error', 'Failed to load assistants');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, []);

    useEffect(() => {
        if (selectedOrgId) {
            fetchAssistants();
        } else {
            setLoading(false);
        }
    }, [selectedOrgId]);

    const handleCreateOrg = async () => {
        if (!newOrgName || !newOrgSlug) {
            showToast('error', 'Validation', 'Name and Slug are required');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/organizations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newOrgName, slug: newOrgSlug }),
            });

            const data = await res.json();

            if (res.ok) {
                setOrganizations(prev => [data, ...prev]);
                setSelectedOrgId(data.id);
                showToast('success', 'Created', `Organization "${data.name}" created`);
                setShowCreateOrgModal(false);
                setNewOrgName('');
                setNewOrgSlug('');
            } else {
                throw new Error(data.message || 'Failed to create organization');
            }
        } catch (error: any) {
            console.error('Failed to create organization:', error);
            showToast('error', 'Error', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateAssistant = async () => {
        if (!newAssistantName || !newAssistantSlug) {
            showToast('error', 'Validation', 'Name and Slug are required');
            return;
        }

        if (!selectedOrgId) {
            showToast('error', 'Validation', 'Organization is required');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/assistants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newAssistantName,
                    slug: newAssistantSlug,
                    organizationId: selectedOrgId
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setAssistants(prev => [data, ...prev]);
                showToast('success', 'Created', `Assistant "${data.name}" created`);
                setShowCreateAssistantModal(false);
                setNewAssistantName('');
                setNewAssistantSlug('');
            } else {
                throw new Error(data.message || 'Failed to create assistant');
            }
        } catch (error: any) {
            console.error('Failed to create assistant:', error);
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

            {/* Create Organization Modal */}
            {showCreateOrgModal && (
                <div className="modal-overlay" onClick={() => setShowCreateOrgModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">Create New Organization</h3>
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Acme Inc."
                                    value={newOrgName}
                                    onChange={e => {
                                        setNewOrgName(e.target.value);
                                        if (!newOrgSlug) {
                                            setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
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
                                    placeholder="acme-inc"
                                    value={newOrgSlug}
                                    onChange={e => setNewOrgSlug(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>
                        <div className="modal-actions" style={{ marginTop: '24px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateOrgModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={handleCreateOrg} disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create Organization'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Assistant Modal */}
            {showCreateAssistantModal && (
                <div className="modal-overlay" onClick={() => setShowCreateAssistantModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">Create New Assistant</h3>
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Support Bot"
                                    value={newAssistantName}
                                    onChange={e => {
                                        setNewAssistantName(e.target.value);
                                        if (!newAssistantSlug) {
                                            setNewAssistantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
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
                                    placeholder="support-bot"
                                    value={newAssistantSlug}
                                    onChange={e => setNewAssistantSlug(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>
                        <div className="modal-actions" style={{ marginTop: '24px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateAssistantModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={handleCreateAssistant} disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create Assistant'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTargetId && (
                <div className="modal-overlay" onClick={() => setDeleteTargetId(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">Delete Assistant?</h3>
                        <p className="modal-message">
                            Are you sure you want to delete this assistant? This action cannot be undone.
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
                    <h1 className="page-title">Assistants</h1>
                    <p className="page-description">Manage AI assistants for your organization</p>
                </div>

                {/* Organization Switcher */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Organization:</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <select
                                className="input"
                                style={{ padding: '4px 8px', minWidth: '150px' }}
                                value={selectedOrgId || ''}
                                onChange={(e) => setSelectedOrgId(e.target.value)}
                            >
                                {organizations.map(org => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                            <button
                                className="btn btn-ghost btn-icon" // Changed to icon button for tighter spacing
                                onClick={() => setShowCreateOrgModal(true)}
                                title="Create Organization"
                                style={{ padding: '4px', height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </button>
                        </div>

                    </div>

                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowCreateAssistantModal(true)}
                        disabled={!selectedOrgId}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Create Assistant
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : (!selectedOrgId && organizations.length === 0) ? (
                <div className="empty-state">
                    <h3>No Organization Found</h3>
                    <p>Create an organization to start adding assistants.</p>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreateOrgModal(true)} style={{ marginTop: '12px' }}>
                        Create Organization
                    </button>
                </div>
            ) : assistants.length === 0 ? (
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                    </svg>
                    <h3>No assistants yet</h3>
                    <p>Create an AI assistant for {organizations.find(o => o.id === selectedOrgId)?.name}</p>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreateAssistantModal(true)} style={{ marginTop: '12px' }}>
                        Create Assistant
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
                            {assistants.map((assistant) => (
                                <tr key={assistant.id}>
                                    <td style={{ fontWeight: 500 }}>{assistant.name}</td>
                                    <td>
                                        <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{assistant.slug}</span>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {assistant.id}
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={(e) => handleCopy(assistant.id, e)}
                                                title="Copy ID"
                                                style={{ marginLeft: '8px', padding: '4px', height: 'auto' }}
                                            >
                                                {copiedId === assistant.id ? (
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
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{formatDate(assistant.created_at)}</td>
                                    <td style={{ width: '80px' }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {/* We need to update this route too, likely /assistants/[id] */}
                                            <Link href={`/assistants/${assistant.id}`} title="Configure Persona">
                                                <button className="btn btn-ghost btn-icon" style={{ color: 'var(--text-secondary)' }}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                        <circle cx="12" cy="12" r="3" />
                                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                                    </svg>
                                                </button>
                                            </Link>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => handleDeleteClick(assistant.id)}
                                                title="Delete Assistant"
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
