import { describe, expect, it } from 'bun:test';
import {
    BotFilterMiddleware,
    type BuiltInMiddlewareConfig,
    DEFAULT_BUILT_IN_MIDDLEWARE_CONFIG,
    LoggerMiddleware,
    MetricsMiddleware,
    ProfanityFilterMiddleware,
    RateLimiterMiddleware,
} from '@app/middleware/built-in';
import { loadGlobalMiddleware } from '@app/middleware/config-loader';

const baseConfig: BuiltInMiddlewareConfig = DEFAULT_BUILT_IN_MIDDLEWARE_CONFIG;

describe('loadGlobalMiddleware', () => {
    it('returns empty array when all middleware disabled', () => {
        const config: BuiltInMiddlewareConfig = {
            global: {
                botFilter: { enabled: false },
                rateLimiter: { ...baseConfig.global.rateLimiter, enabled: false },
                profanityFilter: { ...baseConfig.global.profanityFilter, enabled: false },
                logger: { ...baseConfig.global.logger, enabled: false },
                metrics: { ...baseConfig.global.metrics, enabled: false },
            },
        };

        const middleware = loadGlobalMiddleware(config);
        expect(middleware).toHaveLength(0);
    });

    it('enables selected middleware and preserves order', () => {
        const config: BuiltInMiddlewareConfig = {
            global: {
                botFilter: { enabled: true },
                rateLimiter: {
                    ...baseConfig.global.rateLimiter,
                    enabled: true,
                    windowMs: 1000,
                    maxEvents: 5,
                    block: true,
                    key: 'userId',
                },
                profanityFilter: {
                    ...baseConfig.global.profanityFilter,
                    enabled: true,
                    bannedWords: ['spam'],
                },
                logger: { ...baseConfig.global.logger, enabled: true },
                metrics: { ...baseConfig.global.metrics, enabled: true },
            },
        };

        const middleware = loadGlobalMiddleware(config);
        expect(middleware).toHaveLength(5);
        expect(middleware[0]).toBeInstanceOf(BotFilterMiddleware);
        expect(middleware[1]).toBeInstanceOf(RateLimiterMiddleware);
        expect(middleware[2]).toBeInstanceOf(ProfanityFilterMiddleware);
        expect(middleware[3]).toBeInstanceOf(LoggerMiddleware);
        expect(middleware[4]).toBeInstanceOf(MetricsMiddleware);
    });

    it('passes rate limiter options through to instance', () => {
        const config: BuiltInMiddlewareConfig = {
            global: {
                ...baseConfig.global,
                rateLimiter: {
                    ...baseConfig.global.rateLimiter,
                    enabled: true,
                    windowMs: 2000,
                    maxEvents: 3,
                    block: false,
                    pruneIntervalMs: 500,
                    key: 'channelId',
                },
            },
        };

        const middleware = loadGlobalMiddleware(config);
        const rateLimiter = middleware.find((mw) => mw instanceof RateLimiterMiddleware) as
            | RateLimiterMiddleware
            | undefined;
        expect(rateLimiter).toBeDefined();

        const options = (rateLimiter as unknown as { options: Record<string, unknown> }).options;
        expect(options.windowMs).toBe(2000);
        expect(options.maxEvents).toBe(3);
        expect(options.block).toBe(false);
        expect(options.pruneIntervalMs).toBe(500);
    });
});
