// Knowledge Service - RAG Pipeline
// Handles document ingestion, embedding, and semantic search

import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { LLMService } from '../llm/llm.service';
import { EventsService } from '../events/events.service';
import { ChunkerService } from './chunker.service';
import { QueryProcessorService, ProcessedQuery, QueryType } from './query-processor.service';

export interface Document {
    id: string;
    tenantId: string;
    title: string;
    content: string;
    sourceUrl?: string;
    docType: string;
    version: number;
    status: string;
    createdAt?: string;
}

export interface DocumentChunk {
    id: string;
    documentId: string;
    chunkIndex: number;
    content: string;
    metadata: Record<string, unknown>;
}

export interface SearchResult {
    chunkId: string;
    documentId: string;
    content: string;
    similarity: number;
    metadata: Record<string, unknown>;
}

@Injectable()
export class KnowledgeService {
    private supabase: SupabaseClient;
    private readonly logger = new Logger(KnowledgeService.name);

    constructor(
        private configService: ConfigService,
        private llmService: LLMService,
        private eventsService: EventsService,
        private chunkerService: ChunkerService,
        private queryProcessor: QueryProcessorService,
    ) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
        }

        this.supabase = createClient(supabaseUrl, serviceRoleKey);
    }

    /**
     * Ingest a document: chunk it and create embeddings.
     */
    async ingestDocument(
        tenantId: string,
        title: string,
        content: string,
        options?: {
            sourceUrl?: string;
            docType?: string;
        },
    ): Promise<Document> {
        // 1. Insert the document
        const { data: doc, error: docError } = await this.supabase
            .from('documents')
            .insert({
                assistant_id: tenantId, // Using tenantId arg as assistantId
                title,
                content,
                source_url: options?.sourceUrl,
                doc_type: options?.docType ?? 'faq',
            })
            .select()
            .single();

        if (docError) {
            throw new Error(`Failed to insert document: ${docError.message}`);
        }

        // 2. Chunk the content using semantic chunker
        const chunks = this.chunkerService.chunkDocument(content, title);

        this.logger.log(`Chunked document "${title}" into ${chunks.length} chunks (token-based, with overlap)`);

        // 3. Generate embeddings for all chunks (use wrapped content with context)
        const embeddings = await this.llmService.embedBatch(chunks.map(c => c.content));

        // 4. Insert chunks with embeddings
        const chunkInserts = chunks.map((chunk, index) => ({
            document_id: doc.id,
            chunk_index: chunk.index,
            content: chunk.content, // Contains context wrapper
            embedding: embeddings[index].embedding,
            metadata: {
                documentTitle: title,
                docType: options?.docType ?? 'faq',
                section: chunk.section,
                tokenCount: chunk.tokenCount,
                chunkIndex: chunk.index,
                totalChunks: chunks.length,
            },
        }));

        const { error: chunkError } = await this.supabase
            .from('document_chunks')
            .insert(chunkInserts);

        if (chunkError) {
            throw new Error(`Failed to insert chunks: ${chunkError.message}`);
        }

        return {
            id: doc.id,
            tenantId: doc.tenant_id,
            title: doc.title,
            content: doc.content,
            sourceUrl: doc.source_url,
            docType: doc.doc_type,
            version: doc.version,
            status: doc.status,
        };
    }

    /**
     * Semantic search for relevant chunks.
     * This is the core of RAG - finding relevant context for a question.
     */
    async search(
        tenantId: string,
        query: string,
        limit = 5,
        conversationId?: string,
        correlationId?: string,
        options?: { skipQueryProcessing?: boolean; useHybridSearch?: boolean },
    ): Promise<SearchResult[]> {
        // If hybrid search is enabled, delegate to hybridSearch method
        if (options?.useHybridSearch) {
            return this.hybridSearch(
                tenantId,
                query,
                limit,
                conversationId,
                correlationId,
                { skipQueryProcessing: options?.skipQueryProcessing },
            );
        }

        const searchStart = Date.now();

        // 1. Process query for better retrieval (rewriting + classification)
        let processed: ProcessedQuery;
        if (options?.skipQueryProcessing) {
            processed = {
                originalQuery: query,
                rewrittenQuery: query,
                queryType: 'general',
                confidence: 1.0,
                expansions: [],
                corrections: [],
                skipped: true,
                cached: false,
            };
        } else {
            processed = await this.queryProcessor.processQuery(query);
        }

        this.logger.debug(
            `Query processed: "${query.substring(0, 30)}..." → "${processed.rewrittenQuery.substring(0, 30)}..." (type=${processed.queryType}, cached=${processed.cached})`
        );

        // 2. Generate embedding for the processed query
        const { embedding } = await this.llmService.embed(processed.rewrittenQuery);

        // 3. Vector similarity search using pgvector
        // The <=> operator is cosine distance
        // 3. Vector similarity search using pgvector
        // The <=> operator is cosine distance
        const { data, error } = await this.supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_assistant_id: tenantId, // Pass as assistant_id
            match_tenant_id: tenantId,    // Pass as tenant_id (fallback)
            match_count: limit,
            match_threshold: 0.2, // Lowered threshold for better recall
        });

        const latencyMs = Date.now() - searchStart;

        if (error) {
            // Log failure with full context for debugging
            await this.eventsService.log(
                tenantId,
                'rag.searched',
                {
                    query,
                    rewrittenQuery: processed.rewrittenQuery,
                    queryType: processed.queryType,
                    queryProcessing: {
                        skipped: processed.skipped,
                        cached: processed.cached,
                        expansions: processed.expansions,
                        corrections: processed.corrections,
                    },
                    error: error.message,
                    chunksRetrieved: 0,
                    latencyMs,
                },
                conversationId,
                correlationId,
            );
            console.error('Search failed:', error);
            return [];
        }

        // 4. Build rich chunk details for debugging
        const chunks = (data ?? []).map((row: any) => ({
            section: row.metadata?.section || 'General',
            similarity: Math.round(row.similarity * 100) / 100,
            preview: row.content?.substring(0, 80) + '...',
            tokenCount: row.metadata?.tokenCount,
        }));

        // 5. Log the search with full RAG observability including query processing info
        await this.eventsService.log(
            tenantId,
            'rag.searched',
            {
                query,
                rewrittenQuery: processed.rewrittenQuery,
                queryType: processed.queryType,
                queryProcessing: {
                    skipped: processed.skipped,
                    cached: processed.cached,
                    expansions: processed.expansions,
                    corrections: processed.corrections,
                },
                chunksRetrieved: data?.length ?? 0,
                topScore: data?.[0]?.similarity ?? 0,
                chunks, // Full chunk details for debugging
                latencyMs,
            },
            conversationId,
            correlationId,
        );

        // 6. Apply doc type boost based on query classification
        const results = (data ?? []).map((row: any) => ({
            chunkId: row.id,
            documentId: row.document_id,
            content: row.content,
            similarity: row.similarity,
            metadata: row.metadata,
        }));

        return this.applyDocTypeBoost(results, processed.queryType);
    }

    /**
     * Boost similarity scores for chunks whose doc type matches the query type.
     * Re-sorts results by boosted similarity.
     */
    private applyDocTypeBoost(
        results: SearchResult[],
        queryType: QueryType,
    ): SearchResult[] {
        const preferred = QueryProcessorService.getPreferredDocTypes(queryType);
        if (preferred.length === 0) return results;

        const BOOST_FACTOR = 0.05; // 5% boost for matching doc types

        const boosted = results.map(r => ({
            ...r,
            similarity: preferred.includes(r.metadata?.docType as string)
                ? r.similarity + BOOST_FACTOR
                : r.similarity,
        }));

        // Re-sort by boosted similarity (descending)
        return boosted.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Hybrid search: combines semantic (vector) and keyword (full-text) search.
     * Uses Reciprocal Rank Fusion (RRF) to merge results.
     * Requires migration 0003_hybrid_search.sql to be applied.
     */
    async hybridSearch(
        tenantId: string,
        query: string,
        limit = 5,
        conversationId?: string,
        correlationId?: string,
        options?: { skipQueryProcessing?: boolean },
    ): Promise<SearchResult[]> {
        const searchStart = Date.now();

        // 1. Process query for better retrieval
        let processed: ProcessedQuery;
        if (options?.skipQueryProcessing) {
            processed = {
                originalQuery: query,
                rewrittenQuery: query,
                queryType: 'general',
                confidence: 1.0,
                expansions: [],
                corrections: [],
                skipped: true,
                cached: false,
            };
        } else {
            processed = await this.queryProcessor.processQuery(query);
        }

        this.logger.debug(
            `Hybrid search: "${query.substring(0, 30)}..." → "${processed.rewrittenQuery.substring(0, 30)}..." (type=${processed.queryType})`
        );

        // 2. Generate embedding for semantic search component
        const { embedding } = await this.llmService.embed(processed.rewrittenQuery);

        // 3. Call hybrid_search RPC (combines vector + full-text with RRF)
        // Fetch 2x chunks for re-ranking, then return top `limit` after re-ranking
        const fetchCount = Math.min(limit * 2, 10);
        const { data, error } = await this.supabase.rpc('hybrid_search', {
            query_text: processed.rewrittenQuery,
            query_embedding: embedding,
            match_assistant_id: tenantId, // Pass as assistant_id
            match_tenant_id: tenantId,    // Pass as tenant_id (fallback)
            match_count: fetchCount,
            rrf_k: 60, // RRF constant
        });

        const latencyMs = Date.now() - searchStart;

        if (error) {
            this.logger.error(`Hybrid search failed: ${error.message}`);
            await this.eventsService.log(
                tenantId,
                'rag.hybrid_searched',
                {
                    query,
                    rewrittenQuery: processed.rewrittenQuery,
                    queryType: processed.queryType,
                    error: error.message,
                    chunksRetrieved: 0,
                    latencyMs,
                },
                conversationId,
                correlationId,
            );
            return [];
        }

        // 4. Build rich chunk details for debugging
        const chunks = (data ?? []).map((row: any) => ({
            section: row.metadata?.section || 'General',
            semanticSimilarity: Math.round(row.semantic_similarity * 100) / 100,
            keywordRank: row.keyword_rank,
            rrfScore: Math.round(row.rrf_score * 1000) / 1000,
            preview: row.content?.substring(0, 80) + '...',
        }));

        // 5. Log the hybrid search with full observability
        await this.eventsService.log(
            tenantId,
            'rag.hybrid_searched',
            {
                query,
                rewrittenQuery: processed.rewrittenQuery,
                queryType: processed.queryType,
                queryProcessing: {
                    skipped: processed.skipped,
                    cached: processed.cached,
                },
                chunksRetrieved: data?.length ?? 0,
                topRrfScore: data?.[0]?.rrf_score ?? 0,
                chunks,
                latencyMs,
            },
            conversationId,
            correlationId,
        );

        // 6. Apply doc type boost
        const results = (data ?? []).map((row: any) => ({
            chunkId: row.id,
            documentId: row.document_id,
            content: row.content,
            similarity: row.rrf_score, // Use RRF score as the unified similarity
            metadata: {
                ...row.metadata,
                semanticSimilarity: row.semantic_similarity,
                keywordRank: row.keyword_rank,
                rrfScore: row.rrf_score,
                docCreatedAt: row.doc_created_at,
                docUpdatedAt: row.doc_updated_at,
            },
        }));

        // 6a. Apply recency boost (documents updated in last 30 days get a small boost)
        const recencyBoosted = results.map((r: SearchResult) => {
            const updatedAt = r.metadata?.docUpdatedAt;
            if (updatedAt) {
                const ageInDays = (Date.now() - new Date(updatedAt as string).getTime()) / (1000 * 60 * 60 * 24);
                const recencyBoost = ageInDays <= 30 ? 0.02 : 0; // 2% boost for recent docs
                return {
                    ...r,
                    similarity: r.similarity + recencyBoost,
                    metadata: { ...r.metadata, ageInDays: Math.round(ageInDays), recencyBoost },
                };
            }
            return r;
        });

        const boosted = this.applyDocTypeBoost(recencyBoosted, processed.queryType);

        // 7. Re-rank using LLM (if we have enough chunks)
        if (boosted.length >= 3) {
            return this.rerankChunks(processed.rewrittenQuery, boosted, limit);
        }

        return boosted;
    }

    /**
     * Re-rank chunks using LLM based on actual relevance to the query.
     * Takes more chunks than needed, re-orders by relevance, returns top N.
     */
    private async rerankChunks(
        query: string,
        chunks: SearchResult[],
        topN: number,
    ): Promise<SearchResult[]> {
        if (chunks.length === 0) return chunks;

        // Build a numbered list of chunk previews for the LLM
        const chunkPreviews = chunks
            .map((c, i) => `${i + 1}. ${c.content.substring(0, 150).replace(/\n/g, ' ')}...`)
            .join('\n');

        const prompt = `Given this search query: "${query}"

Rank these text chunks from MOST to LEAST relevant. Return ONLY the numbers in order, comma-separated.

Chunks:
${chunkPreviews}

Most to least relevant (numbers only):`;

        try {
            const response = await this.llmService.complete(
                [{ role: 'user', content: prompt }],
                { temperature: 0.1, maxTokens: 50 }
            );

            // Parse the ranking from LLM response (e.g., "3, 1, 5, 2, 4")
            const ranking = response.content
                .split(/[,\s]+/)
                .map(s => parseInt(s.trim(), 10))
                .filter(n => !isNaN(n) && n >= 1 && n <= chunks.length);

            if (ranking.length === 0) {
                this.logger.warn('[RERANK] Failed to parse LLM ranking, using original order');
                return chunks.slice(0, topN);
            }

            // Reorder chunks based on LLM ranking
            const reranked: SearchResult[] = [];
            const seen = new Set<number>();

            for (const idx of ranking) {
                if (!seen.has(idx) && chunks[idx - 1]) {
                    reranked.push({
                        ...chunks[idx - 1],
                        metadata: {
                            ...chunks[idx - 1].metadata,
                            rerankPosition: reranked.length + 1,
                            originalPosition: idx,
                        },
                    });
                    seen.add(idx);
                }
                if (reranked.length >= topN) break;
            }

            // If LLM didn't rank all chunks, append remaining in original order
            if (reranked.length < topN) {
                for (let i = 0; i < chunks.length && reranked.length < topN; i++) {
                    if (!seen.has(i + 1)) {
                        reranked.push(chunks[i]);
                    }
                }
            }

            this.logger.log(`[RERANK] Re-ordered ${chunks.length} chunks → top ${reranked.length}`);
            return reranked;
        } catch (error) {
            this.logger.error(`[RERANK] Failed: ${error}`);
            return chunks.slice(0, topN);
        }
    }

    /**
     * Re-ingest an existing document with current chunker settings.
     * Useful after updating chunking parameters.
     */
    async reingestDocument(documentId: string): Promise<Document> {
        // 1. Fetch the existing document
        const { data: doc, error: docError } = await this.supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (docError || !doc) {
            throw new Error(`Document not found: ${docError?.message || 'Unknown error'}`);
        }

        // 2. Delete existing chunks
        const { error: deleteError } = await this.supabase
            .from('document_chunks')
            .delete()
            .eq('document_id', documentId);

        if (deleteError) {
            throw new Error(`Failed to delete old chunks: ${deleteError.message}`);
        }

        this.logger.log(`Deleted old chunks for document "${doc.title}", re-chunking...`);

        // 3. Re-chunk with current settings
        const chunks = this.chunkerService.chunkDocument(doc.content, doc.title);

        this.logger.log(`Re-chunked document "${doc.title}" into ${chunks.length} chunks`);

        // 4. Generate new embeddings
        const embeddings = await this.llmService.embedBatch(chunks.map(c => c.content));

        // 5. Insert new chunks
        const chunkInserts = chunks.map((chunk, index) => ({
            document_id: doc.id,
            chunk_index: chunk.index,
            content: chunk.content,
            embedding: embeddings[index].embedding,
            metadata: {
                documentTitle: doc.title,
                docType: doc.doc_type ?? 'faq',
                section: chunk.section,
                tokenCount: chunk.tokenCount,
                chunkIndex: chunk.index,
                totalChunks: chunks.length,
            },
        }));

        const { error: chunkError } = await this.supabase
            .from('document_chunks')
            .insert(chunkInserts);

        if (chunkError) {
            throw new Error(`Failed to insert new chunks: ${chunkError.message}`);
        }

        // 6. Increment version
        const { error: versionError } = await this.supabase
            .from('documents')
            .update({ version: doc.version + 1 })
            .eq('id', documentId);

        if (versionError) {
            this.logger.warn(`Failed to update version: ${versionError.message}`);
        }

        return {
            id: doc.id,
            tenantId: doc.tenant_id,
            title: doc.title,
            content: doc.content,
            sourceUrl: doc.source_url,
            docType: doc.doc_type,
            version: doc.version + 1,
            status: doc.status,
        };
    }

    /**
     * Re-ingest all documents for a tenant with current chunker settings.
     * Useful for batch updates after changing chunking parameters.
     */
    async reingestAllDocuments(tenantId: string): Promise<{
        total: number;
        processed: number;
        failed: number;
        results: Array<{ id: string; title: string; success: boolean; error?: string }>;
    }> {
        const documents = await this.getDocuments(tenantId);
        const results: Array<{ id: string; title: string; success: boolean; error?: string }> = [];

        this.logger.log(`Starting bulk re-ingest for ${documents.length} documents`);

        for (const doc of documents) {
            try {
                await this.reingestDocument(doc.id);
                results.push({ id: doc.id, title: doc.title, success: true });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`Failed to re-ingest document "${doc.title}": ${errorMessage}`);
                results.push({ id: doc.id, title: doc.title, success: false, error: errorMessage });
            }
        }

        const processed = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        this.logger.log(`Bulk re-ingest complete: ${processed}/${documents.length} succeeded, ${failed} failed`);

        return {
            total: documents.length,
            processed,
            failed,
            results,
        };
    }

    /**
     * Get all documents for a tenant
     */
    async getDocuments(tenantId: string): Promise<Document[]> {
        const { data, error } = await this.supabase
            .from('documents')
            .select('*')
            .eq('assistant_id', tenantId) // Query by assistant_id
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch documents: ${error.message}`);
        }

        return data.map((doc) => ({
            id: doc.id,
            tenantId: doc.tenant_id,
            title: doc.title,
            content: doc.content,
            sourceUrl: doc.source_url,
            docType: doc.doc_type,
            version: doc.version,
            status: doc.status,
            createdAt: doc.created_at,
        }));
    }

    /**
     * Delete a document and its chunks
     */
    async deleteDocument(documentId: string): Promise<void> {
        // Chunks are deleted via CASCADE
        const { error } = await this.supabase
            .from('documents')
            .delete()
            .eq('id', documentId);

        if (error) {
            throw new Error(`Failed to delete document: ${error.message}`);
        }
    }
}

