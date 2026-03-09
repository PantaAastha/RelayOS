import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  imports: [ConfigModule],
  controllers: [CollectionsController],
  providers: [CollectionsService]
})
export class CollectionsModule { }
