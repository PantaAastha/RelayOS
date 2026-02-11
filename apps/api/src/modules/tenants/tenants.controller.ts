import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, BadRequestException } from '@nestjs/common';
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

    // Widget bootstrap endpoint — public, returns only what the widget needs
    // Must be defined BEFORE :id to avoid route collision
    @Get(':id/widget-config')
    async getWidgetConfig(@Param('id') id: string) {
        return this.tenantsService.getWidgetBootstrap(id);
    }

    @Get(':id')
    async getTenant(@Param('id') id: string) {
        return this.tenantsService.getTenantById(id);
    }

    @Patch(':id')
    async updateTenant(@Param('id') id: string, @Body() body: any) {
        return this.tenantsService.updateTenant(id, body);
    }

    @Delete(':id')
    async deleteTenant(@Param('id') id: string) {
        return this.tenantsService.deleteTenant(id);
    }
}
