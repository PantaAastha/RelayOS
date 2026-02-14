/**
 * Correlation ID Middleware
 * Generates or extracts correlation ID for request tracing
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request to include tracing context
declare global {
    namespace Express {
        interface Request {
            correlationId: string;
            tenantId?: string;
            requestStartTime: number;
        }
    }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Use existing correlation ID or generate new one
        const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();

        // Extract tenant ID from header
        const tenantId = req.headers['x-tenant-id'] as string;

        // Attach to request for downstream use
        req.correlationId = correlationId;
        req.tenantId = tenantId;
        req.requestStartTime = Date.now();

        // 2. Normalize Assistant/Tenant ID headers
        if (req.headers['x-tenant-id'] && !req.headers['x-assistant-id']) {
            req.headers['x-assistant-id'] = req.headers['x-tenant-id'];
        }

        // 3. Attach correlation ID to request for logging
        req['correlationId'] = correlationId;
        res.setHeader('X-Correlation-ID', correlationId);

        next();
    }
}
