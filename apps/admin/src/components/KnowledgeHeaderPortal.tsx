import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface HeaderPortalProps {
    children: React.ReactNode;
}

/**
 * Portals its children into the `#knowledge-topbar-actions` element.
 * Ensure the layout rendering this component has that element defined.
 */
export default function KnowledgeHeaderPortal({ children }: HeaderPortalProps) {
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const el = document.getElementById('knowledge-topbar-actions');
        setTargetElement(el);
    }, []);

    if (!targetElement) return null;

    return createPortal(children, targetElement);
}
