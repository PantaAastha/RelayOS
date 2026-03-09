import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useOrg } from '@/components/OrgContext';
import Modal from '@/components/Modal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Collection {
    id: string;
    name: string;
    description: string;
    createdAt: string;
}

export default function KnowledgeTab({ assistantId }: { assistantId: string }) {
    const { orgId } = useOrg();
    const [mountedCollections, setMountedCollections] = useState<Collection[]>([]);
    const [allCollections, setAllCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMountModalOpen, setIsMountModalOpen] = useState(false);
    const [mounting, setMounting] = useState(false);

    const loadData = useCallback(async () => {
        if (!orgId || !assistantId) return;
        setLoading(true);
        try {
            // Fetch mounted
            const mountRes = await fetch(`${API_URL}/collections/assistant/${assistantId}`, {
                headers: { 'X-Organization-ID': orgId },
            });
            const mountData = await mountRes.json();
            setMountedCollections(mountData.collections || []);

            // Fetch all in org
            const allRes = await fetch(`${API_URL}/collections`, {
                headers: { 'X-Organization-ID': orgId },
            });
            const allData = await allRes.json();
            setAllCollections(allData.collections || []);
        } catch (e) {
            console.error('Failed to load collections', e);
        } finally {
            setLoading(false);
        }
    }, [orgId, assistantId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleToggleMount = async (collectionId: string, isMounted: boolean) => {
        if (!orgId) return;
        setMounting(true);
        try {
            await fetch(`${API_URL}/collections/${collectionId}/assistants`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Organization-ID': orgId },
                body: JSON.stringify(isMounted ? { unmount: [assistantId] } : { mount: [assistantId] }),
            });
            await loadData();
        } catch (e) {
            console.error(e);
        } finally {
            setMounting(false);
        }
    };

    if (loading) return <div className="loading" style={{ padding: '24px' }}>Loading Knowledge Base...</div>;

    return (
        <>
            <div className="studio-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div className="studio-section-title" style={{ margin: 0 }}>Mounted Collections</div>
                    <button className="btn btn-primary btn-sm" onClick={() => setIsMountModalOpen(true)}>
                        Mount Collection
                    </button>
                </div>

                {mountedCollections.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {mountedCollections.map((col) => (
                            <div key={col.id} className="coll-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="coll-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                                        </svg>
                                    </div>
                                    <div className="coll-info">
                                        <div className="coll-nm">{col.name}</div>
                                        {col.description && <div className="coll-mt" style={{ marginTop: '2px' }}>{col.description}</div>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className="coll-badge">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Mounted
                                    </div>
                                    <button
                                        onClick={() => handleToggleMount(col.id, true)}
                                        className="btn btn-secondary"
                                        style={{ padding: '4px 8px', fontSize: '11px', height: 'auto', background: 'transparent', border: '1px solid var(--border)' }}
                                    >
                                        Unmount
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="placeholder-tab">
                        <div className="placeholder-tab-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                            </svg>
                        </div>
                        <div className="placeholder-tab-title">No collections mounted</div>
                        <div className="placeholder-tab-desc" style={{ marginBottom: '16px' }}>Mount knowledge collections to give this assistant domain expertise.</div>
                        <button className="btn btn-primary btn-sm" onClick={() => setIsMountModalOpen(true)}>
                            Mount Collection
                        </button>
                    </div>
                )}
            </div>

            <div className="studio-section">
                <div className="studio-section-title">Retrieval Scope</div>
                <div className="infobox">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>This assistant can only retrieve from its mounted collections. Unmounted documents are never exposed in answers.</span>
                </div>
            </div>

            {/* Mount Modal */}
            <Modal
                isOpen={isMountModalOpen}
                onClose={() => setIsMountModalOpen(false)}
                title="Mount Collections"
                maxWidth="400px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {allCollections.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--t3)', padding: '20px 0' }}>
                            No collections available in Org.
                            <div style={{ marginTop: '12px' }}>
                                <Link href="/knowledge/collections" className="btn btn-primary btn-sm" onClick={() => setIsMountModalOpen(false)}>Create Collection</Link>
                            </div>
                        </div>
                    ) : (
                        allCollections.map(col => {
                            const isMounted = mountedCollections.some(m => m.id === col.id);
                            return (
                                <div key={col.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: `1px solid ${isMounted ? 'var(--mint)' : 'var(--border)'}`, borderRadius: '6px', background: isMounted ? 'rgba(29, 255, 160, 0.05)' : 'var(--elevated)' }}>
                                    <div style={{ fontWeight: 500, color: 'var(--t1)' }}>{col.name}</div>
                                    <button
                                        className={`btn ${isMounted ? 'btn-secondary' : 'btn-primary'}`}
                                        onClick={() => handleToggleMount(col.id, isMounted)}
                                        disabled={mounting}
                                    >
                                        {isMounted ? 'Unmount' : 'Mount'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </Modal>
        </>
    );
}
