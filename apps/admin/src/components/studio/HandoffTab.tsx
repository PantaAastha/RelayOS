'use client';

export interface HandoffConfig {
    n8nWebhookUrl: string;
    triggerThreshold: number;
    enabled: boolean;
}

export const defaultHandoffConfig: HandoffConfig = {
    n8nWebhookUrl: '',
    triggerThreshold: 40,
    enabled: false,
};

interface HandoffTabProps {
    config: HandoffConfig;
    onChange: (config: HandoffConfig) => void;
}

export default function HandoffTab({ config, onChange }: HandoffTabProps) {
    if (!config.enabled) {
        return (
            <div className="placeholder-tab">
                <div className="placeholder-tab-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M18 9a9 9 0 01-9 9" />
                    </svg>
                </div>
                <div className="placeholder-tab-title">Handoff Configuration</div>
                <div className="placeholder-tab-desc">Connect n8n workflows and set escalation triggers for human handoff.</div>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '8px' }} onClick={() => onChange({ ...config, enabled: true })}>
                    Enable Handoff
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="studio-section">
                <div className="studio-section-title">Webhook</div>
                <div className="field">
                    <label className="flabel">n8n Webhook URL</label>
                    <input className="finput"
                        type="url"
                        placeholder="https://your-n8n.example.com/webhook/handoff"
                        value={config.n8nWebhookUrl}
                        onChange={(e) => onChange({ ...config, n8nWebhookUrl: e.target.value })}
                    />
                </div>
                <div className="infobox">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>The webhook receives full conversation context when handoff is triggered, including the user&apos;s last message and confidence scores.</span>
                </div>
            </div>

            <div className="studio-section">
                <div className="studio-section-title">Trigger</div>
                <div className="field">
                    <label className="flabel">Escalate when confidence is below {config.triggerThreshold}%</label>
                    <div className="thr-row">
                        <input type="range" min="10" max="80" step="5"
                            value={config.triggerThreshold}
                            onChange={(e) => onChange({ ...config, triggerThreshold: parseInt(e.target.value) })}
                            className="thr-slider"
                        />
                        <span className="thr-val">{config.triggerThreshold}%</span>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '12px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => onChange({ ...config, enabled: false })}>
                    Disable Handoff
                </button>
            </div>
        </>
    );
}
