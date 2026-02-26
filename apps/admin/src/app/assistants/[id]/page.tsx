'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import PersonaTab from '@/components/studio/PersonaTab';
import BehaviorTab from '@/components/studio/BehaviorTab';
import KnowledgeTab from '@/components/studio/KnowledgeTab';
import HandoffTab, { HandoffConfig, defaultHandoffConfig } from '@/components/studio/HandoffTab';
import WidgetThemeTab, { WidgetThemeConfig, defaultWidgetTheme } from '@/components/studio/WidgetThemeTab';
import DeployTab from '@/components/studio/DeployTab';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Persona {
    name: string;
    tone: string;
    voice: string;
    boundaries: string;
    customInstructions: string;
}

interface StarterQuestion { label: string; message: string; }

interface AssistantData {
    id: string;
    name: string;
    slug: string;
    assistant_type: 'reactive' | 'guided' | 'reference';
    persona: Persona;
    welcome_message: string;
    starter_questions: StarterQuestion[];
    config: Record<string, any>;
}

const defaultPersona: Persona = { name: '', tone: '', voice: '', boundaries: '', customInstructions: '' };

const TYPE_META: Record<string, { label: string; chipClass: string }> = {
    reactive: { label: 'Support', chipClass: 'chip-support' },
    reference: { label: 'Docs', chipClass: 'chip-docs' },
    guided: { label: 'Onboarding', chipClass: 'chip-onboard' },
};

