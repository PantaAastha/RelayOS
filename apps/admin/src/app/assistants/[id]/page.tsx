'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Persona {
    name: string;
    tone: string;
    voice: string;
    boundaries: string;
    customInstructions: string;
}

interface StarterQuestion {
    label: string;
    message: string;
}

interface AssistantDetail {
    id: string;
    name: string;
    slug: string;
    persona: Persona;
    assistant_type: 'reactive' | 'guided' | 'reference';
    welcome_message: string;
    starter_questions: StarterQuestion[];
}

const defaultPersona: Persona = {
    name: '',
    tone: '',
    voice: '',
    boundaries: '',
    customInstructions: '',
};

export default function AssistantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const assistantId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assistant, setAssistant] = useState<AssistantDetail | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Form state
    const [persona, setPersona] = useState<Persona>(defaultPersona);
    const [assistantType, setAssistantType] = useState<'reactive' | 'guided' | 'reference'>('reactive');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [starterQuestions, setStarterQuestions] = useState<StarterQuestion[]>([]);

    useEffect(() => {
        if (assistantId) {
            fetchAssistant();
        }
    }, [assistantId]);

    const fetchAssistant = async () => {
        try {
            const res = await fetch(`${API_URL}/assistants/${assistantId}`);
            if (!res.ok) throw new Error('Assistant not found');
            const data = await res.json();
            setAssistant(data);
            setPersona(data.persona || defaultPersona);
            setAssistantType(data.assistant_type || 'reactive');
            setWelcomeMessage(data.welcome_message || '');
            setStarterQuestions(data.starter_questions || []);
        } catch (e) {
            console.error('Failed to load assistant:', e);
            showToast('error', 'Failed to load assistant');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

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
                    starter_questions: starterQuestions.filter(q => q.label.trim()),
                }),
            });
            if (!res.ok) throw new Error('Failed to save');
            showToast('success', 'Persona saved successfully');
        } catch (e) {
            console.error('Save failed:', e);
            showToast('error', 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const addStarterQuestion = () => {
        setStarterQuestions([...starterQuestions, { label: '', message: '' }]);
    };

    const removeStarterQuestion = (index: number) => {
        setStarterQuestions(starterQuestions.filter((_, i) => i !== index));
    };

    const updateStarterQuestion = (index: number, field: 'label' | 'message', value: string) => {
        const updated = [...starterQuestions];
        updated[index] = { ...updated[index], [field]: value };
        setStarterQuestions(updated);
    };

    if (loading) return <div className="page-container"><div className="loading">Loading...</div></div>;
    if (!assistant) return <div className="page-container"><div className="empty-state"><h3>Assistant not found</h3></div></div>;

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', borderRadius: '8px',
        border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
        color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit',
    };

    const textareaStyle: React.CSSProperties = {
        ...inputStyle, minHeight: '80px', resize: 'vertical' as const,
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '13px', fontWeight: 600,
        marginBottom: '6px', color: 'var(--text-secondary)',
    };

    const sectionStyle: React.CSSProperties = {
        background: 'var(--bg-primary)', borderRadius: '12px',
        border: '1px solid var(--border-color)', padding: '24px', marginBottom: '20px',
    };

    return (
        <div className="page-container">
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
                    padding: '12px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
                    background: toast.type === 'success' ? 'var(--success)' : 'var(--error)',
                    color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Link href="/assistants" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>
                        ← Back to Assistants
                    </Link>
                    <h1 className="page-title" style={{ marginTop: '8px' }}>{assistant.name}</h1>
                    <p className="page-description">Configure AI persona and widget behavior</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Persona Section */}
            <div style={sectionStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    🤖 AI Persona
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={labelStyle}>Persona Name</label>
                        <input
                            type="text" style={inputStyle} placeholder="e.g. Luna, Support Bot"
                            value={persona.name} onChange={e => setPersona({ ...persona, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Tone</label>
                        <input
                            type="text" style={inputStyle} placeholder="e.g. friendly, professional, casual"
                            value={persona.tone} onChange={e => setPersona({ ...persona, tone: e.target.value })}
                        />
                    </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                    <label style={labelStyle}>Voice / Style</label>
                    <textarea
                        style={textareaStyle}
                        placeholder="Describe how this assistant should communicate. e.g. 'Speaks like a knowledgeable friend. Uses short sentences. Avoids corporate jargon.'"
                        value={persona.voice}
                        onChange={e => setPersona({ ...persona, voice: e.target.value })}
                    />
                </div>
                <div style={{ marginTop: '16px' }}>
                    <label style={labelStyle}>Boundaries</label>
                    <textarea
                        style={textareaStyle}
                        placeholder="Topics the assistant should avoid or redirect. e.g. 'Never discuss competitor products. Don't provide legal or medical advice.'"
                        value={persona.boundaries}
                        onChange={e => setPersona({ ...persona, boundaries: e.target.value })}
                    />
                </div>
                <div style={{ marginTop: '16px' }}>
                    <label style={labelStyle}>Custom Instructions</label>
                    <textarea
                        style={textareaStyle}
                        placeholder="Any additional instructions for the AI. e.g. 'Always end responses with an offer to help further.'"
                        value={persona.customInstructions}
                        onChange={e => setPersona({ ...persona, customInstructions: e.target.value })}
                    />
                </div>
            </div>

            {/* Assistant Type Section */}
            <div style={sectionStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    ⚙️ Assistant Type
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {([
                        { value: 'reactive', label: 'Reactive', desc: 'Waits for questions, provides cited answers' },
                        { value: 'guided', label: 'Guided', desc: 'Proactively guides users step-by-step' },
                        { value: 'reference', label: 'Reference', desc: 'Technical answers with code examples' },
                    ] as const).map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setAssistantType(opt.value)}
                            style={{
                                flex: 1, padding: '16px', borderRadius: '10px', cursor: 'pointer',
                                border: assistantType === opt.value
                                    ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                background: assistantType === opt.value
                                    ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                                textAlign: 'left', fontFamily: 'inherit',
                                color: 'var(--text-primary)',
                            }}
                        >
                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{opt.label}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{opt.desc}</div>
                        </button>
                    ))}
                </div>
                {assistantType === 'guided' && (
                    <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Note: Guided mode currently affects system prompt tone only. Full step-tracking is planned for Phase 3.
                    </p>
                )}
            </div>

            {/* Welcome & Starters Section */}
            <div style={sectionStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    💬 Widget Welcome
                </h3>
                <div>
                    <label style={labelStyle}>Welcome Message</label>
                    <input
                        type="text" style={inputStyle}
                        placeholder="Hi there! How can I help you today?"
                        value={welcomeMessage}
                        onChange={e => setWelcomeMessage(e.target.value)}
                    />
                </div>

                <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Starter Questions</label>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={addStarterQuestion}
                            style={{ fontSize: '12px', padding: '4px 12px' }}
                        >
                            + Add
                        </button>
                    </div>
                    {starterQuestions.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No starter questions yet. Add some to help users get started.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {starterQuestions.map((q, i) => (
                                <div key={i} style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'start',
                                }}>
                                    <input
                                        type="text" style={inputStyle}
                                        placeholder="Chip label (e.g. 'Pricing info')"
                                        value={q.label}
                                        onChange={e => updateStarterQuestion(i, 'label', e.target.value)}
                                    />
                                    <input
                                        type="text" style={inputStyle}
                                        placeholder="Message sent on click"
                                        value={q.message}
                                        onChange={e => updateStarterQuestion(i, 'message', e.target.value)}
                                    />
                                    <button
                                        onClick={() => removeStarterQuestion(i)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'var(--error)', padding: '10px 8px', fontSize: '16px',
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
