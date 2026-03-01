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
      <div className="content-area">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Overview of your AI support copilot</p>
        </div>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Organization overview across all assistants</p>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Assistants</div>
            <div className="stat-value">{assistants.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Documents</div>
            <div className="stat-value">{stats?.documentsCount || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Conversations</div>
            <div className="stat-value">{stats?.conversationsCount || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Messages</div>
            <div className="stat-value">{stats?.messagesCount || 0}</div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase' as const, color: 'var(--t2)', marginBottom: '12px' }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <Link href="/assistants" style={{ textDecoration: 'none' }}>
              <div className="coll-card" style={{ cursor: 'pointer', transition: 'all 0.15s' }}>
                <div className="coll-icon" style={{ background: 'var(--mint1)', color: 'var(--mint)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                  </svg>
                </div>
                <div className="coll-info">
                  <div className="coll-nm">Assistants</div>
                  <div className="coll-mt">Manage & configure</div>
                </div>
              </div>
            </Link>
            <Link href="/knowledge" style={{ textDecoration: 'none' }}>
              <div className="coll-card" style={{ cursor: 'pointer', transition: 'all 0.15s' }}>
                <div className="coll-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  </svg>
                </div>
                <div className="coll-info">
                  <div className="coll-nm">Knowledge</div>
                  <div className="coll-mt">Upload documents</div>
                </div>
              </div>
            </Link>
            <Link href="/quality" style={{ textDecoration: 'none' }}>
              <div className="coll-card" style={{ cursor: 'pointer', transition: 'all 0.15s' }}>
                <div className="coll-icon" style={{ background: 'var(--purple1)', color: 'var(--purple)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M18 20V10M12 20V4M6 20v-6" />
                  </svg>
                </div>
                <div className="coll-info">
                  <div className="coll-nm">Quality</div>
                  <div className="coll-mt">Review conversations</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
