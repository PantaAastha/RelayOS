/**
 * Assistant-Aware Throttler Guard (formerly Tenant-Aware)
 * Uses assistant ID as the tracking key so limits are per-assistant, not per-IP
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class AssistantThrottlerGuard extends ThrottlerGuard {
    /**
     * Get the tracker key - use assistant ID if available, otherwise fall back to IP
     */
    protected async getTracker(req: Request): Promise<string> {
        // Support both new and old headers for backward compatibility
        const assistantId = (req.headers['x-assistant-id'] || req.headers['x-tenant-id']) as string;
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';

        // Use assistant ID for authenticated requests, IP for anonymous
        return assistantId ? `assistant:${assistantId}` : `ip:${ip}`;
    }

    /**
     * Custom error message for rate limiting
     */
    protected async throwThrottlingException(
        context: ExecutionContext,
    ): Promise<void> {
        const request = context.switchToHttp().getRequest<Request>();
        const assistantId = (request.headers['x-assistant-id'] || request.headers['x-tenant-id']) as string;

        throw new ThrottlerException(
            assistantId
                ? `Rate limit exceeded for assistant. Please wait before making more requests.`
                : `Rate limit exceeded. Please wait before making more requests.`,
        );
    }
}
