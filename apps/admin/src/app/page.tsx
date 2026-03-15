'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useOrg } from '@/components/OrgContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Stats {
  documentsCount: number;
  conversationsCount: number;
  messagesCount: number;
  assistantCount?: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { orgId, assistants, loading: orgLoading } = useOrg();

  const fetchStats = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Organization-ID'] = orgId;
      const res = await fetch(`${API_URL}/conversation/stats`, { headers });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!orgLoading) fetchStats();
  }, [orgLoading, fetchStats]);

  if (orgLoading || loading) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-description">Organization overview across all assistants</p>
          </div>
        </div>
        <div className="page-body">
          <div className="stats-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card">
                <div className="skeleton-line" style={{ width: '60px', height: '10px', marginBottom: '10px' }} />
                <div className="skeleton-line" style={{ width: '80px', height: '24px' }} />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  const STAT_ITEMS = [
    { label: 'Assistants', value: assistants.length },
    { label: 'Documents', value: stats?.documentsCount || 0 },
    { label: 'Conversations', value: stats?.conversationsCount || 0 },
    { label: 'Messages', value: stats?.messagesCount || 0 },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Organization overview across all assistants</p>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          {STAT_ITEMS.map((item, i) => (
            <div key={item.label} className="stat-card" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="stat-label">{item.label}</div>
              <div className="stat-value">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Quick actions — asymmetric 2+1 */}
        <div className="studio-section">
          <div className="studio-section-title">Quick actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
            <Link href="/assistants" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ height: '100%' }}>
                <div className="card-top">
                  <div className="card-header">
                    <div className="card-icon ci-support">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="card-name">Assistants</div>
                  <div className="card-desc">Configure behavior, tone, and knowledge sources for each assistant</div>
                </div>
              </div>
            </Link>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Link href="/knowledge" style={{ textDecoration: 'none', flex: 1 }}>
                <div className="card" style={{ height: '100%' }}>
                  <div className="card-top">
                    <div className="card-header">
                      <div className="card-icon ci-docs">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="card-name">Knowledge</div>
                    <div className="card-desc">Upload and manage documents</div>
                  </div>
                </div>
              </Link>

              <Link href="/quality" style={{ textDecoration: 'none', flex: 1 }}>
                <div className="card" style={{ height: '100%' }}>
                  <div className="card-top">
                    <div className="card-header">
                      <div className="card-icon ci-onboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M18 20V10M12 20V4M6 20v-6" />
                        </svg>
                      </div>
                    </div>
                    <div className="card-name">Quality</div>
                    <div className="card-desc">Review conversations</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Platform status */}
        <div className="studio-section">
          <div className="studio-section-title">Platform status</div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px',
          }}>
            {[
              { label: 'API', status: 'Operational', color: 'var(--mint)' },
              { label: 'Ingestion pipeline', status: 'Operational', color: 'var(--mint)' },
              { label: 'Widget CDN', status: 'Operational', color: 'var(--mint)' },
            ].map((item) => (
              <div key={item.label} style={{
                padding: '14px 16px', background: 'var(--elevated)',
                border: '1px solid var(--border)', borderRadius: 'var(--r2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--t2)' }}>{item.label}</span>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '11px', fontWeight: 500, color: item.color,
                }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: item.color, boxShadow: `0 0 6px ${item.color}`,
                  }} />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
