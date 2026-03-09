'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="studio-container">
            {/* Top bar using standard page-header structure */}
            <div className="page-header" style={{ padding: '24px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <h1 className="page-title" style={{ margin: 0 }}>Knowledge Library</h1>
                            <span className="chip chip-docs" style={{ marginLeft: '12px' }}>
                                <span className="chip-dot" />
                                Organization
                            </span>
                        </div>
                        <p className="page-description" style={{ marginTop: '8px', marginBottom: 0 }}>Manage your organization's document sources and collections.</p>
                    </div>
                    {/* Header Portal Target */}
                    <div id="knowledge-topbar-actions"></div>
                </div>
            </div>

            {/* Studio body */}
            <div className="studio-body">
                <div className="studio-left" style={{ width: '100%', borderRight: 'none', flex: 1 }}>
                    {/* Horizontal Tabs */}
                    <div className="studio-tabs">
                        <Link
                            href="/knowledge/sources"
                            className={`studio-tab${pathname.startsWith('/knowledge/sources') || pathname === '/knowledge/upload' ? ' studio-tab--active' : ''}`}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                            </svg>
                            Sources
                        </Link>
                        <Link
                            href="/knowledge/jobs"
                            className={`studio-tab${pathname.startsWith('/knowledge/jobs') ? ' studio-tab--active' : ''}`}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                            Ingestion Jobs
                        </Link>
                        <Link
                            href="/knowledge/collections"
                            className={`studio-tab${pathname.startsWith('/knowledge/collections') ? ' studio-tab--active' : ''}`}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                            </svg>
                            Collections
                        </Link>
                    </div>

                    {/* Content panel */}
                    <div className="studio-tab-content" style={{ background: 'var(--bg)' }}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
