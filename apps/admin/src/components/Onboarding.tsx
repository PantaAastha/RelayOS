'use client';

import { useState } from 'react';
import { useOrg } from './OrgContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Onboarding() {
    const { refresh } = useOrg();
    const [step, setStep] = useState<'org' | 'assistant'>('org');

    // Org fields
    const [orgName, setOrgName] = useState('');
    const [orgSlug, setOrgSlug] = useState('');

    // Assistant fields
    const [assistantName, setAssistantName] = useState('');
    const [assistantSlug, setAssistantSlug] = useState('');
    const [assistantType, setAssistantType] = useState<'reactive' | 'guided' | 'reference'>('reactive');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [orgId, setOrgId] = useState('');

    const handleOrgNameChange = (val: string) => {
        setOrgName(val);
        setOrgSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    };

    const handleAssistantNameChange = (val: string) => {
        setAssistantName(val);
        setAssistantSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    };

    const handleCreateOrg = async () => {
        if (!orgName.trim() || !orgSlug.trim()) {
            setError('Organization name is required');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/organizations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: orgName.trim(), slug: orgSlug.trim() }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to create organization');
            }
            const org = await res.json();
            setOrgId(org.id);
            setStep('assistant');
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateAssistant = async () => {
        if (!assistantName.trim() || !assistantSlug.trim()) {
            setError('Assistant name is required');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/assistants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: assistantName.trim(),
                    slug: assistantSlug.trim(),
                    organizationId: orgId,
                    assistant_type: assistantType,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to create assistant');
            }
            // Done — refresh context to exit onboarding
            await refresh();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkipAssistant = async () => {
        await refresh();
    };

    const TYPE_INFO = {
        reactive: { label: 'Support', desc: 'Answers questions using your knowledge base' },
        guided: { label: 'Onboarding', desc: 'Guides users step-by-step through processes' },
        reference: { label: 'Docs', desc: 'Surfaces precise references from documentation' },
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            padding: '24px',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '480px',
            }}>
                {/* Logo / Brand */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        margin: '0 auto 16px',
                        borderRadius: 'var(--r2)',
                        background: 'var(--mint1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="1.5" width="24" height="24">
                            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                        </svg>
                    </div>
                    <h1 style={{
                        fontSize: '20px', fontWeight: 600, color: 'var(--t1)',
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        Welcome to RelayOS
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--t2)', marginTop: '6px' }}>
                        {step === 'org'
                            ? 'Set up your organization to get started.'
                            : 'Create your first AI assistant.'}
                    </p>
                </div>

                {/* Steps indicator */}
                <div style={{
                    display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px',
                }}>
                    <div style={{
                        width: '64px', height: '3px', borderRadius: '2px',
                        background: 'var(--mint)',
                    }} />
                    <div style={{
                        width: '64px', height: '3px', borderRadius: '2px',
                        background: step === 'assistant' ? 'var(--mint)' : 'var(--border)',
                        transition: 'background 0.3s',
                    }} />
                </div>

                {/* Card */}
                <div style={{
                    background: 'var(--elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r3)',
                    padding: '28px 24px',
                }}>
                    {step === 'org' ? (
                        <>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: '6px' }}>
                                Organization Name
                            </label>
                            <input
                                className="finput"
                                placeholder="e.g. Acme Corp"
                                value={orgName}
                                onChange={(e) => handleOrgNameChange(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateOrg()}
                                autoFocus
                                style={{ marginBottom: '16px' }}
                            />

                            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: '6px' }}>
                                Slug
                            </label>
                            <input
                                className="finput"
                                placeholder="acme-corp"
                                value={orgSlug}
                                onChange={(e) => setOrgSlug(e.target.value)}
                                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', marginBottom: '20px' }}
                            />

                            {error && (
                                <div style={{ color: 'var(--red)', fontSize: '12px', marginBottom: '12px' }}>{error}</div>
                            )}

                            <button
                                className="btn btn-primary"
                                onClick={handleCreateOrg}
                                disabled={submitting || !orgName.trim()}
                                style={{ width: '100%' }}
                            >
                                {submitting ? 'Creating...' : 'Create Organization'}
                            </button>
                        </>
                    ) : (
                        <>
                            <div style={{
                                fontSize: '11px', color: 'var(--mint)', fontWeight: 500,
                                marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                                Organization created
                            </div>

                            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: '6px' }}>
                                Assistant Name
                            </label>
                            <input
                                className="finput"
                                placeholder="e.g. Support Bot"
                                value={assistantName}
                                onChange={(e) => handleAssistantNameChange(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateAssistant()}
                                autoFocus
                                style={{ marginBottom: '16px' }}
                            />

                            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: '6px' }}>
                                Slug
                            </label>
                            <input
                                className="finput"
                                placeholder="support-bot"
                                value={assistantSlug}
                                onChange={(e) => setAssistantSlug(e.target.value)}
                                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', marginBottom: '16px' }}
                            />

                            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: '8px' }}>
                                Type
                            </label>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                {(Object.keys(TYPE_INFO) as Array<keyof typeof TYPE_INFO>).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => setAssistantType(key)}
                                        style={{
                                            flex: 1,
                                            padding: '10px 8px',
                                            borderRadius: 'var(--r2)',
                                            border: `1px solid ${assistantType === key ? 'var(--mint)' : 'var(--border)'}`,
                                            background: assistantType === key ? 'var(--mint1)' : 'transparent',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: assistantType === key ? 'var(--mint)' : 'var(--t1)' }}>
                                            {TYPE_INFO[key].label}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--t2)', marginTop: '2px' }}>
                                            {TYPE_INFO[key].desc}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {error && (
                                <div style={{ color: 'var(--red)', fontSize: '12px', marginBottom: '12px' }}>{error}</div>
                            )}

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn-ghost"
                                    onClick={handleSkipAssistant}
                                    style={{ flex: 1 }}
                                >
                                    Skip for now
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreateAssistant}
                                    disabled={submitting || !assistantName.trim()}
                                    style={{ flex: 2 }}
                                >
                                    {submitting ? 'Creating...' : 'Create Assistant'}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <p style={{
                    textAlign: 'center', fontSize: '11px', color: 'var(--t3)',
                    marginTop: '16px',
                }}>
                    You can always add more assistants later from the Assistants page.
                </p>
            </div>
        </div>
    );
}
