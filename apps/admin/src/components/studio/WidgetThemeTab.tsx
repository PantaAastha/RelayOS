'use client';

export interface WidgetThemeConfig {
    primaryColor: string;
    widgetTitle: string;
    placement: 'bottom-right' | 'bottom-left';
}

export const defaultWidgetTheme: WidgetThemeConfig = {
    primaryColor: '#1DFFA0',
    widgetTitle: 'Chat with us',
    placement: 'bottom-right',
};

interface WidgetThemeTabProps {
    config: WidgetThemeConfig;
    onChange: (config: WidgetThemeConfig) => void;
}

export default function WidgetThemeTab({ config, onChange }: WidgetThemeTabProps) {
    return (
        <>
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
                </div>
            </div>

            <div className="studio-section">
                <div className="studio-section-title">Placement</div>
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

            <div className="studio-section">
                <div className="studio-section-title">Preview</div>
                <div className="coll-card">
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: config.primaryColor, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 12px ${config.primaryColor}44`, flexShrink: 0,
                    }}>
                        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                    </div>
                    <div className="coll-info">
                        <div className="coll-nm">{config.widgetTitle || 'Chat with us'}</div>
                        <div className="coll-mt">{config.placement}</div>
                    </div>
                </div>
            </div>
        </>
    );
}
