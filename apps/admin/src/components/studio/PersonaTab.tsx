'use client';

interface PersonaData {
    name: string;
    tone: string;
    voice: string;
    boundaries: string;
    customInstructions: string;
}

interface PersonaTabProps {
    persona: PersonaData;
    onPersonaChange: (persona: PersonaData) => void;
}

export default function PersonaTab({
    persona,
    onPersonaChange,
}: PersonaTabProps) {
    const update = (field: keyof PersonaData, value: string) => {
        onPersonaChange({ ...persona, [field]: value });
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
        </>
    );
}
