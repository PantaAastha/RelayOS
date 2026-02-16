import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
}

@Injectable()
export class OrganizationsService {
    private supabase: SupabaseClient;

    constructor(private configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
        }

        this.supabase = createClient(supabaseUrl, serviceRoleKey);
    }

    async createOrganization(data: { name: string; slug: string }): Promise<Organization> {
        const { data: org, error } = await this.supabase
            .from('organizations')
            .insert({
                name: data.name,
                slug: data.slug,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new BadRequestException('Organization with this slug already exists');
            }
            throw new Error(`Failed to create organization: ${error.message}`);
        }

        return org;
    }

    async getOrganizationById(id: string): Promise<Organization> {
        const { data, error } = await this.supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException('Organization not found');
        }

        return data;
    }

    async getOrganizationBySlug(slug: string): Promise<Organization> {
        const { data, error } = await this.supabase
            .from('organizations')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error || !data) {
            throw new NotFoundException('Organization not found');
        }

        return data;
    }

    async listOrganizations(): Promise<Organization[]> {
        const { data, error } = await this.supabase
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to list organizations: ${error.message}`);
        }

        return data || [];
    }
}
