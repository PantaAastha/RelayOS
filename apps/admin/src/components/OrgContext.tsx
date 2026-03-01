'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Assistant {
    id: string;
    name: string;
    slug: string;
    organization_id: string;
    config: Record<string, any>;
    assistant_type: string;
    created_at: string;
}

interface Organization {
    id: string;
    name: string;
    slug: string;
}

interface OrgContextType {
    /** All assistants in the org */
    assistants: Assistant[];
    /** The organization ID */
    orgId: string | null;
    /** The organization object */
    org: Organization | null;
    /** Whether the initial load is still in progress */
    loading: boolean;
    /** True when no org exists yet (first-run state) */
    needsOnboarding: boolean;
    /** Refetch everything after onboarding or assistant creation */
    refresh: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType>({
    assistants: [],
    orgId: null,
    org: null,
    loading: true,
    needsOnboarding: false,
    refresh: async () => { },
});

export function OrgProvider({ children }: { children: ReactNode }) {
    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        try {
            // 1. Check if any org exists
            const orgRes = await fetch(`${API_URL}/organizations`);
            if (orgRes.ok) {
                const orgs = await orgRes.json();
                if (Array.isArray(orgs) && orgs.length > 0) {
                    setOrg(orgs[0]);
                    setNeedsOnboarding(false);

                    // 2. Fetch assistants
                    const aRes = await fetch(`${API_URL}/assistants`);
                    if (aRes.ok) {
                        const data = await aRes.json();
                        setAssistants(Array.isArray(data) ? data : []);
                    }
                } else {
                    // No org → first-run onboarding needed
                    setOrg(null);
                    setAssistants([]);
                    setNeedsOnboarding(true);
                }
            }
        } catch {
            /* silent */
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    return (
        <OrgContext.Provider value={{
            assistants,
            orgId: org?.id || null,
            org,
            loading,
            needsOnboarding,
            refresh: fetchAll,
        }}>
            {children}
        </OrgContext.Provider>
    );
}

export function useOrg() {
    return useContext(OrgContext);
}
