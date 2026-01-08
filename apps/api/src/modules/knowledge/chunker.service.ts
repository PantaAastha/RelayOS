/**
 * Universal Chunking Service
 * Production-grade chunking with:
 * - Token-based sizing (not characters)
 * - Overlap between chunks for boundary safety
 * - Semantic block detection (headers)
 * - Context wrapper for better embeddings
 */

import { Injectable } from '@nestjs/common';
import { encoding_for_model, TiktokenModel } from 'tiktoken';

export interface ChunkConfig {
    targetTokens: number;  // Target chunk size
    maxTokens: number;     // Maximum chunk size
    minTokens: number;     // Minimum chunk size
    overlapPercent: number; // Overlap between chunks
}

export interface ChunkResult {
    content: string;       // The chunk text (with context wrapper)
    rawContent: string;    // Original chunk without wrapper
    section: string;       // Detected section/header
    tokenCount: number;    // Actual token count
    index: number;         // Chunk index in document
}

interface SemanticBlock {
    header: string;
    content: string;
    tokenCount: number;
}

@Injectable()
export class ChunkerService {
    private encoder;
    private readonly defaultConfig: ChunkConfig = {
        targetTokens: 350,
        maxTokens: 500,
        minTokens: 120,
        overlapPercent: 15,
    };

    constructor() {
        // Use cl100k_base encoding (GPT-4, text-embedding-3)
        // Works well as a general approximation for other models too
        this.encoder = encoding_for_model('gpt-4' as TiktokenModel);
    }

    /**
     * Count tokens in text
     */
    countTokens(text: string): number {
        return this.encoder.encode(text).length;
    }

    /**
     * Main entry point: Chunk a document
     */
    chunkDocument(
        content: string,
        documentTitle: string,
        config: Partial<ChunkConfig> = {},
    ): ChunkResult[] {
        const cfg = { ...this.defaultConfig, ...config };

        // Step 1: Normalize
        const normalized = this.normalize(content);

        // Step 2 & 3: Detect structure and build semantic blocks
        const blocks = this.buildSemanticBlocks(normalized);

        // Step 4: Token-aware chunk assembly
        const chunks = this.assembleChunks(blocks, cfg);

        // Step 5: Add context wrapper
        return chunks.map((chunk, index) => ({
            content: this.wrapWithContext(chunk.content, documentTitle, chunk.header),
            rawContent: chunk.content,
            section: chunk.header,
            tokenCount: chunk.tokenCount,
            index,
        }));
    }

    /**
     * Step 1: Normalize & preprocess
     */
    private normalize(text: string): string {
        return text
            // Normalize line endings
            .replace(/\r\n/g, '\n')
            // Collapse excessive newlines (keep max 2)
            .replace(/\n{3,}/g, '\n\n')
            // Normalize whitespace within lines
            .replace(/[ \t]+/g, ' ')
            // Trim lines
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            .trim();
    }

