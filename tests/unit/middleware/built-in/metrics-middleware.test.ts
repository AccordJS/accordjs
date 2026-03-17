import { describe, expect, it, mock } from 'bun:test';
import { MetricsMiddleware } from '@app/middleware/built-in/metrics-middleware';

type TestEvent = { type: 'MESSAGE_CREATE' };

describe('MetricsMiddleware', () => {
    it('tracks counts and performance metrics', async () => {
        let now = 0;
        const getTime = () => now;
        const middleware = new MetricsMiddleware<TestEvent>({
            trackCounts: true,
            trackPerformance: true,
            getTime,
        });
        const next = mock(async () => {
            now += 5;
        });
        const event: TestEvent = { type: 'MESSAGE_CREATE' };

        now = 0;
        await middleware.execute(event, next);
        await middleware.execute(event, next);

        const metrics = middleware.getMetrics();
        expect(metrics.counts.MESSAGE_CREATE).toBe(2);
        const performance = metrics.performance.MESSAGE_CREATE;
        if (!performance) {
            throw new Error('Expected performance metrics to be defined');
        }
        expect(performance.count).toBe(2);
        expect(performance.avgMs).toBe(5);
    });
});
