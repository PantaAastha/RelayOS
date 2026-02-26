interface SkeletonProps {
    /** Width — CSS value like '100%', '200px', '80%' */
    width?: string;
    /** Height — CSS value like '20px', '40px' */
    height?: string;
    /** Border radius — CSS value */
    borderRadius?: string;
    /** Render as a full card skeleton (padded container) */
    variant?: 'text' | 'card' | 'circle';
    /** Number of skeleton lines to render (for text variant) */
    lines?: number;
}

export default function Skeleton({
    width = '100%',
    height = '20px',
    borderRadius,
    variant = 'text',
    lines = 1,
}: SkeletonProps) {
    if (variant === 'card') {
        return (
            <div className="skeleton-card">
                <div className="skeleton-line" style={{ width: '40%', height: '14px', marginBottom: '16px' }} />
                <div className="skeleton-line" style={{ width: '100%', height: '32px', marginBottom: '12px' }} />
                <div className="skeleton-line" style={{ width: '60%', height: '14px' }} />
            </div>
        );
    }

    if (variant === 'circle') {
        return (
            <div
                className="skeleton-line"
                style={{
                    width: width === '100%' ? '40px' : width,
                    height: width === '100%' ? '40px' : width,
                    borderRadius: '50%',
                }}
            />
        );
    }

    // text variant
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width }}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton-line"
                    style={{
                        width: i === lines - 1 && lines > 1 ? '70%' : '100%',
                        height,
                        borderRadius: borderRadius ?? '4px',
                    }}
                />
            ))}
        </div>
    );
}

/**
 * Pre-built skeleton layouts for common patterns.
 */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        {Array.from({ length: cols }).map((_, i) => (
                            <th key={i}>
                                <div className="skeleton-line" style={{ width: '80px', height: '12px' }} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, r) => (
                        <tr key={r}>
                            {Array.from({ length: cols }).map((_, c) => (
                                <td key={c}>
                                    <div
                                        className="skeleton-line"
                                        style={{ width: c === 0 ? '140px' : '60px', height: '14px' }}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function SkeletonStats({ count = 3 }: { count?: number }) {
    return (
        <div className="stats-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="stat-card">
                    <div className="skeleton-line" style={{ width: '80px', height: '12px', marginBottom: '12px' }} />
                    <div className="skeleton-line" style={{ width: '60px', height: '32px' }} />
                </div>
            ))}
        </div>
    );
}
