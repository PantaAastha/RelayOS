/**
 * Throttler/Rate Limiting Configuration
 * Protects API from abuse with per-tenant rate limits
 */

import { ThrottlerModuleOptions } from '@nestjs/throttler';

// Default: 60 requests per minute per IP/assistant
export const throttlerConfig: ThrottlerModuleOptions = {
    throttlers: [
        {
            name: 'default',
            ttl: 60000, // 1 minute in ms
            limit: parseInt(process.env.RATE_LIMIT_DEFAULT || '60', 10),
        },
        {
            name: 'conversation',
            ttl: 60000, // 1 minute
            limit: parseInt(process.env.RATE_LIMIT_CONVERSATION || '20', 10),
        },
    ],
};
