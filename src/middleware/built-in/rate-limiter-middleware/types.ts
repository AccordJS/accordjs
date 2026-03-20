import type { BotEvent } from '@app/types';

export interface RateLimitState {
    count: number;
    remaining: number;
    resetAt: number;
}

export interface RateLimiterOptions<TEvent = BotEvent> {
    windowMs: number;
    maxEvents: number;
    keyGenerator: (event: TEvent) => string;
    block?: boolean;
    getTime?: () => number;
    onLimit?: (event: TEvent, state: RateLimitState) => void;
    pruneIntervalMs?: number;
    skip?: (event: TEvent) => boolean;
}

export type RateLimitKey = 'userId' | 'channelId' | 'serverId' | 'eventType' | 'global';
