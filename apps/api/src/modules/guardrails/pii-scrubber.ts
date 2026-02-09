// PII Scrubber - Custom regex-based PII detection and redaction
// Zero external dependencies

export type PIIType = 'EMAIL' | 'PHONE' | 'SSN' | 'CREDIT_CARD' | 'IP_ADDRESS';

export interface PIIPattern {
    type: PIIType;
    pattern: RegExp;
    replacement: string;
}

// PII detection patterns with their replacements
const PII_PATTERNS: PIIPattern[] = [
    {
        type: 'EMAIL',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: '[EMAIL]',
    },
    {
        type: 'PHONE',
        // Matches common US phone formats: 555-123-4567, (555) 123-4567, 555.123.4567, +1 555 123 4567
        pattern: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
        replacement: '[PHONE]',
    },
    {
        type: 'SSN',
        // US Social Security Number: 123-45-6789
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        replacement: '[SSN]',
    },
    {
        type: 'CREDIT_CARD',
        // Credit card: 4111-1111-1111-1111 or 4111111111111111 or 4111 1111 1111 1111
        pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        replacement: '[CREDIT_CARD]',
    },
    {
        type: 'IP_ADDRESS',
        // IPv4 address: 192.168.1.1
        pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
        replacement: '[IP_ADDRESS]',
    },
];

export interface PIIScrubResult {
    hasPII: boolean;
    originalContent: string;
    sanitizedContent: string;
    detectedTypes: PIIType[];
    matchCount: number;
}

/**
 * PIIScrubber - Detects and redacts PII from text
 * 
 * Usage:
 *   const scrubber = new PIIScrubber();
 *   const result = scrubber.scrub("Contact john@example.com");
 *   // result.sanitizedContent = "Contact [EMAIL]"
 */
export class PIIScrubber {
    private patterns: PIIPattern[];

    constructor(customPatterns?: PIIPattern[]) {
        // Use custom patterns if provided, otherwise use defaults
        this.patterns = customPatterns || PII_PATTERNS;
    }

    /**
     * Scrub all PII from content
     */
    scrub(content: string): PIIScrubResult {
        let sanitizedContent = content;
        const detectedTypes: Set<PIIType> = new Set();
        let matchCount = 0;

        for (const { type, pattern, replacement } of this.patterns) {
            // Reset regex lastIndex for global patterns
            pattern.lastIndex = 0;

            // Count matches before replacing
            const matches = content.match(pattern);
            if (matches && matches.length > 0) {
                detectedTypes.add(type);
                matchCount += matches.length;

                // Clone the pattern to avoid mutation issues with global flag
                const freshPattern = new RegExp(pattern.source, pattern.flags);
                sanitizedContent = sanitizedContent.replace(freshPattern, replacement);
            }
        }

        return {
            hasPII: detectedTypes.size > 0,
            originalContent: content,
            sanitizedContent,
            detectedTypes: Array.from(detectedTypes),
            matchCount,
        };
    }

    /**
     * Check if content contains any PII without redacting
     */
    detect(content: string): { hasPII: boolean; types: PIIType[] } {
        const detectedTypes: Set<PIIType> = new Set();

        for (const { type, pattern } of this.patterns) {
            pattern.lastIndex = 0;
            if (pattern.test(content)) {
                detectedTypes.add(type);
            }
        }

        return {
            hasPII: detectedTypes.size > 0,
            types: Array.from(detectedTypes),
        };
    }

    /**
     * Add a custom PII pattern
     */
    addPattern(pattern: PIIPattern): void {
        this.patterns.push(pattern);
    }

    /**
     * Get all registered patterns
     */
    getPatterns(): PIIPattern[] {
        return [...this.patterns];
    }
}

// Export a singleton for convenience
export const piiScrubber = new PIIScrubber();
