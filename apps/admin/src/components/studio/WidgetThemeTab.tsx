'use client';

export interface WidgetThemeConfig {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    widgetTitle: string;
    avatarIcon: string;
    placement: 'bottom-right' | 'bottom-left';
    widgetMode: 'popup' | 'side-panel' | 'floating-avatar';
    sidePanelBehavior?: 'push' | 'overlay';
    sidePanelWidth?: 'narrow' | 'standard' | 'wide';
    sidePanelTrigger?: 'handle' | 'button';
    avatarSize?: 'medium' | 'large';
    avatarAnimation?: boolean;
}

export const defaultWidgetTheme: WidgetThemeConfig = {
    primaryColor: '#1DFFA0',
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    widgetTitle: 'Chat with us',
    avatarIcon: '',
    placement: 'bottom-right',
    widgetMode: 'popup',
    sidePanelBehavior: 'push',
    sidePanelWidth: 'standard',
    sidePanelTrigger: 'handle',
    avatarSize: 'medium',
    avatarAnimation: true,
};

export interface StarterQuestion { label: string; message: string; }

interface WidgetThemeTabProps {
    config: WidgetThemeConfig;
    onChange: (config: WidgetThemeConfig) => void;
    welcomeMessage: string;
    onWelcomeMessageChange: (msg: string) => void;
    starterQuestions: StarterQuestion[];
    onStarterQuestionsChange: (questions: StarterQuestion[]) => void;
}

