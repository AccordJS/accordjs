import { BaseMiddleware } from '@app/middleware/base-middleware';
import type { BotEvent } from '@app/types';

export interface PerformanceMetric {
    count: number;
    totalMs: number;
    minMs: number;
    maxMs: number;
}

export interface MetricsSnapshot {
    counts: Record<string, number>;
    performance: Record<string, PerformanceMetric & { avgMs: number }>;
}

export interface MetricsMiddlewareOptions {
    trackCounts?: boolean;
    trackPerformance?: boolean;
    getTime?: () => number;
    onRecord?: (snapshot: MetricsSnapshot) => void;
}

export class MetricsMiddleware<TEvent = BotEvent> extends BaseMiddleware<TEvent> {
    private counts = new Map<string, number>();
    private performance = new Map<string, PerformanceMetric>();
    private trackCounts: boolean;
    private trackPerformance: boolean;
    private getTime: () => number;
    private onRecord?: (snapshot: MetricsSnapshot) => void;

    constructor(options: MetricsMiddlewareOptions = {}) {
        super();
        this.trackCounts = options.trackCounts ?? true;
        this.trackPerformance = options.trackPerformance ?? false;
        this.getTime = options.getTime ?? Date.now;
        this.onRecord = options.onRecord;
    }

    public override async execute(event: TEvent, next: () => Promise<void>): Promise<void> {
        const eventType = this.getEventType(event);
        if (this.trackCounts) {
            this.counts.set(eventType, (this.counts.get(eventType) ?? 0) + 1);
        }

        if (this.trackPerformance) {
            const startedAt = this.getTime();
            try {
                await next();
            } finally {
                const durationMs = this.getTime() - startedAt;
                this.updatePerformance(eventType, durationMs);
                this.onRecord?.(this.getMetrics());
            }
            return;
        }

        try {
            await next();
        } finally {
            this.onRecord?.(this.getMetrics());
        }
    }

    public getMetrics(): MetricsSnapshot {
        const counts: Record<string, number> = {};
        for (const [eventType, count] of this.counts.entries()) {
            counts[eventType] = count;
        }

        const performance: Record<string, PerformanceMetric & { avgMs: number }> = {};
        for (const [eventType, metric] of this.performance.entries()) {
            performance[eventType] = {
                ...metric,
                avgMs: metric.count === 0 ? 0 : metric.totalMs / metric.count,
            };
        }

        return { counts, performance };
    }

    private updatePerformance(eventType: string, durationMs: number): void {
        const current = this.performance.get(eventType);
        if (!current) {
            this.performance.set(eventType, {
                count: 1,
                totalMs: durationMs,
                minMs: durationMs,
                maxMs: durationMs,
            });
            return;
        }

        current.count += 1;
        current.totalMs += durationMs;
        current.minMs = Math.min(current.minMs, durationMs);
        current.maxMs = Math.max(current.maxMs, durationMs);
    }

    private getEventType(event: TEvent): string {
        const record = event as { type?: unknown };
        return typeof record.type === 'string' ? record.type : 'unknown';
    }
}
