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
  const [inputTenantId, setInputTenantId] = useState('');
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedTenantId = localStorage.getItem('relayos_tenant_id');
    if (savedTenantId) {
      setTenantId(savedTenantId);
    }
  }, []);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

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

  const handleSaveTenant = () => {
    if (inputTenantId.trim()) {
      localStorage.setItem('relayos_tenant_id', inputTenantId.trim());
      setTenantId(inputTenantId.trim());
      setShowTenantModal(false);
      setInputTenantId('');
      window.location.reload();
    }
  };

  const handleCopyTenantId = () => {
    navigator.clipboard.writeText(tenantId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearTenant = () => {
    localStorage.removeItem('relayos_tenant_id');
    setTenantId('');
    setStats(null);
  };

  // Empty state - no tenant configured
  if (!tenantId) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Welcome to RelayOS Admin</p>
        </div>

        <div className="tenant-setup-card">
          <div className="tenant-setup-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="tenant-setup-title">Connect Your Tenant</h2>
          <p className="tenant-setup-description">
            Enter your tenant UUID to access your knowledge base and conversations.
          </p>
          <div className="tenant-input-group">
            <input
              type="text"
              className="form-input"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={inputTenantId}
              onChange={(e) => setInputTenantId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTenant()}
              style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '14px' }}
            />
            <button
              className="btn btn-primary"
              onClick={handleSaveTenant}
              disabled={!inputTenantId.trim()}
            >
              Connect
            </button>
          </div>
          <p className="tenant-setup-help">
            Don't have a tenant ID? Create one in your Supabase dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tenant change modal */}
      {showTenantModal && (
        <div className="modal-overlay" onClick={() => setShowTenantModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Change Tenant</h3>
            <p className="modal-message">Enter a new tenant UUID to switch workspaces.</p>
            <input
              type="text"
              className="form-input"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={inputTenantId}
              onChange={(e) => setInputTenantId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTenant()}
              style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '14px', marginBottom: '16px' }}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowTenantModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveTenant}
                disabled={!inputTenantId.trim()}
              >
                Switch Tenant
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your AI support copilot</p>
      </div>

      {/* Tenant info card */}
      <div className="tenant-info-card">
        <div className="tenant-info-header">
          <span className="tenant-info-label">Current Tenant</span>
          <div className="tenant-info-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowTenantModal(true)}
              title="Switch tenant"
            >
              Switch
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleClearTenant}
              title="Disconnect"
              style={{ color: 'var(--error)' }}
            >
              Disconnect
            </button>
          </div>
        </div>
        <div className="tenant-id-display">
          <code className="tenant-id-code">{tenantId}</code>
          <button
            className="btn btn-ghost btn-icon"
            onClick={handleCopyTenantId}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </button>
        </div>
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
    </div>
  );
}
