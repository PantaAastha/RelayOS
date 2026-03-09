'use client';

import { useEffect, useState, useCallback } from 'react';
import { useOrg } from '@/components/OrgContext';
import Link from 'next/link';
import CreateCollectionDrawer from './CreateCollectionDrawer';
import EmptyState from '@/components/EmptyState';
import KnowledgeHeaderPortal from '@/components/KnowledgeHeaderPortal';
import Drawer from '@/components/Drawer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Collection {
    id: string;
    name: string;
    description: string;
    documentCount: number;
    assistantCount: number;
    assistants?: string[]; // Assuming backend can be updated to return mounted names, else we just use count
    createdAt: string;
}

export default function CollectionsPage() {
    const { orgId, loading: orgLoading } = useOrg();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchCollections = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/collections`, {
                headers: { 'X-Organization-ID': orgId },
            });
            const data = await res.json();
            setCollections(data.collections || []);
        } catch (error) {
            console.error('Failed to fetch collections:', error);
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        if (!orgLoading) fetchCollections();
    }, [orgLoading, fetchCollections]);

    const handleCreateSuccess = () => {
        setIsCreateOpen(false);
        fetchCollections();
    };

    if (orgLoading || loading) {
        return <div className="loading">Loading...</div>;
    }

    if (activeCollection) {
        return (
            <CollectionDetailView
                collection={activeCollection}
                orgId={orgId}
                onBack={() => {
                    setActiveCollection(null);
                    fetchCollections(); // Refresh list to get new counts
                }}
            />
        );
    }

    return (
        <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
            <KnowledgeHeaderPortal>
                <button className="btn btn-primary btn-sm" onClick={() => setIsCreateOpen(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Collection
                </button>
            </KnowledgeHeaderPortal>

            <div className="page-body" style={{ height: '100%', overflowY: 'auto' }}>
                {collections.length === 0 ? (
                    <EmptyState
                        title="No collections yet"
                        description="Group documents to visually manage what each assistant can retrieve."
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="44" height="44" style={{ opacity: 0.3, marginBottom: 4, color: 'var(--t3)' }}>
                                <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                        }
                        action={
                            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
                                Create Collection
                            </button>
                        }
                    />
                ) : (
                    <div className="card-grid">
                        {collections.map((col) => (
                            <div key={col.id} className="card" onClick={() => setActiveCollection(col)}>
                                <div className="card-top">
                                    <div className="card-header">
                                        <div className="card-icon ci-docs" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ color: 'var(--blue)' }}>
                                                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                                            </svg>
                                        </div>
                                        <div className="card-meta">
                                            {col.assistantCount === 0 ? (
                                                <span className="chip chip-attn">
                                                    <span className="chip-dot" />
                                                    Unmounted
                                                </span>
                                            ) : (
                                                <span className="chip chip-live">
                                                    <span className="chip-dot" />
                                                    Mounted to {col.assistantCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card-name">{col.name}</div>
                                    <div className="card-desc" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {col.description || 'No description provided.'}
                                    </div>
                                </div>

                                <div className="card-stats">
                                    <div className="stat">
                                        <div className="stat-val">{col.documentCount}</div>
                                        <div className="stat-lbl">documents</div>
                                    </div>
                                    <div className="stat">
                                        <div className="stat-val">{col.assistantCount}</div>
                                        <div className="stat-lbl">assistants</div>
                                    </div>
                                </div>

                                <div className="card-footer" style={{ justifyContent: 'flex-end' }}>
                                    <button className="studio-cta" onClick={(e) => { e.stopPropagation(); setActiveCollection(col) }}>
                                        Open
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                            <line x1="7" y1="17" x2="17" y2="7" />
                                            <polyline points="7 7 17 7 17 17" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateCollectionDrawer
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                orgId={orgId}
                onSuccess={handleCreateSuccess}
            />
        </div>
    );
}

// -------------------------------------------------------------
// CollectionDetailView
// -------------------------------------------------------------
function CollectionDetailView({ collection, orgId, onBack }: { collection: Collection; orgId: string | null; onBack: () => void }) {
    const [activeTab, setActiveTab] = useState<'documents' | 'assistants'>('documents');
    const [items, setItems] = useState<any[]>([]);
    const [allAvailable, setAllAvailable] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const loadData = useCallback(async () => {
        if (!orgId) return;
        try {
            const attachedRes = await fetch(`${API_URL}/collections/${collection.id}/${activeTab}`, {
                headers: { 'X-Organization-ID': orgId },
            });
            const attachedData = await attachedRes.json();
            setItems(attachedData[activeTab] || []);

            const catalogRes = await fetch(`${API_URL}/${activeTab === 'documents' ? 'knowledge/documents' : 'assistants'}`, {
                headers: { 'X-Organization-ID': orgId },
            });
            const catalogData = await catalogRes.json();
            setAllAvailable(catalogData[activeTab] || catalogData.documents || catalogData.assistants || []);
        } catch (e) {
            console.error(e);
        }
    }, [activeTab, collection.id, orgId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleToggleAttach = async (itemId: string, action: 'add' | 'remove') => {
        if (!orgId) return;
        setIsSaving(true);
        try {
            const body = activeTab === 'documents'
                ? (action === 'add' ? { add: [itemId] } : { remove: [itemId] })
                : (action === 'add' ? { mount: [itemId] } : { unmount: [itemId] });

            await fetch(`${API_URL}/collections/${collection.id}/${activeTab}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Organization-ID': orgId },
                body: JSON.stringify(body),
            });
            await loadData();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ padding: '0 28px 24px', height: '100%', overflowY: 'auto' }}>
            <div style={{ padding: '0 0 16px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="more-btn" onClick={onBack} style={{ padding: '4px' }} title="Back to Collections">
                    ←
                </button>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--t2)' }}>
                        Collections <span style={{ margin: '0 6px' }}>/</span> <span style={{ color: 'var(--t1)' }}>{collection.name}</span>
                    </span>
                </div>
            </div>

            <div className="filter-row" style={{ marginBottom: '16px' }}>
                <button
                    onClick={() => setActiveTab('documents')}
                    className={`filter-chip ${activeTab === 'documents' ? 'active' : ''}`}
                >
                    Included Documents
                </button>
                <button
                    onClick={() => setActiveTab('assistants')}
                    className={`filter-chip ${activeTab === 'assistants' ? 'active' : ''}`}
                >
                    Mounted Assistants
                </button>
            </div>

            <div className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--t2)', letterSpacing: '0.05em', margin: 0 }}>
                        {activeTab === 'documents' ? 'Documents in Collection' : 'Mounted to Assistants'}
                    </h3>
                    {activeTab === 'documents' ? (
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                            Add Documents
                        </button>
                    ) : (
                        <Link href="/" className="btn btn-secondary btn-sm">
                            Mount in Studio →
                        </Link>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.length === 0 ? (
                        <EmptyState
                            title={`No ${activeTab} yet`}
                            description={
                                activeTab === 'documents'
                                    ? 'Add documents to this collection so assistants can retrieve them.'
                                    : 'This collection is not mounted to any assistants.'
                            }
                            action={
                                activeTab === 'documents' ? (
                                    <button className="btn btn-secondary" onClick={() => setShowAddModal(true)}>
                                        Add Documents
                                    </button>
                                ) : undefined
                            }
                        />
                    ) : (
                        items.map((item) => (
                            <div key={item.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px', borderRadius: '8px', border: '1px solid var(--border)',
                                background: 'var(--elevated)',
                                transition: 'all 0.15s'
                            }}>
                                <strong style={{ fontSize: '13px', color: 'var(--t1)', fontWeight: 500 }}>{item.title || item.name}</strong>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleToggleAttach(item.id, 'remove')}
                                    disabled={isSaving}
                                    style={{ color: 'var(--red)' }}
                                >
                                    {activeTab === 'documents' ? 'Remove' : 'Unmount'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add Documents Picker Drawer */}
            {activeTab === 'documents' && (
                <Drawer
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    title="Add Documents"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--t2)', marginTop: 0, marginBottom: '8px' }}>
                            Select documents from your organization to include in this collection.
                        </p>
                        {allAvailable.filter(a => !items.find(i => i.id === a.id)).length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--t3)', fontSize: '13px' }}>
                                No additional documents available.
                            </div>
                        ) : (
                            allAvailable.filter(a => !items.find(i => i.id === a.id)).map(item => (
                                <div key={item.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px', borderRadius: '8px', border: '1px solid var(--border)',
                                    background: 'var(--elevated)'
                                }}>
                                    <strong style={{ fontSize: '13px', color: 'var(--t1)', fontWeight: 500 }}>{item.title}</strong>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleToggleAttach(item.id, 'add')}
                                        disabled={isSaving}
                                    >
                                        Add
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </Drawer>
            )}
        </div>
    );
}
