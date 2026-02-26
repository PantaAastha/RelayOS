'use client';

import { useState } from 'react';

interface BehaviorTabProps {
    assistantType: 'reactive' | 'guided' | 'reference';
    onAssistantTypeChange: (type: 'reactive' | 'guided' | 'reference') => void;
    delegationConfig: DelegationConfig;
    onDelegationConfigChange: (config: DelegationConfig) => void;
}

export interface DelegationConfig {
    confidenceThreshold: number;
    readOnlyActionsAllowed: boolean;
    requireConfirmationFor: string[];
    hardRefusalTopics: string;
}

export const defaultDelegationConfig: DelegationConfig = {
    confidenceThreshold: 65,
    readOnlyActionsAllowed: true,
    requireConfirmationFor: ['ticket_creation', 'data_mutation'],
    hardRefusalTopics: '',
};

const AUTONOMY_LEVELS = [
    { id: 'conservative', em: '🛡️', label: 'Conservative', desc: 'Escalates often, minimal autonomous action' },
    { id: 'balanced', em: '⚖️', label: 'Balanced', desc: 'Answers confidently, escalates on ambiguity' },
    { id: 'proactive', em: '⚡', label: 'Proactive', desc: 'Acts autonomously, minimal escalation' },
];

const LOW_CONF_OPTS = [
    { id: 'escalate', label: 'Escalate to handoff', desc: 'Trigger n8n workflow and notify agent' },
    { id: 'partial', label: 'Answer with caveat', desc: 'Respond with uncertainty language' },
    { id: 'refuse', label: 'Decline to answer', desc: 'Hard stop, ask user to rephrase' },
];

const ACTIONS = [
    { action: 'doc.search', label: 'Search knowledge base', mode: 'auto', readonly: true },
    { action: 'code.generate', label: 'Generate code snippets', mode: 'auto', readonly: true },
    { action: 'checklist.update', label: 'Update onboarding checklist', mode: 'confirm', readonly: false },
    { action: 'ticket.create', label: 'Create support ticket', mode: 'confirm', readonly: false },
];

export default function BehaviorTab({
    assistantType, onAssistantTypeChange,
    delegationConfig, onDelegationConfigChange,
}: BehaviorTabProps) {
    const autonomyFromThreshold = delegationConfig.confidenceThreshold >= 75 ? 'conservative' : delegationConfig.confidenceThreshold >= 45 ? 'balanced' : 'proactive';
    const [lowConf, setLowConf] = useState('escalate');

    // Determine autonomy from slider
    const currentAutonomy = autonomyFromThreshold;

    return (
        <>
            {/* Autonomy Level */}
            <div className="studio-section">
                <div className="studio-section-title">Autonomy Level</div>
                <div className="aut-grid">
                    {AUTONOMY_LEVELS.map((l) => (
                        <div
                            key={l.id}
                            className={`aut-card${currentAutonomy === l.id ? ' on' : ''}`}
                            onClick={() => {
                                const thresh = l.id === 'conservative' ? 80 : l.id === 'balanced' ? 60 : 30;
                                onDelegationConfigChange({ ...delegationConfig, confidenceThreshold: thresh });
                            }}
                        >
                            <div className="aut-em">{l.em}</div>
                            <div className="aut-lb">{l.label}</div>
                            <div className="aut-ds">{l.desc}</div>
                        </div>
                    ))}
                </div>
                <div className="infobox">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>Autonomy level is derived from your threshold and action settings below. Changing those will update this indicator automatically.</span>
                </div>
            </div>

            {/* Confidence Threshold */}
            <div className="studio-section">
                <div className="studio-section-title">Confidence Threshold</div>
                <div style={{ marginBottom: '10px' }}>
                    <label className="flabel">Minimum confidence to answer autonomously</label>
                    <div className="thr-row">
                        <input
                            type="range" min="0" max="100"
                            value={delegationConfig.confidenceThreshold}
                            onChange={(e) => onDelegationConfigChange({ ...delegationConfig, confidenceThreshold: parseInt(e.target.value) })}
                            className="thr-slider"
                        />
                        <span className="thr-val">{delegationConfig.confidenceThreshold}%</span>
                    </div>
                </div>

                <div className="field">
                    <label className="flabel" style={{ marginBottom: '8px' }}>When confidence falls below threshold</label>
                    {LOW_CONF_OPTS.map((o) => (
                        <div key={o.id} className={`bopt${lowConf === o.id ? ' on' : ''}`} onClick={() => setLowConf(o.id)}>
                            <div className="rdot"><div className="rfill" /></div>
                            <div>
                                <div className="bopt-lb">{o.label}</div>
                                <div className="bopt-ds">{o.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Allowlist */}
            <div className="studio-section">
                <div className="studio-section-title">Action Allowlist</div>
                <div className="infobox" style={{ marginBottom: '12px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Actions marked <strong style={{ color: 'var(--t1)' }}>Auto</strong> execute without user confirmation. All others show a confirmation prompt.</span>
                </div>
                {ACTIONS.map((a) => (
                    <div className="coll-card" key={a.action} style={{ marginBottom: '6px' }}>
                        <div style={{ flex: 1 }}>
                            <div className="coll-nm">{a.label}</div>
                            <div className="coll-mt" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>{a.action}</div>
                        </div>
                        <span className="chip" style={
                            a.mode === 'auto'
                                ? { background: 'var(--mint1)', color: 'var(--mint)', border: '1px solid var(--mint2)' }
                                : { background: 'var(--amb1)', color: 'var(--amber)', border: '1px solid var(--amb2)' }
                        }>
                            {a.mode === 'auto' ? 'Auto' : 'Confirm'}
                        </span>
                    </div>
                ))}
            </div>
        </>
    );
}
