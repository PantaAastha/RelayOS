import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Collection {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable()
export class CollectionsService {
    private supabase: SupabaseClient;
    private readonly logger = new Logger(CollectionsService.name);

    constructor(private configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
        }

        this.supabase = createClient(supabaseUrl, serviceRoleKey);
    }

    /**
     * Create a new collection
     */
    async createCollection(
        orgId: string,
        name: string,
        description?: string,
    ): Promise<Collection> {
        const { data, error } = await this.supabase
            .from('collections')
            .insert({
                organization_id: orgId,
                name,
                description,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create collection: ${error.message}`);
        }

        return {
            id: data.id,
            organizationId: data.organization_id,
            name: data.name,
            description: data.description,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    }

    /**
     * Get all collections for an organization
     */
    async getCollectionsByOrg(orgId: string): Promise<any[]> {
        // Query collections and join the document and assistant counts
        const { data, error } = await this.supabase
            .from('collections')
            .select(
                `
                id, organization_id, name, description, created_at, updated_at,
                collection_documents(count),
                assistant_collections(count)
                `
            )
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to list collections: ${error.message}`);
        }

        return data.map((collection: any) => ({
            id: collection.id,
            organizationId: collection.organization_id,
            name: collection.name,
            description: collection.description,
            documentCount: collection.collection_documents[0]?.count || 0,
            assistantCount: collection.assistant_collections[0]?.count || 0,
            createdAt: collection.created_at,
            updatedAt: collection.updated_at,
        }));
    }

    /**
     * Get a single collection
     */
    async getCollection(collectionId: string, orgId: string): Promise<any> {
        const { data, error } = await this.supabase
            .from('collections')
            .select('*')
            .eq('id', collectionId)
            .eq('organization_id', orgId)
            .single();

        if (error) {
            throw new Error(`Collection not found: ${error.message}`);
        }

        return {
            id: data.id,
            organizationId: data.organization_id,
            name: data.name,
            description: data.description,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    }

    /**
     * Delete a collection
     */
    async deleteCollection(collectionId: string, orgId: string): Promise<void> {
        const { error } = await this.supabase
            .from('collections')
            .delete()
            .eq('id', collectionId)
            .eq('organization_id', orgId);

        if (error) {
            throw new Error(`Failed to delete collection: ${error.message}`);
        }
    }

    /**
     * Attach documents to a collection
     */
    async addDocuments(collectionId: string, documentIds: string[]): Promise<void> {
        const inserts = documentIds.map((docId) => ({
            collection_id: collectionId,
            document_id: docId,
        }));

        const { error } = await this.supabase
            .from('collection_documents')
            .upsert(inserts, { onConflict: 'collection_id, document_id' });

        if (error) {
            throw new Error(`Failed to add documents to collection: ${error.message}`);
        }
    }

    /**
     * Detach documents from a collection
     */
    async removeDocuments(collectionId: string, documentIds: string[]): Promise<void> {
        const { error } = await this.supabase
            .from('collection_documents')
            .delete()
            .eq('collection_id', collectionId)
            .in('document_id', documentIds);

        if (error) {
            throw new Error(`Failed to remove documents from collection: ${error.message}`);
        }
    }

    /**
     * Attach assistant to a collection
     */
    async mountAssistant(collectionId: string, assistantId: string): Promise<void> {
        const { error } = await this.supabase
            .from('assistant_collections')
            .upsert({ collection_id: collectionId, assistant_id: assistantId }, { onConflict: 'assistant_id, collection_id' });

        if (error) {
            throw new Error(`Failed to mount collection to assistant: ${error.message}`);
        }
    }

    /**
     * Detach assistant from a collection
     */
    async unmountAssistant(collectionId: string, assistantId: string): Promise<void> {
        const { error } = await this.supabase
            .from('assistant_collections')
            .delete()
            .eq('collection_id', collectionId)
            .eq('assistant_id', assistantId);

        if (error) {
            throw new Error(`Failed to unmount collection from assistant: ${error.message}`);
        }
    }

    /**
     * Get documents within a collection
     */
    async getCollectionDocuments(collectionId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('collection_documents')
            .select('documents(*)')
            .eq('collection_id', collectionId);

        if (error) {
            throw new Error(`Failed to list collection documents: ${error.message}`);
        }

        return data.map((row: any) => {
            const doc = row.documents;
            return {
                id: doc.id,
                title: doc.title,
                docType: doc.doc_type,
                sourceUrl: doc.source_url,
                status: doc.status,
                createdAt: doc.created_at,
            };
        });
    }

    /**
     * Get assistants attached to a collection
     */
    async getCollectionAssistants(collectionId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('assistant_collections')
            .select('assistants(*)')
            .eq('collection_id', collectionId);

        if (error) {
            throw new Error(`Failed to list collection assistants: ${error.message}`);
        }

        return data.map((row: any) => {
            const ast = row.assistants;
            return {
                id: ast.id,
                name: ast.name,
                template: ast.template,
                status: ast.status,
            };
        });
    }

    /**
     * Get collections attached to an assistant
     */
    async getAssistantCollections(assistantId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('assistant_collections')
            .select('collections(*)')
            .eq('assistant_id', assistantId);

        if (error) {
            throw new Error(`Failed to list assistant collections: ${error.message}`);
        }

        return data.map((row: any) => {
            const col = row.collections;
            return {
                id: col.id,
                name: col.name,
                description: col.description,
                createdAt: col.created_at,
            };
        });
    }
}
