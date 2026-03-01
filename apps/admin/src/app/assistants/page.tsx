'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { SkeletonTable } from '@/components/Skeleton';
import { useOrg } from '@/components/OrgContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Assistant {
    id: string;
    name: string;
    slug: string;
    organization_id: string;
    assistant_type: 'reactive' | 'guided' | 'reference';
    created_at: string;
    config?: {
        widgetTitle?: string;
        primaryColor?: string;
    };
    persona?: {
        name?: string;
    };
}

const TYPE_META: Record<string, { label: string; chipClass: string; iconClass: string; desc: string }> = {
    reactive: {
        label: 'Support',
        chipClass: 'chip-support',
        iconClass: 'ci-support',
        desc: 'Handles FAQs and customer support queries',
    },
    reference: {
        label: 'Docs',
        chipClass: 'chip-docs',
        iconClass: 'ci-docs',
        desc: 'API reference and technical documentation',
    },
    guided: {
        label: 'Onboarding',
        chipClass: 'chip-onboard',
        iconClass: 'ci-onboard',
        desc: 'Guided onboarding copilot for new users',
    },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
    reactive: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="17" height="17">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    reference: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="17" height="17">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    ),
    guided: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="17" height="17">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
    ),
};

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'live', label: 'Live' },
    { id: 'draft', label: 'Draft' },
    { id: 'reactive', label: 'Support' },
    { id: 'reference', label: 'Docs' },
    { id: 'guided', label: 'Onboarding' },
];

export default function AssistantsPage() {
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const { addToast } = useToast();

    // Create assistant modal
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [newType, setNewType] = useState<'reactive' | 'guided' | 'reference'>('reactive');
    const [submitting, setSubmitting] = useState(false);

    // Org context — orgId comes from shared provider, no auto-create
    const { orgId, assistants, loading, refresh } = useOrg();

    // Delete modal
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchAssistants = useCallback(async () => {
        await refresh();
    }, [refresh]);

    const handleCreate = async () => {
        if (!newName || !newSlug) {
            addToast({ title: 'Required', message: 'Name and slug are required', variant: 'error' });
            return;
        }
        if (!orgId) {
            addToast({ title: 'Error', message: 'No organization found. Create one first.', variant: 'error' });
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/assistants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, slug: newSlug, assistant_type: newType, organizationId: orgId }),
            });
            const data = await res.json();
            if (res.ok) {
                await refresh();
                addToast({ title: 'Created', message: `${data.name} created`, variant: 'success' });
                setShowCreate(false);
                setNewName('');
                setNewSlug('');
            } else {
                throw new Error(data.message || 'Failed');
            }
        } catch (error: any) {
            addToast({ title: 'Error', message: error.message, variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`${API_URL}/assistants/${deleteId}`, { method: 'DELETE' });
            if (res.ok) {
                await refresh();
                addToast({ title: 'Deleted', variant: 'success' });
            } else {
                throw new Error('Failed');
            }
        } catch {
            addToast({ title: 'Error', message: 'Failed to delete', variant: 'error' });
        } finally {
            setDeleteId(null);
        }
    };

    // Filter logic
    const filtered = assistants.filter((a) => {
        if (filter !== 'all') {
            if (['reactive', 'reference', 'guided'].includes(filter)) {
                if (a.assistant_type !== filter) return false;
            }
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!a.name.toLowerCase().includes(q) && !a.slug.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const liveCount = assistants.filter((a) => a.assistant_type !== 'guided').length;

    return (
        <>
            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Create New Assistant</h3>
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Template selector */}
                            <div>
                                <label className="flabel" style={{ marginBottom: '8px' }}>Template</label>
                                <div className="aut-grid">
                                    {(['reactive', 'reference', 'guided'] as const).map((type) => {
                                        const meta = TYPE_META[type];
                                        return (
                                            <div
                                                key={type}
                                                className={`aut-card${newType === type ? ' on' : ''}`}
                                                onClick={() => setNewType(type)}
                                            >
                                                <div className="aut-em">{TYPE_ICONS[type]}</div>
                                                <div className="aut-lb">{meta.label}</div>
                                                <div className="aut-ds">{meta.desc}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="field">
                                <label className="flabel">Name</label>
                                <input
                                    className="finput" placeholder="Acme Support"
                                    value={newName}
                                    onChange={(e) => {
                                        setNewName(e.target.value);
                                        if (!newSlug) setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                                    }}
                                />
                            </div>
                            <div className="field">
                                <label className="flabel">Slug</label>
                                <input className="finput" placeholder="acme-support" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
                            </div>
                        </div>
                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create Assistant'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteId && (
                <div className="modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Delete Assistant?</h3>
                        <p className="modal-message">This action cannot be undone. All conversations and data will be lost.</p>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Assistants</h1>
                    <p className="page-description">{assistants.length} assistant{assistants.length !== 1 ? 's' : ''} · {liveCount} live</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <div className="searchbar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" style={{ color: 'var(--t2)' }}>
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            placeholder="Search assistants…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Assistant
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="page-body">
                {loading ? (
                    <SkeletonTable rows={3} cols={3} />
                ) : (
                    <>
                        {/* Filters */}
                        <div className="filter-row">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.id}
                                    className={`filter-chip${filter === f.id ? ' active' : ''}`}
                                    onClick={() => setFilter(f.id)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Card Grid */}
                        <div className="card-grid">
                            {filtered.map((a) => {
                                const meta = TYPE_META[a.assistant_type] || TYPE_META.reactive;
                                return (
                                    <div className="card" key={a.id}>
                                        <div className="card-top">
                                            <div className="card-header">
                                                <div className={`card-icon ${meta.iconClass}`}>
                                                    {TYPE_ICONS[a.assistant_type]}
                                                </div>
                                                <div className="card-meta">
                                                    <span className="chip chip-live">
                                                        <span className="chip-dot" />
                                                        Live
                                                    </span>
                                                    <span className={`chip ${meta.chipClass}`}>{meta.label}</span>
                                                </div>
                                            </div>
                                            <div className="card-name">{a.name}</div>
                                            <div className="card-desc">{meta.desc}</div>
                                        </div>

                                        {/* Stats placeholder */}
                                        <div className="card-stats">
                                            <div className="stat">
                                                <div className="stat-val">—</div>
                                                <div className="stat-lbl">7d convos</div>
                                            </div>
                                            <div className="stat">
                                                <div className="stat-val">—</div>
                                                <div className="stat-lbl">supported</div>
                                            </div>
                                            <div className="stat">
                                                <div className="stat-val">—</div>
                                                <div className="stat-lbl">handoff</div>
                                            </div>
                                        </div>

                                        <div className="card-footer">
                                            <Link href={`/assistants/${a.id}`} style={{ textDecoration: 'none' }}>
                                                <button className="studio-cta">
                                                    Open Studio
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                                        <line x1="7" y1="17" x2="17" y2="7" />
                                                        <polyline points="7 7 17 7 17 17" />
                                                    </svg>
                                                </button>
                                            </Link>
                                            <button className="more-btn" onClick={(e) => { e.stopPropagation(); setDeleteId(a.id); }} title="Delete">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Empty card */}
                            <div className="card-empty" onClick={() => setShowCreate(true)}>
                                <div className="ce-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </div>
                                <div className="ce-t">New Assistant</div>
                                <div className="ce-d">Start from a template or build from scratch</div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
