import { describe, expect, it, mock } from 'bun:test';
import { BotFilterMiddleware } from '@app/middleware/built-in/bot-filter-middleware';

type TestEvent = { type: 'MESSAGE_CREATE'; isBot?: boolean };

describe('BotFilterMiddleware', () => {
    it('skips bot events', async () => {
        const middleware = new BotFilterMiddleware<TestEvent>();
        const next = mock(async () => {});
        const event: TestEvent = { type: 'MESSAGE_CREATE', isBot: true };

        await middleware.execute(event, next);

        expect(next).toHaveBeenCalledTimes(0);
    });

    it('allows non-bot events', async () => {
        const middleware = new BotFilterMiddleware<TestEvent>();
        const next = mock(async () => {});
        const event: TestEvent = { type: 'MESSAGE_CREATE', isBot: false };

        await middleware.execute(event, next);

        expect(next).toHaveBeenCalledTimes(1);
    });
});
