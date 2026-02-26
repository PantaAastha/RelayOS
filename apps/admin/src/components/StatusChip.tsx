'use client';

import { useState, useEffect } from 'react';

export type ChipStatus =
    | 'draft'
    | 'live'
    | 'needs-attention'
    | 'queued'
    | 'running'
    | 'succeeded'
    | 'failed';

const statusConfig: Record<ChipStatus, { label: string; variant: string }> = {
    draft: { label: 'Draft', variant: 'neutral' },
    live: { label: 'Live', variant: 'success' },
    'needs-attention': { label: 'Needs Attention', variant: 'warning' },
    queued: { label: 'Queued', variant: 'neutral' },
    running: { label: 'Running', variant: 'info' },
    succeeded: { label: 'Succeeded', variant: 'success' },
    failed: { label: 'Failed', variant: 'error' },
};

interface StatusChipProps {
    status: ChipStatus;
    /** Override default label text */
    label?: string;
    /** Show a pulsing dot for active states (live, running) */
    pulse?: boolean;
}

export default function StatusChip({ status, label, pulse }: StatusChipProps) {
    const config = statusConfig[status];
    const [animate, setAnimate] = useState(false);
    const showPulse = pulse ?? (status === 'live' || status === 'running');

    // Trigger enter animation on mount and status change
    useEffect(() => {
        setAnimate(true);
        const timeout = setTimeout(() => setAnimate(false), 300);
        return () => clearTimeout(timeout);
    }, [status]);

    return (
        <span
            className={`status-chip status-chip--${config.variant} ${animate ? 'status-chip--animate' : ''}`}
        >
            {showPulse && <span className="status-chip__dot" />}
            {label ?? config.label}
        </span>
    );
}
