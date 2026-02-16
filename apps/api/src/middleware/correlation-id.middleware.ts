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
            assistantId?: string;
            requestStartTime: number;
        }
    }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Use existing correlation ID or generate new one
        const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();

        // Attach to request for downstream use
        req.correlationId = correlationId;
        req.requestStartTime = Date.now();

        // 3. Attach correlation ID to request for logging
        req['correlationId'] = correlationId;
        res.setHeader('X-Correlation-ID', correlationId);

        next();
    }
}
