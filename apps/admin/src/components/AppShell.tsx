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
                minHeight: '100vh', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg)', color: 'var(--t2)', fontSize: '13px',
            }}>
                Loading...
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
