/**
 * Tenant-Aware Throttler Guard
 * Uses tenant ID as the tracking key so limits are per-tenant, not per-IP
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
    /**
     * Get the tracker key - use tenant ID if available, otherwise fall back to IP
     */
    protected async getTracker(req: Request): Promise<string> {
        const tenantId = req.headers['x-tenant-id'] as string;
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';

        // Use tenant ID for authenticated requests, IP for anonymous
        return tenantId ? `tenant:${tenantId}` : `ip:${ip}`;
    }

    /**
     * Custom error message for rate limiting
     */
    protected async throwThrottlingException(
        context: ExecutionContext,
    ): Promise<void> {
        const request = context.switchToHttp().getRequest<Request>();
        const tenantId = request.headers['x-tenant-id'] as string;

        throw new ThrottlerException(
            tenantId
                ? `Rate limit exceeded for tenant. Please wait before making more requests.`
                : `Rate limit exceeded. Please wait before making more requests.`,
        );
    }
}
