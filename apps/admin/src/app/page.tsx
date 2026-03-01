'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Stats {
  documentsCount: number;
  conversationsCount: number;
  messagesCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [assistantId, setAssistantId] = useState('');
  const [inputAssistantId, setInputAssistantId] = useState('');
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedAssistantId = localStorage.getItem('relayos_assistant_id') || localStorage.getItem('relayos_tenant_id');
    if (savedAssistantId) {
      setAssistantId(savedAssistantId);
      if (!localStorage.getItem('relayos_assistant_id')) {
        localStorage.setItem('relayos_assistant_id', savedAssistantId);
      }
    }
  }, []);

  const fetchStats = useCallback(async () => {
    if (!assistantId) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/conversation/stats`, { headers: { 'X-Assistant-ID': assistantId } });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [assistantId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSaveAssistant = () => {
    if (inputAssistantId.trim()) {
      localStorage.setItem('relayos_assistant_id', inputAssistantId.trim());
      setAssistantId(inputAssistantId.trim());
      setShowAssistantModal(false);
      setInputAssistantId('');
      window.location.reload();
    }
  };

  const handleCopyAssistantId = () => {
    navigator.clipboard.writeText(assistantId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearAssistant = () => {
    localStorage.removeItem('relayos_assistant_id');
    localStorage.removeItem('relayos_tenant_id');
    setAssistantId('');
    setStats(null);
  };

  // Empty state
  if (!assistantId) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-description">Welcome to RelayOS Admin</p>
          </div>
        </div>
        <div className="page-body">
          <div style={{
            maxWidth: '480px', margin: '40px auto', textAlign: 'center',
            background: 'var(--elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--r3)', padding: '40px 32px',
          }}>
            <div style={{
              width: '44px', height: '44px', margin: '0 auto 16px', borderRadius: 'var(--r2)',
              background: 'var(--mint1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="1.5" width="22" height="22">
                <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, color: 'var(--t1)', marginBottom: '6px' }}>
              Connect Your Assistant
            </div>
            <div style={{ fontSize: '12px', color: 'var(--t2)', marginBottom: '20px', lineHeight: 1.5 }}>
              Enter your Assistant UUID or go to the Assistants page to get started.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="finput"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={inputAssistantId}
                onChange={(e) => setInputAssistantId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveAssistant()}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', flex: 1 }}
              />
              <button className="btn btn-primary" onClick={handleSaveAssistant} disabled={!inputAssistantId.trim()}>
                Connect
              </button>
            </div>
            <div style={{ marginTop: '16px' }}>
              <Link href="/assistants" className="btn btn-ghost btn-sm">
                Or manage assistants →
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Modal */}
      {showAssistantModal && (
        <div className="modal-overlay" onClick={() => setShowAssistantModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Switch Assistant</h3>
            <p className="modal-message">Enter a new assistant UUID to switch workspaces.</p>
            <input
              className="finput"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={inputAssistantId}
              onChange={(e) => setInputAssistantId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveAssistant()}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', marginBottom: '16px' }}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAssistantModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveAssistant} disabled={!inputAssistantId.trim()}>
                Switch
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="content-area">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-description">Overview of your AI support copilot</p>
          </div>
        </div>

        <div className="page-body">
          {/* Assistant info */}
          <div className="coll-card" style={{ marginBottom: '20px' }}>
            <div className="coll-icon" style={{ background: 'var(--mint1)', color: 'var(--mint)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
              </svg>
            </div>
            <div className="coll-info">
              <div className="coll-nm">Current Assistant</div>
              <div className="coll-mt" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>{assistantId}</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-ghost btn-sm" onClick={handleCopyAssistantId}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAssistantModal(true)}>Switch</button>
              <button className="btn btn-ghost btn-sm" onClick={handleClearAssistant} style={{ color: 'var(--red)' }}>
                Disconnect
              </button>
            </div>
          </div>

          {/* Stats */}
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
    </>
  );
}
