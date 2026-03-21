import { RateLimitKeySchema } from '@app/middleware/built-in/rate-limiter-middleware/schemas';
import { z } from 'zod';

export const BuiltInMiddlewareConfigSchema = z.object({
    global: z.object({
        botFilter: z.object({
            enabled: z.boolean(),
        }),
        rateLimiter: z.object({
            enabled: z.boolean(),
            windowMs: z.number().int().positive(),
            maxEvents: z.number().int().positive(),
            block: z.boolean(),
            key: RateLimitKeySchema,
            pruneIntervalMs: z.number().int().positive().optional(),
        }),
        profanityFilter: z.object({
            enabled: z.boolean(),
            bannedWords: z.array(z.string()),
            action: z.enum(['flag', 'block', 'replace']),
            replacement: z.string(),
            caseSensitive: z.boolean(),
            matchWholeWord: z.boolean(),
        }),
        logger: z.object({
            enabled: z.boolean(),
            logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
            includeContent: z.boolean(),
            sensitiveFields: z.array(z.string()),
        }),
        metrics: z.object({
            enabled: z.boolean(),
            trackCounts: z.boolean(),
            trackPerformance: z.boolean(),
        }),
    }),
});

export type BuiltInMiddlewareConfig = z.infer<typeof BuiltInMiddlewareConfigSchema>;

export const DEFAULT_BUILT_IN_MIDDLEWARE_CONFIG: BuiltInMiddlewareConfig = {
    global: {
        botFilter: { enabled: true },
        rateLimiter: {
            enabled: false,
            windowMs: 60000,
            maxEvents: 10,
            block: true,
            key: 'userId',
            pruneIntervalMs: undefined,
        },
        profanityFilter: {
            enabled: false,
            bannedWords: [],
            action: 'flag',
            replacement: '***',
            caseSensitive: false,
            matchWholeWord: true,
        },
        logger: {
            enabled: false,
            logLevel: 'info',
            includeContent: false,
            sensitiveFields: [],
        },
        metrics: {
            enabled: false,
            trackCounts: true,
            trackPerformance: false,
        },
    },
};
