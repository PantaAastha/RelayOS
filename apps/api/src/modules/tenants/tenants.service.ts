import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TenantPersona {
    name?: string;
    tone?: string;
    voice?: string;
    boundaries?: string;
    customInstructions?: string;
}

export interface StarterQuestion {
    label: string;
    message: string;
}

export type AssistantType = 'reactive' | 'guided' | 'reference';

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    config: Record<string, any>;
    persona: TenantPersona;
    assistant_type: AssistantType;
    starter_questions: StarterQuestion[];
    welcome_message: string;
    created_at: string;
    updated_at: string;
}

export interface WidgetBootstrap {
    tenantName: string;
    welcomeMessage: string;
    starterQuestions: StarterQuestion[];
    assistantType: AssistantType;
    persona: { name?: string };
    config: {
        primaryColor?: string;
        widgetTitle?: string;
    };
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

    async updateTenant(id: string, data: {
        name?: string;
        slug?: string;
        config?: Record<string, any>;
        persona?: TenantPersona;
        assistant_type?: AssistantType;
        welcome_message?: string;
        starter_questions?: StarterQuestion[];
    }): Promise<Tenant> {
        // Validate assistant_type if provided
        if (data.assistant_type && !['reactive', 'guided', 'reference'].includes(data.assistant_type)) {
            throw new BadRequestException('assistant_type must be one of: reactive, guided, reference');
        }

        // Build update payload (only include fields that were provided)
        const updatePayload: Record<string, any> = {};
        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.slug !== undefined) updatePayload.slug = data.slug;
        if (data.config !== undefined) updatePayload.config = data.config;
        if (data.persona !== undefined) updatePayload.persona = data.persona;
        if (data.assistant_type !== undefined) updatePayload.assistant_type = data.assistant_type;
        if (data.welcome_message !== undefined) updatePayload.welcome_message = data.welcome_message;
        if (data.starter_questions !== undefined) updatePayload.starter_questions = data.starter_questions;
        updatePayload.updated_at = new Date().toISOString();

        if (Object.keys(updatePayload).length === 1) {
            // Only updated_at was set, nothing to update
            throw new BadRequestException('No fields to update');
        }

        const { data: tenant, error } = await this.supabase
            .from('tenants')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new BadRequestException('Tenant with this slug already exists');
            }
            throw new Error(`Failed to update tenant: ${error.message}`);
        }

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
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

    async getWidgetBootstrap(tenantId: string): Promise<WidgetBootstrap> {
        const tenant = await this.getTenantById(tenantId);
        const config = (tenant.config || {}) as Record<string, any>;
        const persona = (tenant.persona || {}) as TenantPersona;

        return {
            tenantName: tenant.name,
            welcomeMessage: tenant.welcome_message || 'Hi there! How can I help you today?',
            starterQuestions: tenant.starter_questions || [],
            assistantType: tenant.assistant_type || 'reactive',
            persona: { name: persona.name },
            config: {
                primaryColor: config.primaryColor,
                widgetTitle: config.widgetTitle,
            },
        };
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
