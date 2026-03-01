// Events Module
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { AssistantsModule } from '../assistants/assistants.module';

@Global()
@Module({
    imports: [ConfigModule, AssistantsModule],
    controllers: [EventsController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule { }
