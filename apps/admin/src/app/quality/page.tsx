import Link from 'next/link';

export default function QualityPage() {
    return (
        <div className="content-area">
            <div className="page-header">
                <h1 className="page-title">Quality</h1>
                <p className="page-description">Monitor AI quality, view conversation traces, and identify knowledge gaps.</p>
            </div>

            <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <h3>Quality Cockpit</h3>
                <p>Track answer quality, view traces, and find knowledge gaps across your assistants.</p>
                <Link
                    href="/conversations"
                    className="btn btn-primary"
                    style={{ marginTop: '16px', display: 'inline-flex' }}
                >
                    View Conversations
                </Link>
            </div>
        </div>
    );
}
