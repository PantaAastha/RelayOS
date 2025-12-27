'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || '';

interface Stats {
  documentsCount: number;
  conversationsCount: number;
  messagesCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState(TENANT_ID);

  useEffect(() => {
    // Check localStorage for tenant ID
    const savedTenantId = localStorage.getItem('relayos_tenant_id');
    if (savedTenantId) {
      setTenantId(savedTenantId);
    }
  }, []);

  useEffect(() => {
    if (!tenantId) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/conversation/stats`, {
          headers: { 'X-Tenant-ID': tenantId },
        });
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [tenantId]);

  const handleSetTenant = () => {
    const id = prompt('Enter your Tenant UUID:');
    if (id) {
      localStorage.setItem('relayos_tenant_id', id);
      setTenantId(id);
      window.location.reload();
    }
  };

  if (!tenantId) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Welcome to RelayOS Admin</p>
        </div>
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <h3>No Tenant Configured</h3>
          <p>Set your tenant UUID to get started</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleSetTenant}>
            Set Tenant ID
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your AI support copilot</p>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="stats-grid">
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
      )}

      <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
        Tenant ID: {tenantId.substring(0, 8)}...{' '}
        <button
          onClick={handleSetTenant}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Change
        </button>
      </div>
    </div>
  );
}
