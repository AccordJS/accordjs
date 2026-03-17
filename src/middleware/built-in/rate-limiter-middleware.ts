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
    pruneIntervalMs?: number;
    skip?: (event: TEvent) => boolean;
}

export class RateLimiterMiddleware<TEvent = BotEvent> extends BaseMiddleware<TEvent> {
    private buckets = new Map<string, number[]>();
    private getTime: () => number;
    private lastPruneAt = 0;

    constructor(private options: RateLimiterOptions<TEvent>) {
        super();
        this.getTime = options.getTime ?? Date.now;
    }

    public override async execute(event: TEvent, next: () => Promise<void>): Promise<void> {
        const now = this.getTime();
        const windowStart = now - this.options.windowMs;
        this.pruneBuckets(now, windowStart);

        if (this.options.skip?.(event)) {
            await next();
            return;
        }

        const key = this.options.keyGenerator(event);
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
                this.buckets.set(key, recent);
                return;
            }

            recent.push(now);
            this.buckets.set(key, recent);
            await next();
            return;
        }

        recent.push(now);
        this.buckets.set(key, recent);

        await next();
    }

    private pruneBuckets(now: number, windowStart: number): void {
        const pruneInterval = this.options.pruneIntervalMs ?? this.options.windowMs;
        if (pruneInterval <= 0 || now - this.lastPruneAt < pruneInterval) {
            return;
        }

        this.lastPruneAt = now;

        for (const [key, timestamps] of this.buckets) {
            const recent = timestamps.filter((timestamp) => timestamp > windowStart);
            if (recent.length === 0) {
                this.buckets.delete(key);
            } else {
                this.buckets.set(key, recent);
            }
        }
    }
}
