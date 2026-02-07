// Query Processor Service - Pre-processes user queries for better RAG retrieval
// Features: Query rewriting, classification, caching, greeting detection

import { Injectable, Logger } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';

export type QueryType = 'factual' | 'procedural' | 'troubleshooting' | 'billing' | 'general';

export interface ProcessedQuery {
    originalQuery: string;
    rewrittenQuery: string;
    queryType: QueryType;
    confidence: number;
    expansions: string[];
    corrections: string[];
    skipped: boolean;
    cached: boolean;
}

// Simple in-memory cache with TTL
interface CacheEntry {
    result: ProcessedQuery;
    timestamp: number;
}

@Injectable()
export class QueryProcessorService {
    private readonly logger = new Logger(QueryProcessorService.name);
    private readonly cache = new Map<string, CacheEntry>();
    private readonly CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
    private readonly MAX_CACHE_SIZE = 1000;

    // Patterns that should skip processing (greetings, simple acknowledgments)
    private readonly SKIP_PATTERNS = [
        /^(hi|hello|hey|hiya|howdy|yo|sup)[\s!.,?]*$/i,
        /^(thanks|thank you|thx|ty)[\s!.,?]*$/i,
        /^(ok|okay|yes|no|sure|got it|understood)[\s!.,?]*$/i,
        /^(bye|goodbye|see you|later)[\s!.,?]*$/i,
        /^(good morning|good afternoon|good evening|good night)[\s!.,?]*$/i,
    ];

    constructor(private llmService: LLMService) { }

    /**
     * Process a user query for better RAG retrieval.
     * Includes rewriting, classification, with caching and skip logic.
     */
    async processQuery(query: string): Promise<ProcessedQuery> {
        const normalizedQuery = query.trim();

        // Check if this is a greeting/simple message that should skip processing
        if (this.shouldSkipProcessing(normalizedQuery)) {
            this.logger.debug(`Skipping query processing for: "${normalizedQuery}"`);
            return {
                originalQuery: query,
                rewrittenQuery: query,
                queryType: 'general',
                confidence: 1.0,
                expansions: [],
                corrections: [],
                skipped: true,
                cached: false,
            };
        }

        // Check cache
        const cacheKey = this.getCacheKey(normalizedQuery);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.logger.debug(`Cache hit for query: "${normalizedQuery}"`);
            return { ...cached, cached: true };
        }

        // Process with LLM
        const result = await this.processWithLLM(query);

        // Store in cache
        this.addToCache(cacheKey, result);

        return result;
    }

    /**
     * Check if the query should skip processing (greetings, etc.)
     */
    private shouldSkipProcessing(query: string): boolean {
        // Very short queries (< 3 words) that match patterns
        const wordCount = query.split(/\s+/).length;
        if (wordCount <= 3) {
            return this.SKIP_PATTERNS.some(pattern => pattern.test(query));
        }
        return false;
    }

    /**
     * Process query using LLM for rewriting and classification.
     * Uses simple plain-text output for reliability (JSON was truncating).
     */
    private async processWithLLM(query: string): Promise<ProcessedQuery> {
        // Simple prompt that asks for just the rewritten query
        const prompt = `Rewrite this search query to improve search results. Expand abbreviations, fix typos, add synonyms.

Examples:
- "Diff betwn B2B and B2C?" → "Difference between B2B Business-to-Business and B2C Business-to-Consumer"
- "API auth not wrking" → "API authentication authorization not working error"
- "Wha isRecime app?" → "What is ReciMe recipe app application"
- "Sho I entre vedic market?" → "Should I enter Vedic astrology market"

Query: "${query}"
Rewritten:`;

        try {
            const response = await this.llmService.complete([
                { role: 'user', content: prompt }
            ], {
                temperature: 0.3,
                maxTokens: 150, // Only need enough for the rewritten query
            });

            // Extract just the first line of the response (the rewritten query)
            const rewrittenQuery = response.content
                .split('\n')[0]  // Take first line only
                .replace(/^["'\s]+|["'\s]+$/g, '')  // Trim quotes and whitespace
                .trim();

            this.logger.log(`[QUERY REWRITE] "${query}" → "${rewrittenQuery}"`);

            // Detect query type based on keywords (simple heuristic)
            const queryType = this.detectQueryType(rewrittenQuery);

            return {
                originalQuery: query,
                rewrittenQuery: rewrittenQuery || query,  // Fallback to original if empty
                queryType,
                confidence: 0.8,
                expansions: [],  // Not tracking these for now (simpler)
                corrections: [],
                skipped: false,
                cached: false,
            };
        } catch (error) {
            this.logger.error(`[QUERY REWRITE] Failed: ${error}`);
            return {
                originalQuery: query,
                rewrittenQuery: query,
                queryType: 'general',
                confidence: 0.5,
                expansions: [],
                corrections: [],
                skipped: false,
                cached: false,
            };
        }
    }

    /**
     * Simple heuristic to detect query type based on keywords.
     */
    private detectQueryType(query: string): QueryType {
        const lowerQuery = query.toLowerCase();

        if (/^(what|who|where|when|which|define|explain)\b/.test(lowerQuery)) {
            return 'factual';
        }
        if (/^(how|steps|guide|tutorial)\b/.test(lowerQuery) || /how (do|can|to)\b/.test(lowerQuery)) {
            return 'procedural';
        }
        if (/(not working|error|issue|problem|fail|broken|bug|fix)/.test(lowerQuery)) {
            return 'troubleshooting';
        }
        if (/(price|pricing|cost|pay|billing|subscription|plan|upgrade)/.test(lowerQuery)) {
            return 'billing';
        }
        return 'general';
    }

    /**
     * Get preferred document types for a query type.
     * Used to boost relevance of matching doc types during search.
     */
    static getPreferredDocTypes(queryType: QueryType): string[] {
        const mapping: Record<QueryType, string[]> = {
            factual: ['faq', 'article'],
            procedural: ['article', 'guide'],
            troubleshooting: ['faq', 'article'],
            billing: ['policy', 'faq'],
            general: [],
        };
        return mapping[queryType] || [];
    }

    // ==================== Cache Methods ====================

    private getCacheKey(query: string): string {
        // Simple normalization for cache key
        return query.toLowerCase().trim().replace(/\s+/g, ' ');
    }

    private getFromCache(key: string): ProcessedQuery | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check TTL
        if (Date.now() - entry.timestamp > this.CACHE_TTL_MS) {
            this.cache.delete(key);
            return null;
        }

        return entry.result;
    }

    private addToCache(key: string, result: ProcessedQuery): void {
        // Enforce max cache size (LRU-ish: just delete oldest on overflow)
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            result,
            timestamp: Date.now(),
        });
    }

    /**
     * Clear the cache (useful for testing or admin operations).
     */
    clearCache(): void {
        this.cache.clear();
        this.logger.log('Query processor cache cleared');
    }

    /**
     * Get cache stats for observability.
     */
    getCacheStats(): { size: number; maxSize: number; ttlMs: number } {
        return {
            size: this.cache.size,
            maxSize: this.MAX_CACHE_SIZE,
            ttlMs: this.CACHE_TTL_MS,
        };
    }
}
