import { BaseMiddleware } from '@app/middleware/base-middleware';
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
    skip?: (event: TEvent) => boolean;
}

export class RateLimiterMiddleware<TEvent = BotEvent> extends BaseMiddleware<TEvent> {
    private buckets = new Map<string, number[]>();
    private getTime: () => number;

    constructor(private options: RateLimiterOptions<TEvent>) {
        super();
        this.getTime = options.getTime ?? Date.now;
    }

    public override async execute(event: TEvent, next: () => Promise<void>): Promise<void> {
        if (this.options.skip?.(event)) {
            await next();
            return;
        }

        const key = this.options.keyGenerator(event);
        const now = this.getTime();
        const windowStart = now - this.options.windowMs;
        const timestamps = this.buckets.get(key) ?? [];
        const recent = timestamps.filter((timestamp) => timestamp > windowStart);

        if (recent.length >= this.options.maxEvents) {
            const resetAt = (recent[0] ?? now) + this.options.windowMs;
            const state: RateLimitState = {
                count: recent.length,
                remaining: 0,
                resetAt,
            };

            this.options.onLimit?.(event, state);

            if (this.options.block !== false) {
                return;
            }

            await next();
            return;
        }

        recent.push(now);
        this.buckets.set(key, recent);

        await next();
    }
}
