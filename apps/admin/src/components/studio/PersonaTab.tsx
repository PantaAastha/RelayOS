'use client';

interface PersonaData {
    name: string;
    tone: string;
    voice: string;
    boundaries: string;
    customInstructions: string;
}

interface StarterQuestion { label: string; message: string; }

interface PersonaTabProps {
    persona: PersonaData;
    welcomeMessage: string;
    starterQuestions: StarterQuestion[];
    onPersonaChange: (persona: PersonaData) => void;
    onWelcomeMessageChange: (msg: string) => void;
    onStarterQuestionsChange: (questions: StarterQuestion[]) => void;
}

export default function PersonaTab({
    persona, welcomeMessage, starterQuestions,
    onPersonaChange, onWelcomeMessageChange, onStarterQuestionsChange,
}: PersonaTabProps) {
    const update = (field: keyof PersonaData, value: string) => {
        onPersonaChange({ ...persona, [field]: value });
    };

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
                <div className="studio-section-title">Identity</div>
                <div className="frow">
                    <div className="field">
                        <label className="flabel">Persona Name</label>
                        <input className="finput" placeholder="e.g. Luna, Support Bot"
                            value={persona.name} onChange={(e) => update('name', e.target.value)} />
                    </div>
                    <div className="field">
                        <label className="flabel">Tone</label>
                        <input className="finput" placeholder="e.g. friendly, professional, casual"
                            value={persona.tone} onChange={(e) => update('tone', e.target.value)} />
                    </div>
                </div>
                <div className="field">
                    <label className="flabel">Voice / Style</label>
                    <input className="finput" placeholder="How this assistant communicates..."
                        value={persona.voice} onChange={(e) => update('voice', e.target.value)} />
                </div>
            </div>

            <div className="studio-section">
                <div className="studio-section-title">Guardrails</div>
                <div className="field">
                    <label className="flabel">Boundaries</label>
                    <textarea className="fta" placeholder="Topics to avoid or redirect..."
                        value={persona.boundaries} onChange={(e) => update('boundaries', e.target.value)} />
                </div>
                <div className="field">
                    <label className="flabel">Custom Instructions</label>
                    <textarea className="fta" placeholder="Additional AI instructions..."
                        value={persona.customInstructions} onChange={(e) => update('customInstructions', e.target.value)} />
                </div>
            </div>

            <div className="studio-section">
                <div className="studio-section-title">Widget</div>
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
                                <input value={q.label} onChange={(e) => updateQuestion(i, 'label', e.target.value)} placeholder="Starter question..." />
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
        </>
    );
}
