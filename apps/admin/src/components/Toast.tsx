'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    title: string;
    message?: string;
    variant: ToastVariant;
    duration?: number;
}

interface ToastContextValue {
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
    return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const counterRef = useRef(0);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (toast: Omit<Toast, 'id'>) => {
            const id = `toast-${++counterRef.current}`;
            const duration = toast.duration ?? 3000;
            setToasts((prev) => [...prev, { ...toast, id }]);
            setTimeout(() => removeToast(id), duration);
        },
        [removeToast],
    );

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="toast-container" role="status" aria-live="polite">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const exitTimer = setTimeout(() => setExiting(true), (toast.duration ?? 3000) - 300);
        return () => clearTimeout(exitTimer);
    }, [toast.duration]);

    return (
        <div
            className={`toast toast-${toast.variant} ${exiting ? 'toast--exit' : ''}`}
            onClick={() => onDismiss(toast.id)}
        >
            <div className="toast-title">{toast.title}</div>
            {toast.message && <div className="toast-message">{toast.message}</div>}
        </div>
    );
}
