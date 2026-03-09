import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Headers,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
    constructor(private readonly collectionsService: CollectionsService) { }

    private requireOrg(orgId: string) {
        if (!orgId) {
            throw new HttpException('X-Organization-ID header is required', HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * POST /collections - Create a collection
     */
    @Post()
    async createCollection(
        @Headers('x-organization-id') orgId: string,
        @Body() body: { name: string; description?: string },
    ) {
        this.requireOrg(orgId);
        if (!body.name) {
            throw new HttpException('name is required', HttpStatus.BAD_REQUEST);
        }
        const collection = await this.collectionsService.createCollection(orgId, body.name, body.description);
        return { success: true, collection };
    }

    /**
     * GET /collections - List all collections for org
     */
    @Get()
    async listCollections(@Headers('x-organization-id') orgId: string) {
        this.requireOrg(orgId);
        const collections = await this.collectionsService.getCollectionsByOrg(orgId);
        return { collections };
    }

    /**
     * GET /collections/:id - Get collection by ID
     */
    @Get(':id')
    async getCollection(
        @Headers('x-organization-id') orgId: string,
        @Param('id') collectionId: string,
    ) {
        this.requireOrg(orgId);
        const collection = await this.collectionsService.getCollection(collectionId, orgId);
        return { collection };
    }

    /**
     * DELETE /collections/:id - Delete collection
     */
    @Delete(':id')
    async deleteCollection(
        @Headers('x-organization-id') orgId: string,
        @Param('id') collectionId: string,
    ) {
        this.requireOrg(orgId);
        await this.collectionsService.deleteCollection(collectionId, orgId);
        return { success: true };
    }

    /**
     * GET /collections/:id/documents - List documents in a collection
     */
    @Get(':id/documents')
    async getCollectionDocuments(
        @Headers('x-organization-id') orgId: string,
        @Param('id') collectionId: string,
    ) {
        this.requireOrg(orgId);
        const documents = await this.collectionsService.getCollectionDocuments(collectionId);
        return { documents };
    }

    /**
     * PUT /collections/:id/documents - Modify document attachments
     */
    @Put(':id/documents')
    async updateCollectionDocuments(
        @Headers('x-organization-id') orgId: string,
        @Param('id') collectionId: string,
        @Body() body: { add?: string[]; remove?: string[] },
    ) {
        this.requireOrg(orgId);

        if (body.add && body.add.length > 0) {
            await this.collectionsService.addDocuments(collectionId, body.add);
        }
        if (body.remove && body.remove.length > 0) {
            await this.collectionsService.removeDocuments(collectionId, body.remove);
        }

        return { success: true };
    }

    /**
     * GET /collections/:id/assistants - List assistants attached to a collection
     */
    @Get(':id/assistants')
    async getCollectionAssistants(
        @Headers('x-organization-id') orgId: string,
        @Param('id') collectionId: string,
    ) {
        this.requireOrg(orgId);
        const assistants = await this.collectionsService.getCollectionAssistants(collectionId);
        return { assistants };
    }

    /**
     * PUT /collections/:id/assistants - Mount / Unmount assistants
     */
    @Put(':id/assistants')
    async updateCollectionAssistants(
        @Headers('x-organization-id') orgId: string,
        @Param('id') collectionId: string,
        @Body() body: { mount?: string[]; unmount?: string[] },
    ) {
        this.requireOrg(orgId);

        if (body.mount && body.mount.length > 0) {
            for (const assistantId of body.mount) {
                await this.collectionsService.mountAssistant(collectionId, assistantId);
            }
        }
        if (body.unmount && body.unmount.length > 0) {
            for (const assistantId of body.unmount) {
                await this.collectionsService.unmountAssistant(collectionId, assistantId);
            }
        }

        return { success: true };
    }

    /**
     * GET /collections/assistant/:assistantId - List collections attached to an assistant
     */
    @Get('assistant/:assistantId')
    async getAssistantCollections(
        @Headers('x-organization-id') orgId: string,
        @Param('assistantId') assistantId: string,
    ) {
        this.requireOrg(orgId);
        const collections = await this.collectionsService.getAssistantCollections(assistantId);
        return { collections };
    }
}
