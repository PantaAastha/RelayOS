import { Controller, Get, Post, Delete, Body, Param, Headers, BadRequestException } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
    constructor(private tenantsService: TenantsService) { }

    @Post()
    async createTenant(@Body() body: { name: string; slug: string; config?: any }) {
        if (!body.name || !body.slug) {
            throw new BadRequestException('Name and slug are required');
        }
        return this.tenantsService.createTenant(body);
    }

    @Get()
    async listTenants() {
        // In a real scenario, this should be admin-protected
        return this.tenantsService.listTenants();
    }

    @Get('me')
    async getCurrentTenant(@Headers('x-tenant-id') tenantId: string) {
        if (!tenantId) {
            throw new BadRequestException('X-Tenant-ID header is required');
        }
        return this.tenantsService.getTenantById(tenantId);
    }

    @Get('by-slug/:slug')
    async getTenantBySlug(@Param('slug') slug: string) {
        return this.tenantsService.getTenantBySlug(slug);
    }

    @Get(':id')
    async getTenant(@Param('id') id: string) {
        return this.tenantsService.getTenantById(id);
    }

    @Delete(':id')
    async deleteTenant(@Param('id') id: string) {
        return this.tenantsService.deleteTenant(id);
    }
}
