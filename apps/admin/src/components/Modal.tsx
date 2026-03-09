import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, description, children, footer, maxWidth = '400px' }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleEscape);

        return () => {
            document.body.style.overflow = originalStyle;
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth, background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 className="modal-title" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{title}</h3>
                            {description && <p className="modal-description" style={{ fontSize: '13px', color: 'var(--t2)', marginTop: '4px', marginBottom: 0 }}>{description}</p>}
                        </div>
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--t2)', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}>
                            ×
                        </button>
                    </div>
                </div>

                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {children}
                </div>

                {footer && (
                    <div className="modal-actions" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