const TABS = [
    { id: 'persona', label: 'Persona', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
    { id: 'behavior', label: 'Behavior', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg> },
    { id: 'knowledge', label: 'Knowledge', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg> },
    { id: 'handoff', label: 'Handoff', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M18 9a9 9 0 01-9 9" /></svg> },
    { id: 'widget', label: 'Widget', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><circle cx="13.5" cy="6.5" r="0.5" /><circle cx="17.5" cy="10.5" r="0.5" /><circle cx="8.5" cy="7.5" r="0.5" /><circle cx="6.5" cy="12" r="0.5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg> },
    { id: 'deploy', label: 'Deploy', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg> },
] as const;

type TabId = typeof TABS[number]['id'];

export default function StudioPage() {
    const params = useParams();
    const assistantId = params.id as string;
    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assistant, setAssistant] = useState<AssistantData | null>(null);
    const [tab, setTab] = useState<TabId>('persona');

    // Form state
    const [persona, setPersona] = useState<Persona>(defaultPersona);
    const [assistantType, setAssistantType] = useState<'reactive' | 'guided' | 'reference'>('reactive');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [starterQuestions, setStarterQuestions] = useState<StarterQuestion[]>([]);
    const [delegationConfig, setDelegationConfig] = useState({ confidenceThreshold: 65, readOnlyActionsAllowed: true, requireConfirmationFor: ['ticket_creation', 'data_mutation'], hardRefusalTopics: '' });
    const [handoffConfig, setHandoffConfig] = useState<HandoffConfig>(defaultHandoffConfig);
    const [widgetTheme, setWidgetTheme] = useState<WidgetThemeConfig>(defaultWidgetTheme);
    const [domainAllowlist, setDomainAllowlist] = useState('');
    const [autonomy, setAutonomy] = useState('balanced');
    const [threshold, setThreshold] = useState(65);
    const [lowConf, setLowConf] = useState('escalate');

    const fetchAssistant = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/assistants/${assistantId}`);
            if (!res.ok) throw new Error('Not found');
            const data: AssistantData = await res.json();
            setAssistant(data);
            setPersona(data.persona || defaultPersona);
            setAssistantType(data.assistant_type || 'reactive');
            setWelcomeMessage(data.welcome_message || '');
            setStarterQuestions(data.starter_questions || []);
            if (data.config) {
                setWidgetTheme({
                    primaryColor: data.config.primaryColor || defaultWidgetTheme.primaryColor,
                    widgetTitle: data.config.widgetTitle || defaultWidgetTheme.widgetTitle,
                    placement: defaultWidgetTheme.placement,
                });
            }
        } catch {
            addToast({ title: 'Error', message: 'Failed to load assistant', variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [assistantId, addToast]);

    useEffect(() => { if (assistantId) fetchAssistant(); }, [assistantId, fetchAssistant]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/assistants/${assistantId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    persona,
                    assistant_type: assistantType,
                    welcome_message: welcomeMessage,
                    starter_questions: starterQuestions.filter((q) => q.label.trim()),
                    config: { ...assistant?.config, widgetTitle: widgetTheme.widgetTitle, primaryColor: widgetTheme.primaryColor },
                }),
            });
            if (!res.ok) throw new Error('Failed');
            addToast({ title: 'Saved', message: 'Changes saved successfully', variant: 'success' });
        } catch {
            addToast({ title: 'Error', message: 'Failed to save', variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="studio-container">
                <div className="loading">Loading Studio...</div>
            </div>
        );
    }

    if (!assistant) {
        return (
            <div className="empty-state" style={{ height: '100vh' }}>
                <h3>Assistant not found</h3>
                <Link href="/assistants" className="btn btn-primary" style={{ marginTop: '12px' }}>Back to Assistants</Link>
            </div>
        );
    }

    const meta = TYPE_META[assistantType] || TYPE_META.reactive;

    const renderTab = () => {
        switch (tab) {
            case 'persona': return <PersonaTab persona={persona} welcomeMessage={welcomeMessage} starterQuestions={starterQuestions} onPersonaChange={setPersona} onWelcomeMessageChange={setWelcomeMessage} onStarterQuestionsChange={setStarterQuestions} />;
            case 'behavior': return <BehaviorTab assistantType={assistantType} onAssistantTypeChange={setAssistantType} delegationConfig={delegationConfig} onDelegationConfigChange={setDelegationConfig} />;
            case 'knowledge': return <KnowledgeTab />;
            case 'handoff': return <HandoffTab config={handoffConfig} onChange={setHandoffConfig} />;
            case 'widget': return <WidgetThemeTab config={widgetTheme} onChange={setWidgetTheme} />;
            case 'deploy': return <DeployTab assistantId={assistantId} apiUrl={API_URL} domainAllowlist={domainAllowlist} onDomainAllowlistChange={setDomainAllowlist} />;
        }
    };

    return (
        <div className="studio-container">
            {/* Top bar */}
            <div className="topbar">
                <div className="topbar-l">
                    <Link href="/assistants" className="back-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Assistants
                    </Link>
                    <div className="topbar-sep" />
                    <span className="topbar-name">{assistant.name}</span>
                    <span className={`chip ${meta.chipClass}`}>
                        <span className="chip-dot" />
                        {meta.label}
                    </span>
                    <span className="chip chip-live">
                        <span className="chip-dot" />
                        Live
                    </span>
                </div>
                <div className="topbar-r">
                    <button className="btn btn-ghost btn-sm">Discard</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Studio body */}
            <div className="studio-body">
                {/* Config panel (left) */}
                <div className="studio-left">
                    <div className="studio-tabs">
                        {TABS.map(({ id, label, icon }) => (
                            <button
                                key={id}
                                className={`studio-tab${tab === id ? ' studio-tab--active' : ''}`}
                                onClick={() => setTab(id)}
                            >
                                {icon}
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="studio-tab-content">
                        {renderTab()}
                    </div>
                </div>

                {/* Preview panel (right) */}
                <div className="studio-right">
                    <div className="preview-header">
                        <div className="preview-label">
                            <div className="live-dot" />
                            Live Preview
                        </div>
                        <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
                            <div className="ctx-badge">page: /getting-started</div>
                            <button className="btn btn-ghost btn-sm">Context</button>
                        </div>
                    </div>

                    <div className="preview-body">
                        {/* Welcome */}
                        <div className="preview-welcome">
                            <div className="preview-welcome-title">{persona.name || assistant.name}</div>
                            <div className="preview-welcome-msg">{welcomeMessage || 'Hi there! How can I help you today?'}</div>
                            <div className="starter-chips">
                                {starterQuestions.filter(q => q.label.trim()).map((q, i) => (
                                    <div key={i} className="starter-chip">{q.label}</div>
                                ))}
                                {starterQuestions.filter(q => q.label.trim()).length === 0 && (
                                    <div className="starter-chip" style={{ opacity: 0.5 }}>Add starter questions in Persona tab</div>
                                )}
                            </div>
                        </div>

                        {/* Sample user message */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div className="msg-user">How do I get started?</div>
                        </div>

                        {/* Sample assistant response */}
                        <div className="msg-assistant">
                            <div className="msg-avatar">{(persona.name || assistant.name || 'A')[0]}</div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div className="msg-bubble">
                                    I&apos;d be happy to help you get started! Here&apos;s what you need to do...
                                    <div>
                                        <div className="confidence-badge">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Supported · 94%
                                        </div>
                                    </div>
                                </div>
                                <button className="trace-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                    Open trace
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Input */}
                    <div className="preview-input">
                        <div className="preview-input-wrap">
                            <input className="preview-input-field" placeholder="Ask a question to preview…" />
                            <button className="send-btn">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
