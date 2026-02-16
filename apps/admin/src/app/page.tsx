'use client';

import { useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ASSISTANT_ID = process.env.NEXT_PUBLIC_ASSISTANT_ID || '';

interface Stats {
  documentsCount: number;
  conversationsCount: number;
  messagesCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [assistantId, setAssistantId] = useState(ASSISTANT_ID);
  const [inputAssistantId, setInputAssistantId] = useState('');
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check for assistant ID, fallback to tenant ID for migration
    const savedAssistantId = localStorage.getItem('relayos_assistant_id') || localStorage.getItem('relayos_tenant_id');
    if (savedAssistantId) {
      setAssistantId(savedAssistantId);
      // Migrate if needed
      if (!localStorage.getItem('relayos_assistant_id')) {
        localStorage.setItem('relayos_assistant_id', savedAssistantId);
      }
    }
  }, []);

  const fetchStats = useCallback(async () => {
    if (!assistantId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/conversation/stats`, {
        headers: { 'X-Assistant-ID': assistantId },
      });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [assistantId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
    localStorage.removeItem('relayos_tenant_id'); // Clear legacy too
    setAssistantId('');
    setStats(null);
  };

  // Empty state - no assistant configured
  if (!assistantId) {
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
          <h2 className="tenant-setup-title">Connect Your Assistant</h2>
          <p className="tenant-setup-description">
            Enter your Assistant UUID to access your knowledge base and conversations.
          </p>
          <div className="tenant-input-group">
            <input
              type="text"
              className="form-input"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={inputAssistantId}
              onChange={(e) => setInputAssistantId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveAssistant()}
              style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '14px' }}
            />
            <button
              className="btn btn-primary"
              onClick={handleSaveAssistant}
              disabled={!inputAssistantId.trim()}
            >
              Connect
            </button>
          </div>
          <p className="tenant-setup-help">
            Select an assistant from the Assistants page or create a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Assistant change modal */}
      {showAssistantModal && (
        <div className="modal-overlay" onClick={() => setShowAssistantModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Switch Assistant</h3>
            <p className="modal-message">Enter a new assistant UUID to switch workspaces.</p>
            <input
              type="text"
              className="form-input"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={inputAssistantId}
              onChange={(e) => setInputAssistantId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveAssistant()}
              style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '14px', marginBottom: '16px' }}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAssistantModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveAssistant}
                disabled={!inputAssistantId.trim()}
              >
                Switch Assistant
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your AI support copilot</p>
      </div>

      {/* Assistant info card */}
      <div className="tenant-info-card">
        <div className="tenant-info-header">
          <span className="tenant-info-label">Current Assistant</span>
          <div className="tenant-info-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowAssistantModal(true)}
              title="Switch assistant"
            >
              Switch
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleClearAssistant}
              title="Disconnect"
              style={{ color: 'var(--error)' }}
            >
              Disconnect
            </button>
          </div>
        </div>
        <div className="tenant-id-display">
          <code className="tenant-id-code">{assistantId}</code>
          <button
            className="btn btn-ghost btn-icon"
            onClick={handleCopyAssistantId}
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
