// Knowledge Controller - REST API for document management
import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    Headers,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

interface IngestDocumentDto {
    title: string;
    content: string;
    sourceUrl?: string;
    docType?: string;
}

@Controller('knowledge')
export class KnowledgeController {
    constructor(private knowledgeService: KnowledgeService) { }

    /**
     * POST /knowledge/documents - Ingest a new document
     */
    @Post('documents')
    async ingestDocument(
        @Headers('x-tenant-id') tenantId: string,
        @Body() dto: IngestDocumentDto,
    ) {
        if (!tenantId) {
            throw new HttpException('X-Tenant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        if (!dto.title || !dto.content) {
            throw new HttpException('title and content are required', HttpStatus.BAD_REQUEST);
        }

        const document = await this.knowledgeService.ingestDocument(
            tenantId,
            dto.title,
            dto.content,
            {
                sourceUrl: dto.sourceUrl,
                docType: dto.docType,
            },
        );

        return {
            success: true,
            document,
        };
    }

    /**
     * GET /knowledge/documents - List all documents for a tenant
     */
    @Get('documents')
    async listDocuments(@Headers('x-tenant-id') tenantId: string) {
        if (!tenantId) {
            throw new HttpException('X-Tenant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        const documents = await this.knowledgeService.getDocuments(tenantId);
        return { documents };
    }

    /**
     * DELETE /knowledge/documents/:id - Delete a document
     */
    @Delete('documents/:id')
    async deleteDocument(@Param('id') documentId: string) {
        await this.knowledgeService.deleteDocument(documentId);
        return { success: true };
    }

    /**
     * POST /knowledge/search - Search documents
     */
    @Post('search')
    async search(
        @Headers('x-tenant-id') tenantId: string,
        @Body() dto: { query: string; limit?: number },
    ) {
        if (!tenantId) {
            throw new HttpException('X-Tenant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        if (!dto.query) {
            throw new HttpException('query is required', HttpStatus.BAD_REQUEST);
        }

        const results = await this.knowledgeService.search(
            tenantId,
            dto.query,
            dto.limit ?? 5,
        );

        return { results };
    }
}
