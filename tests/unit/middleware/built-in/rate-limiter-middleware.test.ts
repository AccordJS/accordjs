import { describe, expect, it, mock } from 'bun:test';
import { RateLimiterMiddleware } from '@app/middleware/built-in/rate-limiter-middleware';

type TestEvent = { type: 'MESSAGE_CREATE'; userId: string };

describe('RateLimiterMiddleware', () => {
    it('blocks events over the limit within the window', async () => {
        let now = 0;
        const getTime = () => now;
        const middleware = new RateLimiterMiddleware<TestEvent>({
            windowMs: 1000,
            maxEvents: 2,
            keyGenerator: (event) => event.userId,
            getTime,
        });
        const next = mock(async () => {});
        const event: TestEvent = { type: 'MESSAGE_CREATE', userId: 'user-1' };

        now = 0;
        await middleware.execute(event, next);
        now = 100;
        await middleware.execute(event, next);
        now = 200;
        await middleware.execute(event, next);

        expect(next).toHaveBeenCalledTimes(2);
    });

    it('allows events again after the window expires', async () => {
        let now = 0;
        const getTime = () => now;
        const middleware = new RateLimiterMiddleware<TestEvent>({
            windowMs: 1000,
            maxEvents: 1,
            keyGenerator: (event) => event.userId,
            getTime,
        });
        const next = mock(async () => {});
        const event: TestEvent = { type: 'MESSAGE_CREATE', userId: 'user-1' };

        now = 0;
        await middleware.execute(event, next);
        now = 500;
        await middleware.execute(event, next);
        now = 2000;
        await middleware.execute(event, next);

        expect(next).toHaveBeenCalledTimes(2);
    });
});
