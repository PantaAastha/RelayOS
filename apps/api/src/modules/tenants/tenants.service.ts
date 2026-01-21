import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    config: Record<string, any>;
    created_at: string;
    updated_at: string;
}

@Injectable()
export class TenantsService {
    private supabase: SupabaseClient;

    constructor(private configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
        }

        this.supabase = createClient(supabaseUrl, serviceRoleKey);
    }

    async validateTenant(tenantId: string): Promise<boolean> {
        const { data } = await this.supabase
            .from('tenants')
            .select('id')
            .eq('id', tenantId)
            .single();

        return !!data;
    }

    async createTenant(data: { name: string; slug: string; config?: any }): Promise<Tenant> {
        const { data: tenant, error } = await this.supabase
            .from('tenants')
            .insert({
                name: data.name,
                slug: data.slug,
                config: data.config || {},
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new BadRequestException('Tenant with this slug already exists');
            }
            throw new Error(`Failed to create tenant: ${error.message}`);
        }

        return tenant;
    }

    async getTenantById(id: string): Promise<Tenant> {
        const { data, error } = await this.supabase
            .from('tenants')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException('Tenant not found');
        }

        return data;
    }

    async getTenantBySlug(slug: string): Promise<Tenant> {
        const { data, error } = await this.supabase
            .from('tenants')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error || !data) {
            throw new NotFoundException('Tenant not found');
        }

        return data;
    }

    async listTenants(): Promise<Tenant[]> {
        const { data, error } = await this.supabase
            .from('tenants')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to list tenants: ${error.message}`);
        }

        return data || [];
    }
    async deleteTenant(id: string): Promise<void> {
        // Proper FK-aware deletion order:
        // 1. Get all conversation IDs first (needed for events deletion)
        // 2. Delete events (has FK to conversations)
        // 3. Delete messages (has FK to conversations)
        // 4. Delete conversations (has FK to tenant)
        // 5. Delete documents (has FK to tenant, chunks cascade)
        // 6. Delete tenant

        // 1. Get all conversation IDs for this tenant
        const { data: conversations, error: convFetchError } = await this.supabase
            .from('conversations')
            .select('id')
            .eq('tenant_id', id);

        if (convFetchError) {
            throw new Error(`Failed to fetch conversations: ${convFetchError.message}`);
        }

        const conversationIds = conversations?.map(c => c.id) || [];

        // 2. Delete events - by tenant_id AND conversation_id for completeness
        // First delete events that reference these conversations
        if (conversationIds.length > 0) {
            const { error: eventsConvError } = await this.supabase
                .from('events')
                .delete()
                .in('conversation_id', conversationIds);

            if (eventsConvError) {
                throw new Error(`Failed to clean up conversation events: ${eventsConvError.message}`);
            }
        }

        // Also delete any events by tenant_id (e.g., events without conversation_id)
        const { error: eventsTenantError } = await this.supabase
            .from('events')
            .delete()
            .eq('tenant_id', id);

        if (eventsTenantError) {
            throw new Error(`Failed to clean up tenant events: ${eventsTenantError.message}`);
        }

        // 3. Delete messages (FK to conversations)
        if (conversationIds.length > 0) {
            const { error: messagesError } = await this.supabase
                .from('messages')
                .delete()
                .in('conversation_id', conversationIds);

            if (messagesError) {
                throw new Error(`Failed to clean up messages: ${messagesError.message}`);
            }
        }

        // 4. Delete conversations (FK to tenant)
        if (conversationIds.length > 0) {
            const { error: convError } = await this.supabase
                .from('conversations')
                .delete()
                .eq('tenant_id', id);

            if (convError) {
                throw new Error(`Failed to clean up conversations: ${convError.message}`);
            }
        }

        // 5. Delete documents (FK to tenant, chunks cascade via ON DELETE CASCADE)
        const { error: docsError } = await this.supabase
            .from('documents')
            .delete()
            .eq('tenant_id', id);

        if (docsError) {
            throw new Error(`Failed to clean up documents: ${docsError.message}`);
        }

        // 6. Finally delete the tenant
        const { error } = await this.supabase
            .from('tenants')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete tenant: ${error.message}`);
        }
    }
}
