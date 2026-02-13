import { Controller, Get, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
    constructor(private organizationsService: OrganizationsService) { }

    @Post()
    async createOrganization(@Body() body: { name: string; slug: string }) {
        if (!body.name || !body.slug) {
            throw new BadRequestException('Name and slug are required');
        }
        return this.organizationsService.createOrganization(body);
    }

    @Get()
    async listOrganizations() {
        return this.organizationsService.listOrganizations();
    }

    @Get(':id')
    async getOrganization(@Param('id') id: string) {
        return this.organizationsService.getOrganizationById(id);
    }

    @Get('by-slug/:slug')
    async getOrganizationBySlug(@Param('slug') slug: string) {
        return this.organizationsService.getOrganizationBySlug(slug);
    }
}
