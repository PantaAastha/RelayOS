'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, useSidebar } from '@/components/SidebarContext';

function ShellInner({ children }: { children: ReactNode }) {
    const { collapsed } = useSidebar();
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
        <SidebarProvider>
            <ShellInner>{children}</ShellInner>
        </SidebarProvider>
    );
}
