// File Extraction Service
// Extracts text content from various file formats (PDF, DOCX, TXT, MD)

import { Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';

export interface ExtractedFile {
    filename: string;
    content: string;
    mimeType: string;
    originalSize: number;
}

export interface ExtractionResult {
    success: boolean;
    content?: string;
    error?: string;
}

@Injectable()
export class FileExtractorService {
    private readonly logger = new Logger(FileExtractorService.name);

    // Supported MIME types
    private readonly supportedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'text/plain',
        'text/markdown',
    ];

    // Max file size: 10MB
    private readonly maxFileSize = 10 * 1024 * 1024;

    /**
     * Check if a file type is supported
     */
    isSupported(mimeType: string): boolean {
        return this.supportedTypes.includes(mimeType);
    }

    /**
     * Get supported file extensions for display
     */
    getSupportedExtensions(): string[] {
        return ['.pdf', '.docx', '.txt', '.md'];
    }

    /**
     * Validate file before extraction
     */
    validate(file: Express.Multer.File): { valid: boolean; error?: string } {
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`,
            };
        }

        if (!this.isSupported(file.mimetype)) {
            return {
                valid: false,
                error: `Unsupported file type: ${file.mimetype}. Supported: ${this.getSupportedExtensions().join(', ')}`,
            };
        }

        return { valid: true };
    }

    /**
     * Extract text from a file buffer based on its MIME type
     */
    async extract(file: Express.Multer.File): Promise<ExtractionResult> {
        const validation = this.validate(file);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        try {
            let content: string;

            switch (file.mimetype) {
                case 'application/pdf':
                    content = await this.extractPdf(file.buffer);
                    break;

                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    content = await this.extractDocx(file.buffer);
                    break;

                case 'text/plain':
                case 'text/markdown':
                    content = this.extractText(file.buffer);
                    break;

                default:
                    return { success: false, error: `Unhandled file type: ${file.mimetype}` };
            }

            // Clean up the extracted content
            content = this.cleanContent(content);

            if (!content || content.trim().length === 0) {
                return { success: false, error: 'No text content could be extracted from the file' };
            }

            this.logger.log(`Extracted ${content.length} characters from ${file.originalname}`);
            return { success: true, content };

        } catch (error) {
            this.logger.error(`Failed to extract content from ${file.originalname}:`, error);
            return {
                success: false,
                error: `Failed to extract content: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Extract text from PDF buffer
     */
    private async extractPdf(buffer: Buffer): Promise<string> {
        // pdf-parse ESM exports PDFParse class
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        return result.text;
    }

    /**
     * Extract text from DOCX buffer
     */
    private async extractDocx(buffer: Buffer): Promise<string> {
        const result = await mammoth.extractRawText({ buffer });

        if (result.messages.length > 0) {
            this.logger.warn('DOCX extraction warnings:', result.messages);
        }

        return result.value;
    }

    /**
     * Extract text from plain text/markdown buffer
     */
    private extractText(buffer: Buffer): string {
        return buffer.toString('utf-8');
    }

    /**
     * Clean up extracted content
     */
    private cleanContent(content: string): string {
        return content
            // Normalize line endings
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // Remove excessive whitespace
            .replace(/[ \t]+/g, ' ')
            // Remove excessive newlines (more than 2 in a row)
            .replace(/\n{3,}/g, '\n\n')
            // Trim
            .trim();
    }
}
