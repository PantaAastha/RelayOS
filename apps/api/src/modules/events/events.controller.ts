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
import { SkipThrottle } from '@nestjs/throttler';
import { EventsService } from './events.service';
import type { EventType } from './events.service';
import { AssistantsService } from '../assistants/assistants.service';

@Controller('events')
export class EventsController {
    constructor(
        private eventsService: EventsService,
        private assistantsService: AssistantsService,
    ) { }

    /**
     * GET /events - List events with optional filters
     * Supports: X-Organization-ID (org-scoped) or X-Assistant-ID (assistant-scoped)
     */
    @SkipThrottle()
    @Get()
    async listEvents(
        @Headers() headers: Record<string, string>,
        @Query('type') eventType?: string,
        @Query('since') since?: string,
        @Query('search') search?: string,
        @Query('limit') limit?: string,
    ) {
        const orgId = headers['x-organization-id'];
        const assistantId = headers['x-assistant-id'];

        const options: {
            eventType?: EventType;
            since?: Date;
            search?: string;
            limit?: number;
        } = {};

        if (eventType) options.eventType = eventType as EventType;
        if (since) options.since = new Date(since);
        if (search) options.search = search;
        if (limit) options.limit = parseInt(limit, 10);

        if (orgId) {
            const assistantIds = await this.assistantsService.getAssistantIdsForOrg(orgId);
            const events = await this.eventsService.listEventsByOrg(assistantIds, options);
            return { events };
        }

        if (assistantId) {
            const events = await this.eventsService.listEvents(assistantId, options);
            return { events };
        }

        // Fallback: auto-detect org
        const defaultOrgId = await this.assistantsService.getDefaultOrgId();
        if (defaultOrgId) {
            const assistantIds = await this.assistantsService.getAssistantIdsForOrg(defaultOrgId);
            const events = await this.eventsService.listEventsByOrg(assistantIds, options);
            return { events };
        }

        return { events: [] };
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
