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
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { KnowledgeService } from './knowledge.service';
import { FileExtractorService } from './file-extractor.service';

interface IngestDocumentDto {
    title: string;
    content: string;
    sourceUrl?: string;
    docType?: string;
}

@Controller('knowledge')
export class KnowledgeController {
    constructor(
        private knowledgeService: KnowledgeService,
        private fileExtractorService: FileExtractorService,
    ) { }

    /**
     * POST /knowledge/documents - Ingest a new document
     */
    @Post('documents')
    async ingestDocument(
        @Headers() headers: Record<string, string>,
        @Body() dto: IngestDocumentDto,
    ) {
        const assistantId = headers['x-assistant-id'];
        if (!assistantId) {
            throw new HttpException('X-Assistant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        if (!dto.title || !dto.content) {
            throw new HttpException('title and content are required', HttpStatus.BAD_REQUEST);
        }

        const document = await this.knowledgeService.ingestDocument(
            assistantId,
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
    @Get('documents')
    async listDocuments(@Headers() headers: Record<string, string>) {
        const assistantId = headers['x-assistant-id'];
        if (!assistantId) {
            throw new HttpException('X-Assistant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        const documents = await this.knowledgeService.getDocuments(assistantId);
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
     * POST /knowledge/documents/:id/reingest - Re-process document with current chunker
     * Useful after changing chunking parameters to update embeddings
     */
    @Post('documents/:id/reingest')
    async reingestDocument(@Param('id') documentId: string) {
        const document = await this.knowledgeService.reingestDocument(documentId);
        return {
            success: true,
            document,
            message: 'Document re-ingested with current chunker settings',
        };
    }

    /**
     * POST /knowledge/reingest-all - Re-process all documents with current chunker
     * Useful for batch updates after changing chunking parameters
     */
    @Post('reingest-all')
    @Post('reingest-all')
    async reingestAllDocuments(@Headers() headers: Record<string, string>) {
        const assistantId = headers['x-assistant-id'];
        if (!assistantId) {
            throw new HttpException('X-Assistant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        const result = await this.knowledgeService.reingestAllDocuments(assistantId);
        return {
            success: result.failed === 0,
            ...result,
            message: `Re-ingested ${result.processed}/${result.total} documents`,
        };
    }

    /**
     * POST /knowledge/search - Search documents
     */
    @Post('search')
    async search(
        @Headers() headers: Record<string, string>,
        @Body() dto: { query: string; limit?: number },
    ) {
        const assistantId = headers['x-assistant-id'];
        if (!assistantId) {
            throw new HttpException('X-Assistant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        if (!dto.query) {
            throw new HttpException('query is required', HttpStatus.BAD_REQUEST);
        }

        const results = await this.knowledgeService.search(
            assistantId,
            dto.query,
            dto.limit ?? 5,
        );

        return { results };
    }

    /**
     * POST /knowledge/upload - Upload a single file
     * Supports: PDF, DOCX, TXT, MD
     */
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @Headers() headers: Record<string, string>,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { title?: string; docType?: string },
    ) {
        const assistantId = headers['x-assistant-id'];
        if (!assistantId) {
            throw new HttpException('X-Assistant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        if (!file) {
            throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
        }

        // Extract text from file
        const extraction = await this.fileExtractorService.extract(file);

        if (!extraction.success || !extraction.content) {
            throw new HttpException(
                extraction.error || 'Failed to extract content from file',
                HttpStatus.BAD_REQUEST,
            );
        }

        // Use filename as title if not provided
        const title = body.title?.trim() || file.originalname.replace(/\.[^/.]+$/, '');

        // Ingest the extracted content
        const document = await this.knowledgeService.ingestDocument(
            assistantId,
            title,
            extraction.content,
            {
                sourceUrl: file.originalname,
                docType: body.docType || 'general',
            },
        );

        return {
            success: true,
            document,
            extractedLength: extraction.content.length,
        };
    }

    /**
     * POST /knowledge/upload-batch - Upload multiple files
     * Supports: PDF, DOCX, TXT, MD (max 10 files)
     */
    @Post('upload-batch')
    @UseInterceptors(FilesInterceptor('files', 10))
    async uploadFiles(
        @Headers() headers: Record<string, string>,
        @UploadedFiles() files: Express.Multer.File[],
        @Body() body: { docType?: string },
    ) {
        const assistantId = headers['x-assistant-id'];
        if (!assistantId) {
            throw new HttpException('X-Assistant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        if (!files || files.length === 0) {
            throw new HttpException('No files provided', HttpStatus.BAD_REQUEST);
        }

        const results: Array<{
            filename: string;
            success: boolean;
            documentId?: string;
            error?: string;
        }> = [];

        for (const file of files) {
            try {
                const extraction = await this.fileExtractorService.extract(file);

                if (!extraction.success || !extraction.content) {
                    results.push({
                        filename: file.originalname,
                        success: false,
                        error: extraction.error || 'Failed to extract content',
                    });
                    continue;
                }

                const title = file.originalname.replace(/\.[^/.]+$/, '');
                const document = await this.knowledgeService.ingestDocument(
                    assistantId,
                    title,
                    extraction.content,
                    {
                        sourceUrl: file.originalname,
                        docType: body.docType || 'general',
                    },
                );

                results.push({
                    filename: file.originalname,
                    success: true,
                    documentId: document.id,
                });
            } catch (error) {
                results.push({
                    filename: file.originalname,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        const successCount = results.filter((r) => r.success).length;

        return {
            success: successCount > 0,
            total: files.length,
            processed: successCount,
            failed: files.length - successCount,
            results,
        };
    }

    /**
     * GET /knowledge/upload/supported - Get supported file types
     */
    @Get('upload/supported')
    getSupportedTypes() {
        return {
            extensions: this.fileExtractorService.getSupportedExtensions(),
            maxSizeMB: 10,
            maxFiles: 10,
        };
    }
}
