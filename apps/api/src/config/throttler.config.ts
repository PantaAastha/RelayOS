/**
 * Throttler/Rate Limiting Configuration
 * Protects API from abuse with per-tenant rate limits
 */

import { ThrottlerModuleOptions } from '@nestjs/throttler';

// Default: 10 requests per minute (lowered for testing, increase in production)
export const throttlerConfig: ThrottlerModuleOptions = {
    throttlers: [
        {
            name: 'default',
            ttl: 60000, // 1 minute in ms
            limit: parseInt(process.env.RATE_LIMIT_DEFAULT || '10', 10),
        },
        {
            name: 'conversation',
            ttl: 60000, // 1 minute
            limit: parseInt(process.env.RATE_LIMIT_CONVERSATION || '20', 10),
        },
    ],
};
