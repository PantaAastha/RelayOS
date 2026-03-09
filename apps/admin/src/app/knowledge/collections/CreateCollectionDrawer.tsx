'use client';

import { useState } from 'react';
import Drawer from '@/components/Drawer';

interface CreateCollectionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string | null;
    onSuccess: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CreateCollectionDrawer({ isOpen, onClose, orgId, onSuccess }: CreateCollectionDrawerProps) {
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    if (!isOpen) return null;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !orgId) return;

        setIsCreating(true);
        try {
            const res = await fetch(`${API_URL}/collections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Organization-ID': orgId,
                },
                body: JSON.stringify({ name: newName, description: newDesc }),
            });
            if (res.ok) {
                setNewName('');
                setNewDesc('');
                onSuccess();
            }
        } catch (error) {
            console.error('Failed to create collection:', error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Create Collection"
            footer={
                <>
                    <button onClick={handleCreate} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isCreating}>
                        {isCreating ? 'Creating...' : 'Create Collection'}
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                </>
            }
        >
            <form id="create-collection-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="field">
                    <label className="flabel">Collection Name</label>
                    <input autoFocus className="finput" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Getting Started Guide" required />
                </div>
                <div className="field" style={{ marginBottom: '24px' }}>
                    <label className="flabel">Description (optional)</label>
                    <input className="finput" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="" />
                </div>
            </form>
        </Drawer>
    );
}
