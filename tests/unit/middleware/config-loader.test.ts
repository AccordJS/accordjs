import { describe, expect, it } from 'bun:test';
import { type Config, DEFAULT_MIDDLEWARE_CONFIG } from '@app/config';
import {
    BotFilterMiddleware,
    LoggerMiddleware,
    MetricsMiddleware,
    ProfanityFilterMiddleware,
    RateLimiterMiddleware,
} from '@app/middleware/built-in';
import { loadGlobalMiddleware } from '@app/middleware/config-loader';

const baseConfig: Config = {
    env: 'test',
    log: { level: 'info' },
    discord: { token: 'x', clientId: 'y' },
    middleware: DEFAULT_MIDDLEWARE_CONFIG,
};

describe('loadGlobalMiddleware', () => {
    it('returns empty array when all middleware disabled', () => {
        const config: Config = {
            ...baseConfig,
            middleware: {
                global: {
                    botFilter: { enabled: false },
                    rateLimiter: { ...DEFAULT_MIDDLEWARE_CONFIG.global.rateLimiter, enabled: false },
                    profanityFilter: { ...DEFAULT_MIDDLEWARE_CONFIG.global.profanityFilter, enabled: false },
                    logger: { ...DEFAULT_MIDDLEWARE_CONFIG.global.logger, enabled: false },
                    metrics: { ...DEFAULT_MIDDLEWARE_CONFIG.global.metrics, enabled: false },
                },
            },
        };

        const middleware = loadGlobalMiddleware(config);
        expect(middleware).toHaveLength(0);
    });

    it('enables selected middleware and preserves order', () => {
        const config: Config = {
            ...baseConfig,
            middleware: {
                global: {
                    botFilter: { enabled: true },
                    rateLimiter: {
                        ...DEFAULT_MIDDLEWARE_CONFIG.global.rateLimiter,
                        enabled: true,
                        windowMs: 1000,
                        maxEvents: 5,
                        block: true,
                        key: 'userId',
                    },
                    profanityFilter: {
                        ...DEFAULT_MIDDLEWARE_CONFIG.global.profanityFilter,
                        enabled: true,
                        bannedWords: ['spam'],
                    },
                    logger: { ...DEFAULT_MIDDLEWARE_CONFIG.global.logger, enabled: true },
                    metrics: { ...DEFAULT_MIDDLEWARE_CONFIG.global.metrics, enabled: true },
                },
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
        const config: Config = {
            ...baseConfig,
            middleware: {
                global: {
                    ...DEFAULT_MIDDLEWARE_CONFIG.global,
                    rateLimiter: {
                        ...DEFAULT_MIDDLEWARE_CONFIG.global.rateLimiter,
                        enabled: true,
                        windowMs: 2000,
                        maxEvents: 3,
                        block: false,
                        pruneIntervalMs: 500,
                        key: 'channelId',
                    },
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