export default function WidgetThemeTab({
    config, onChange,
    welcomeMessage, onWelcomeMessageChange,
    starterQuestions, onStarterQuestionsChange
}: WidgetThemeTabProps) {

    const addQuestion = () => {
        onStarterQuestionsChange([...starterQuestions, { label: '', message: '' }]);
    };

    const removeQuestion = (i: number) => {
        onStarterQuestionsChange(starterQuestions.filter((_, idx) => idx !== i));
    };

    const updateQuestion = (i: number, field: 'label' | 'message', value: string) => {
        const updated = [...starterQuestions];
        updated[i] = { ...updated[i], [field]: value };
        onStarterQuestionsChange(updated);
    };

    return (
        <>
            <div className="studio-section">
                <div className="studio-section-title">Content</div>
                <div className="field">
                    <label className="flabel">Welcome Message</label>
                    <input className="finput" placeholder="Hi there! How can I help you today?"
                        value={welcomeMessage} onChange={(e) => onWelcomeMessageChange(e.target.value)} />
                </div>
                <div className="field">
                    <label className="flabel">Starter Questions</label>
                    <div className="slist">
                        {starterQuestions.map((q, i) => (
                            <div className="sitem" key={i}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" style={{ color: 'var(--t3)' }}>
                                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                </svg>
                                <input value={q.label} onChange={(e) => updateQuestion(i, 'label', e.target.value)} placeholder="Starter question..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: 'var(--t1)' }} />
                                <button className="srbtn" onClick={() => removeQuestion(i)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button className="addbtn" onClick={addQuestion}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add starter
                    </button>
                </div>
            </div>

            <div className="studio-section">
                <div className="studio-section-title">Appearance</div>
                <div className="frow">
                    <div className="field">
                        <label className="flabel">Widget Title</label>
                        <input className="finput" placeholder="Chat with us"
                            value={config.widgetTitle}
                            onChange={(e) => onChange({ ...config, widgetTitle: e.target.value })} />
                    </div>
                    <div className="field">
                        <label className="flabel">Avatar Icon (Emoji)</label>
                        <input className="finput" placeholder="💬" maxLength={2}
                            value={config.avatarIcon}
                            onChange={(e) => onChange({ ...config, avatarIcon: e.target.value })} />
                    </div>
                </div>

                <div className="frow" style={{ marginTop: '16px' }}>
                    <div className="field">
                        <label className="flabel">Primary Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="color" value={config.primaryColor}
                                onChange={(e) => onChange({ ...config, primaryColor: e.target.value })}
                                style={{ width: '36px', height: '36px', border: 'none', borderRadius: 'var(--r)', cursor: 'pointer', background: 'none' }}
                            />
                            <input className="finput" style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                value={config.primaryColor}
                                onChange={(e) => onChange({ ...config, primaryColor: e.target.value })} />
                        </div>
                    </div>
                    <div className="field">
                        <label className="flabel">Background Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="color" value={config.backgroundColor || '#ffffff'}
                                onChange={(e) => onChange({ ...config, backgroundColor: e.target.value })}
                                style={{ width: '36px', height: '36px', border: 'none', borderRadius: 'var(--r)', cursor: 'pointer', background: 'none' }}
                            />
                            <input className="finput" style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                value={config.backgroundColor || '#ffffff'}
                                onChange={(e) => onChange({ ...config, backgroundColor: e.target.value })} />
                        </div>
                    </div>
                    <div className="field">
                        <label className="flabel">Text Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="color" value={config.textColor || '#1a1a1a'}
                                onChange={(e) => onChange({ ...config, textColor: e.target.value })}
                                style={{ width: '36px', height: '36px', border: 'none', borderRadius: 'var(--r)', cursor: 'pointer', background: 'none' }}
                            />
                            <input className="finput" style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                value={config.textColor || '#1a1a1a'}
                                onChange={(e) => onChange({ ...config, textColor: e.target.value })} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="studio-section">
                <div className="studio-section-title">Display Mode</div>
                <div className="aut-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {(['popup', 'side-panel', 'floating-avatar'] as const).map((mode) => (
                        <div key={mode} className={`aut-card${config.widgetMode === mode ? ' on' : ''}`}
                            onClick={() => onChange({ ...config, widgetMode: mode })}>
                            <div className="aut-lb" style={{ textTransform: 'capitalize' }}>{mode.replace('-', ' ')}</div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '16px' }}>
                    <label className="flabel" style={{ marginBottom: '8px', display: 'block' }}>Placement</label>
                    <div className="aut-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        {(['bottom-right', 'bottom-left'] as const).map((pos) => (
                            <div key={pos} className={`aut-card${config.placement === pos ? ' on' : ''}`}
                                onClick={() => onChange({ ...config, placement: pos })}>
                                <div className="aut-lb">{pos === 'bottom-right' ? 'Bottom Right' : 'Bottom Left'}</div>
                                <div className="aut-ds">Opens from the {pos === 'bottom-right' ? 'right' : 'left'} corner</div>
                            </div>
                        ))}
                    </div>
                </div>

                {config.widgetMode === 'side-panel' && (
                    <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg2)', borderRadius: 'var(--r)' }}>
                        <div className="studio-section-title" style={{ fontSize: '12px', marginBottom: '12px' }}>Side Panel Options</div>

                        <label className="flabel" style={{ marginBottom: '8px', display: 'block' }}>Behavior</label>
                        <div className="aut-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '16px' }}>
                            {(['push', 'overlay'] as const).map((behav) => (
                                <div key={behav} className={`aut-card${config.sidePanelBehavior === behav || (!config.sidePanelBehavior && behav === 'push') ? ' on' : ''}`}
                                    onClick={() => onChange({ ...config, sidePanelBehavior: behav })}>
                                    <div className="aut-lb" style={{ textTransform: 'capitalize' }}>{behav}</div>
                                </div>
                            ))}
                        </div>

                        <label className="flabel" style={{ marginBottom: '8px', display: 'block' }}>Width</label>
                        <div className="aut-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '16px' }}>
                            {(['narrow', 'standard', 'wide'] as const).map((w) => (
                                <div key={w} className={`aut-card${config.sidePanelWidth === w || (!config.sidePanelWidth && w === 'standard') ? ' on' : ''}`}
                                    onClick={() => onChange({ ...config, sidePanelWidth: w })}>
                                    <div className="aut-lb" style={{ textTransform: 'capitalize' }}>{w}</div>
                                </div>
                            ))}
                        </div>

                        <label className="flabel" style={{ marginBottom: '8px', display: 'block' }}>Trigger Style</label>
                        <div className="aut-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            {(['handle', 'button'] as const).map((trig) => (
                                <div key={trig} className={`aut-card${config.sidePanelTrigger === trig || (!config.sidePanelTrigger && trig === 'handle') ? ' on' : ''}`}
                                    onClick={() => onChange({ ...config, sidePanelTrigger: trig })}>
                                    <div className="aut-lb" style={{ textTransform: 'capitalize' }}>{trig}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {config.widgetMode === 'floating-avatar' && (
                    <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg2)', borderRadius: 'var(--r)' }}>
                        <div className="studio-section-title" style={{ fontSize: '12px', marginBottom: '12px' }}>Floating Avatar Options</div>

                        <label className="flabel" style={{ marginBottom: '8px', display: 'block' }}>Size</label>
                        <div className="aut-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '16px' }}>
                            {(['medium', 'large'] as const).map((size) => (
                                <div key={size} className={`aut-card${config.avatarSize === size || (!config.avatarSize && size === 'medium') ? ' on' : ''}`}
                                    onClick={() => onChange({ ...config, avatarSize: size })}>
                                    <div className="aut-lb" style={{ textTransform: 'capitalize' }}>{size}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                            <input type="checkbox" checked={config.avatarAnimation !== false}
                                onChange={(e) => onChange({ ...config, avatarAnimation: e.target.checked })} />
                            <label className="flabel" style={{ margin: 0, cursor: 'pointer' }}
                                onClick={() => onChange({ ...config, avatarAnimation: !(config.avatarAnimation !== false) })}>Enable Idle Breathing Animation</label>
                        </div>
                    </div>
                )}
            </div>

            <div className="studio-section">
                <div className="studio-section-title">Preview</div>
                <div className="coll-card" style={{ background: config.backgroundColor || '#fff', borderColor: 'var(--border)' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: config.primaryColor, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 12px ${config.primaryColor}44`, flexShrink: 0,
                        fontSize: '16px'
                    }}>
                        {config.avatarIcon || (
                            <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                            </svg>
                        )}
                    </div>
                    <div className="coll-info">
                        <div className="coll-nm" style={{ color: config.textColor || '#1a1a1a' }}>{config.widgetTitle || 'Chat with us'}</div>
                        <div className="coll-mt" style={{ color: config.textColor || '#1a1a1a', opacity: 0.7 }}>
                            {config.widgetMode} • {config.placement}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
