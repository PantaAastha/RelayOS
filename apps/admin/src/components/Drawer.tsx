'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
    footer?: React.ReactNode;
}

export default function Drawer({ isOpen, onClose, title, children, width = '420px', footer }: DrawerProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const drawerContent = (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
        }}>
            {/* Backdrop */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(2px)',
                    animation: 'fadeIn 0.2s ease-out'
                }}
                onClick={onClose}
            />

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>

            {/* Drawer Panel */}
            <div style={{
                position: 'relative',
                width,
                background: 'var(--elevated)',
                borderLeft: '1px solid var(--border)',
                boxShadow: '-12px 0 32px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                height: '100%'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0
                }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{title}</h2>
                    <button onClick={onClose} className="more-btn" style={{ fontSize: '16px' }}>✕</button>
                </div>

                {/* Body */}
                <div style={{
                    padding: '24px 20px',
                    overflowY: 'auto',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div style={{
                        padding: '16px 20px',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        gap: '10px',
                        flexShrink: 0,
                        background: 'var(--surface)'
                    }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    // Use portal to render at document body level to avoid overflow clipping issues
    if (typeof window !== 'undefined') {
        return createPortal(drawerContent, document.body);
    }
    return null;
}
