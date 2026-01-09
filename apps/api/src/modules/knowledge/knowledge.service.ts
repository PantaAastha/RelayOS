// Knowledge Service - RAG Pipeline
// Handles document ingestion, embedding, and semantic search

import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { LLMService } from '../llm/llm.service';
import { EventsService } from '../events/events.service';
import { ChunkerService } from './chunker.service';

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
                tenant_id: tenantId,
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
    ): Promise<SearchResult[]> {
        const searchStart = Date.now();

        // 1. Generate embedding for the query
        const { embedding } = await this.llmService.embed(query);

        // 2. Vector similarity search using pgvector
        // The <=> operator is cosine distance
        const { data, error } = await this.supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_tenant_id: tenantId,
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

        // 3. Build rich chunk details for debugging
        const chunks = (data ?? []).map((row: any) => ({
            section: row.metadata?.section || 'General',
            similarity: Math.round(row.similarity * 100) / 100,
            preview: row.content?.substring(0, 80) + '...',
            tokenCount: row.metadata?.tokenCount,
        }));

        // 4. Log the search with full RAG observability
        await this.eventsService.log(
            tenantId,
            'rag.searched',
            {
                query,
                chunksRetrieved: data?.length ?? 0,
                topScore: data?.[0]?.similarity ?? 0,
                chunks, // Full chunk details for debugging
                latencyMs,
            },
            conversationId,
            correlationId,
        );

        return (data ?? []).map((row: any) => ({
            chunkId: row.id,
            documentId: row.document_id,
            content: row.content,
            similarity: row.similarity,
            metadata: row.metadata,
        }));
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
            .eq('tenant_id', tenantId)
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

