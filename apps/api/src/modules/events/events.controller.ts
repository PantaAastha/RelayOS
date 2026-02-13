// Events Controller - REST API for event observability
import {
    Controller,
    Get,
    Param,
    Query,
    Headers,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { EventsService } from './events.service';
import type { EventType } from './events.service';

@Controller('events')
export class EventsController {
    constructor(private eventsService: EventsService) { }

    /**
     * GET /events - List events with optional filters
     */
    @Get()
    async listEvents(
        @Headers() headers: Record<string, string>,
        @Query('type') eventType?: string,
        @Query('since') since?: string,
        @Query('search') search?: string,
        @Query('limit') limit?: string,
    ) {
        const tenantId = headers['x-assistant-id'] || headers['x-tenant-id'];
        if (!tenantId) {
            throw new HttpException('X-Assistant-ID or X-Tenant-ID header is required', HttpStatus.BAD_REQUEST);
        }

        const options: {
            eventType?: EventType;
            since?: Date;
            search?: string;
            limit?: number;
        } = {};

        if (eventType) {
            options.eventType = eventType as EventType;
        }

        if (since) {
            options.since = new Date(since);
        }

        if (search) {
            options.search = search;
        }

        if (limit) {
            options.limit = parseInt(limit, 10);
        }

        const events = await this.eventsService.listEvents(tenantId, options);
        return { events };
    }

    /**
     * GET /events/types - List available event types
     */
    @Get('types')
    getEventTypes() {
        return { types: this.eventsService.getEventTypes() };
    }

    /**
     * GET /events/:id - Get single event detail
     */
    @Get(':id')
    async getEvent(@Param('id') eventId: string) {
        const id = parseInt(eventId, 10);
        if (isNaN(id)) {
            throw new HttpException('Invalid event ID', HttpStatus.BAD_REQUEST);
        }

        const event = await this.eventsService.getEventById(id);
        return { event };
    }
}
