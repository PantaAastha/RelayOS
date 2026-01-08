// Knowledge Module
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { FileExtractorService } from './file-extractor.service';
import { ChunkerService } from './chunker.service';

@Module({
    imports: [ConfigModule],
    providers: [KnowledgeService, FileExtractorService, ChunkerService],
    controllers: [KnowledgeController],
    exports: [KnowledgeService],
})
export class KnowledgeModule { }

