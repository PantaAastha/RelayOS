import Link from 'next/link';

export default function KnowledgeTab({ documentCount }: { documentCount?: number }) {
    return (
        <>
            <div className="studio-section">
                <div className="studio-section-title">Mounted Collections</div>
                {documentCount && documentCount > 0 ? (
                    <>
                        <div className="coll-card">
                            <div className="coll-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                                </svg>
                            </div>
                            <div className="coll-info">
                                <div className="coll-nm">General Knowledge</div>
                                <div className="coll-mt">{documentCount} docs</div>
                            </div>
                            <div className="coll-badge">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Mounted
                            </div>
                        </div>
                        <button className="addbtn" style={{ marginTop: '4px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Mount collection
                        </button>
                    </>
                ) : (
                    <div className="placeholder-tab">
                        <div className="placeholder-tab-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                            </svg>
                        </div>
                        <div className="placeholder-tab-title">No collections mounted</div>
                        <div className="placeholder-tab-desc">Mount knowledge collections to give this assistant domain expertise.</div>
                        <Link href="/knowledge" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                            Upload Documents
                        </Link>
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
        </>
    );
}
