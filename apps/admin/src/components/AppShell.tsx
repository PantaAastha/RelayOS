'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, useSidebar } from '@/components/SidebarContext';
import { OrgProvider, useOrg } from '@/components/OrgContext';
import Onboarding from '@/components/Onboarding';

function ShellInner({ children }: { children: ReactNode }) {
    const { collapsed } = useSidebar();
    const { loading, needsOnboarding } = useOrg();

    if (loading) {
        return (
            <div style={{
                minHeight: '100dvh', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg)',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: 'var(--r2)',
                        background: 'var(--mint1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="1.5" width="20" height="20" style={{ animation: 'spin 2s linear infinite' }}>
                            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                        </svg>
                    </div>
                    <div style={{
                        width: '120px', height: '3px', borderRadius: '2px',
                        background: 'var(--border)', overflow: 'hidden',
                    }}>
                        <div style={{
                            width: '40%', height: '100%', borderRadius: '2px',
                            background: 'var(--mint)', opacity: 0.6,
                            animation: 'loadingSlide 1.4s ease-in-out infinite',
                        }} />
                    </div>
                </div>
                <style>{`
                    @keyframes loadingSlide {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(350%); }
                    }
                `}</style>
            </div>
        );
    }

    if (needsOnboarding) {
        return <Onboarding />;
    }

    return (
        <>
            <Sidebar />
            <main className={`main-content${collapsed ? ' sidebar-collapsed' : ''}`}>
                {children}
            </main>
        </>
    );
}

export function AppShell({ children }: { children: ReactNode }) {
    return (
        <OrgProvider>
            <SidebarProvider>
                <ShellInner>{children}</ShellInner>
            </SidebarProvider>
        </OrgProvider>
    );
}