    /**
     * Step 2: Detect if a line is a "soft header"
     * A line is a header if 2+ of these are true:
     * - Short (< 80 chars)
     * - Ends with :
     * - ALL CAPS or Title Case
     * - Markdown-style (#, ##)
     * - Followed by substantial content
     */
    private isHeader(line: string, nextLine?: string): boolean {
        if (!line.trim()) return false;

        let score = 0;
        const trimmed = line.trim();

        // Short line
        if (trimmed.length < 80) score++;

        // Ends with colon
        if (trimmed.endsWith(':')) score++;

        // Markdown header
        if (/^#{1,6}\s/.test(trimmed)) score += 2;

        // ALL CAPS (at least 3 words)
        const words = trimmed.split(/\s+/);
        if (words.length >= 2 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
            score++;
        }

        // Title Case (most words capitalized)
        const titleCaseCount = words.filter(w => /^[A-Z]/.test(w)).length;
        if (words.length >= 2 && titleCaseCount / words.length >= 0.7) score++;

        // Followed by longer content
        if (nextLine && nextLine.trim().length > trimmed.length * 1.5) score++;

        return score >= 2;
    }

    /**
     * Step 3: Build semantic blocks
     */
    private buildSemanticBlocks(text: string): SemanticBlock[] {
        const lines = text.split('\n');
        const blocks: SemanticBlock[] = [];

        let currentHeader = 'General';
        let currentContent: string[] = [];

        const finalizeBlock = () => {
            const content = currentContent.join('\n').trim();
            if (content) {
                blocks.push({
                    header: currentHeader,
                    content,
                    tokenCount: this.countTokens(content),
                });
            }
            currentContent = [];
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const nextLine = lines[i + 1];

            if (this.isHeader(line, nextLine)) {
                // Finalize previous block
                finalizeBlock();
                // Clean header (remove markdown #)
                currentHeader = line.replace(/^#+\s*/, '').replace(/:$/, '').trim() || 'General';
            } else {
                currentContent.push(line);
            }
        }

        // Don't forget the last block
        finalizeBlock();

        // Merge very small blocks
        return this.mergeSmallBlocks(blocks);
    }

    /**
     * Merge blocks that are too small
     */
    private mergeSmallBlocks(blocks: SemanticBlock[]): SemanticBlock[] {
        if (blocks.length <= 1) return blocks;

        const merged: SemanticBlock[] = [];

        for (const block of blocks) {
            if (merged.length > 0 && block.tokenCount < 50) {
                // Merge with previous
                const prev = merged[merged.length - 1];
                prev.content += '\n\n' + block.content;
                prev.tokenCount = this.countTokens(prev.content);
            } else {
                merged.push({ ...block });
            }
        }

        return merged;
    }

    /**
     * Step 4: Token-aware chunk assembly
     */
    private assembleChunks(
        blocks: SemanticBlock[],
        config: ChunkConfig,
    ): Array<{ content: string; header: string; tokenCount: number }> {
        const chunks: Array<{ content: string; header: string; tokenCount: number }> = [];
        const overlapTokens = Math.floor(config.targetTokens * config.overlapPercent / 100);

        let currentContent = '';
        let currentHeader = 'General';
        let currentTokens = 0;

        const finalizeChunk = (addOverlapFrom?: string) => {
            if (currentContent.trim()) {
                chunks.push({
                    content: currentContent.trim(),
                    header: currentHeader,
                    tokenCount: currentTokens,
                });
            }

            // Start new chunk with overlap
            if (addOverlapFrom) {
                const words = addOverlapFrom.split(/\s+/);
                const overlapWords = words.slice(-overlapTokens);
                currentContent = overlapWords.join(' ');
                currentTokens = this.countTokens(currentContent);
            } else {
                currentContent = '';
                currentTokens = 0;
            }
        };

        for (const block of blocks) {
            // If block fits, add it
            if (currentTokens + block.tokenCount <= config.maxTokens) {
                if (currentContent) {
                    currentContent += '\n\n' + block.content;
                } else {
                    currentContent = block.content;
                    currentHeader = block.header;
                }
                currentTokens = this.countTokens(currentContent);
            }
            // Block would exceed max - finalize and start new
            else if (block.tokenCount <= config.maxTokens) {
                const prevContent = currentContent;
                finalizeChunk(prevContent);
                currentContent = block.content;
                currentHeader = block.header;
                currentTokens = this.countTokens(currentContent);
            }
            // Single block exceeds max - split by paragraphs
            else {
                if (currentContent) {
                    finalizeChunk(currentContent);
                }

                const paragraphs = block.content.split(/\n\n+/);
                for (const para of paragraphs) {
                    const paraTokens = this.countTokens(para);

                    if (currentTokens + paraTokens <= config.maxTokens) {
                        currentContent += (currentContent ? '\n\n' : '') + para;
                        currentTokens = this.countTokens(currentContent);
                    } else {
                        const prevContent = currentContent;
                        finalizeChunk(prevContent);
                        currentContent = para;
                        currentHeader = block.header;
                        currentTokens = paraTokens;
                    }
                }
            }
        }

        // Final chunk
        if (currentContent.trim()) {
            // Check min size
            if (currentTokens < config.minTokens && chunks.length > 0) {
                // Merge with previous chunk if under min
                const prev = chunks[chunks.length - 1];
                prev.content += '\n\n' + currentContent.trim();
                prev.tokenCount = this.countTokens(prev.content);
            } else {
                chunks.push({
                    content: currentContent.trim(),
                    header: currentHeader,
                    tokenCount: currentTokens,
                });
            }
        }

        return chunks;
    }

    /**
     * Step 5: Context wrapper
     */
    private wrapWithContext(content: string, documentTitle: string, section: string): string {
        return `Document: ${documentTitle}
Section: ${section}

${content}`;
    }
}
