// Knowledge Module
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { FileExtractorService } from './file-extractor.service';
import { ChunkerService } from './chunker.service';
import { QueryProcessorService } from './query-processor.service';

@Module({
    imports: [ConfigModule],
    providers: [KnowledgeService, FileExtractorService, ChunkerService, QueryProcessorService],
    controllers: [KnowledgeController],
    exports: [KnowledgeService, QueryProcessorService],
})
export class KnowledgeModule { }
