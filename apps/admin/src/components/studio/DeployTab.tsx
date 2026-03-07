'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';

import { WidgetThemeConfig } from './WidgetThemeTab';

interface DeployTabProps {
    assistantId: string;
    apiUrl: string;
    domainAllowlist: string;
    onDomainAllowlistChange: (domains: string) => void;
    widgetTheme: WidgetThemeConfig;
}

export default function DeployTab({ assistantId, apiUrl, domainAllowlist, onDomainAllowlistChange, widgetTheme }: DeployTabProps) {
    const { addToast } = useToast();
    const [copied, setCopied] = useState(false);

    const embedSnippet = `<!-- RelayOS Chat Widget -->
<script
  src="${apiUrl.replace('/api', '')}/widget.js"
  data-assistant-id="${assistantId}"
  data-api-url="${apiUrl}"
  data-mode="${widgetTheme.widgetMode}"
  data-placement="${widgetTheme.placement}"
  data-primary-color="${widgetTheme.primaryColor}"
  data-background-color="${widgetTheme.backgroundColor}"
  data-text-color="${widgetTheme.textColor}"
  data-title="${widgetTheme.widgetTitle.replace(/"/g, '&quot;')}"${widgetTheme.avatarIcon ? `\n  data-avatar="${widgetTheme.avatarIcon.replace(/"/g, '&quot;')}"` : ''}
  async
></script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(embedSnippet);
        setCopied(true);
        addToast({ title: 'Copied!', message: 'Embed snippet copied to clipboard', variant: 'success' });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <div className="studio-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div className="studio-section-title" style={{ marginBottom: 0 }}>Embed Snippet</div>
                    <button className="btn btn-primary btn-sm" onClick={handleCopy}>
                        {copied ? '✓ Copied' : 'Copy Snippet'}
                    </button>
                </div>
                <pre style={{
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r)', padding: '12px',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
                    color: 'var(--t2)', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>
                    {embedSnippet}
                </pre>
                <div className="infobox" style={{ marginTop: '10px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>Add this snippet before the closing <code style={{ color: 'var(--t1)' }}>&lt;/body&gt;</code> tag on your website.</span>
                </div>
            </div>

            <div className="studio-section">
                <div className="studio-section-title">Domain Allowlist</div>
                <div className="field">
                    <label className="flabel">Allowed Domains (one per line)</label>
                    <textarea className="fta"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        placeholder="example.com&#10;app.example.com&#10;*.example.com"
                        value={domainAllowlist}
                        onChange={(e) => onDomainAllowlistChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="studio-section">
                <div className="studio-section-title">Environments</div>
                <div className="coll-card" style={{ marginBottom: '6px' }}>
                    <div className="coll-icon" style={{ background: 'var(--mint1)', color: 'var(--mint)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
                        </svg>
                    </div>
                    <div className="coll-info">
                        <div className="coll-nm">Staging</div>
                        <div className="coll-mt">data-environment=&quot;staging&quot;</div>
                    </div>
                    <span className="chip" style={{ background: 'var(--amb1)', color: 'var(--amber)' }}>Testing</span>
                </div>
                <div className="coll-card">
                    <div className="coll-icon" style={{ background: 'var(--mint1)', color: 'var(--mint)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
                        </svg>
                    </div>
                    <div className="coll-info">
                        <div className="coll-nm">Production</div>
                        <div className="coll-mt">data-environment=&quot;production&quot;</div>
                    </div>
                    <span className="chip chip-live">
                        <span className="chip-dot" />
                        Active
                    </span>
                </div>
            </div>
        </>
    );
}
