import type { Config } from '@app/config';
import {
    BotFilterMiddleware,
    LoggerMiddleware,
    MetricsMiddleware,
    ProfanityFilterMiddleware,
    RateLimiterMiddleware,
} from '@app/middleware/built-in';
import type { AnyEventMiddleware } from '@app/middleware/types';
import type { BotEvent } from '@app/types';

type RateLimitKey = 'userId' | 'channelId' | 'serverId' | 'eventType' | 'global';

const keyGenerators: Record<RateLimitKey, (event: BotEvent) => string> = {
    userId: (event) => {
        const record = event as { userId?: string };
        return record.userId ?? 'unknown';
    },
    channelId: (event) => {
        const record = event as { channelId?: string };
        return record.channelId ?? 'unknown';
    },
    serverId: (event) => {
        const record = event as { serverId?: string };
        return record.serverId ?? 'unknown';
    },
    eventType: (event) => event.type,
    global: () => 'global',
};

export const loadGlobalMiddleware = (config: Config): AnyEventMiddleware[] => {
    const middleware: AnyEventMiddleware[] = [];
    const globalConfig = config.middleware.global;

    if (globalConfig.botFilter.enabled) {
        middleware.push(new BotFilterMiddleware());
    }

    if (globalConfig.rateLimiter.enabled) {
        const keyGenerator = keyGenerators[globalConfig.rateLimiter.key];
        middleware.push(
            new RateLimiterMiddleware({
                windowMs: globalConfig.rateLimiter.windowMs,
                maxEvents: globalConfig.rateLimiter.maxEvents,
                block: globalConfig.rateLimiter.block,
                pruneIntervalMs: globalConfig.rateLimiter.pruneIntervalMs,
                keyGenerator,
            })
        );
    }

    if (globalConfig.profanityFilter.enabled) {
        middleware.push(
            new ProfanityFilterMiddleware({
                bannedWords: globalConfig.profanityFilter.bannedWords,
                action: globalConfig.profanityFilter.action,
                replacement: globalConfig.profanityFilter.replacement,
                caseSensitive: globalConfig.profanityFilter.caseSensitive,
                matchWholeWord: globalConfig.profanityFilter.matchWholeWord,
            })
        );
    }

    if (globalConfig.logger.enabled) {
        middleware.push(
            new LoggerMiddleware({
                logLevel: globalConfig.logger.logLevel,
                includeContent: globalConfig.logger.includeContent,
                sensitiveFields: globalConfig.logger.sensitiveFields,
            })
        );
    }

    if (globalConfig.metrics.enabled) {
        middleware.push(
            new MetricsMiddleware({
                trackCounts: globalConfig.metrics.trackCounts,
                trackPerformance: globalConfig.metrics.trackPerformance,
            })
        );
    }

    return middleware;
};
