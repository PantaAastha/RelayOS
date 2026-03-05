export default function IntegrationsPage() {
    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Integrations</h1>
                    <p className="page-description">Connect external tools and workflows to your assistants.</p>
                </div>
            </div>

            <div className="page-body">
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <h3>No integrations configured</h3>
                    <p>Connect n8n workflows, webhooks, and external tools to extend your assistants.</p>
                    <button
                        className="btn btn-secondary"
                        disabled
                        style={{ marginTop: '16px' }}
                    >
                        Coming Soon
                    </button>
                </div>
            </div>
        </>
    );
}
