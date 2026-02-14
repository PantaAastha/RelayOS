import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, BadRequestException } from '@nestjs/common';
import { AssistantsService } from './assistants.service';

@Controller('assistants')
export class AssistantsController {
    constructor(private assistantsService: AssistantsService) { }

    @Post()
    async createAssistant(@Body() body: { name: string; slug: string; organizationId: string; config?: any }) {
        if (!body.name || !body.slug || !body.organizationId) {
            throw new BadRequestException('Name, slug, and organizationId are required');
        }
        return this.assistantsService.createAssistant(body);
    }

    @Get()
    async listAssistants(@Headers('x-organization-id') organizationId?: string) {
        // In a real scenario, we should extract organizationId from auth token but for now we accept header or list all
        return this.assistantsService.listAssistants(organizationId);
    }

    @Get('me')
    async getCurrentAssistant(@Headers() headers: Record<string, string>) {
        const assistantId = headers['x-assistant-id'];
        if (!assistantId) {
            throw new BadRequestException('X-Assistant-ID header is required');
        }
        return this.assistantsService.getAssistantById(assistantId);
    }

    @Get('by-slug/:slug')
    async getAssistantBySlug(@Param('slug') slug: string) {
        return this.assistantsService.getAssistantBySlug(slug);
    }

    // Widget bootstrap endpoint — public, returns only what the widget needs
    // Must be defined BEFORE :id to avoid route collision
    @Get(':id/widget-config')
    async getWidgetConfig(@Param('id') id: string) {
        return this.assistantsService.getWidgetBootstrap(id);
    }

    @Get(':id')
    async getAssistant(@Param('id') id: string) {
        return this.assistantsService.getAssistantById(id);
    }

    @Patch(':id')
    async updateAssistant(@Param('id') id: string, @Body() body: any) {
        return this.assistantsService.updateAssistant(id, body);
    }

    @Delete(':id')
    async deleteAssistant(@Param('id') id: string) {
        return this.assistantsService.deleteAssistant(id);
    }
}
