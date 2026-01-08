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
    ): Promise<SearchResult[]> {
        // 1. Generate embedding for the query
        const { embedding } = await this.llmService.embed(query);

        // 2. Vector similarity search using pgvector
        // The <=> operator is cosine distance
        const { data, error } = await this.supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_tenant_id: tenantId,
            match_count: limit,
            match_threshold: 0.3, // Minimum similarity threshold
        });

        if (error) {
            // Log failure but return empty results
            await this.eventsService.log(
                tenantId,
                'rag.searched',
                { query, error: error.message, chunksRetrieved: 0 },
                conversationId,
            );
            console.error('Search failed:', error);
            return [];
        }

        // 3. Log the search
        await this.eventsService.log(
            tenantId,
            'rag.searched',
            {
                query,
                chunksRetrieved: data?.length ?? 0,
                topScore: data?.[0]?.similarity ?? 0,
            },
            conversationId,
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

