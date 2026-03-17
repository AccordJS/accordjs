import { describe, expect, it, mock } from 'bun:test';
import { LoggerMiddleware } from '@app/middleware/built-in/logger-middleware';
import type { Logger } from 'pino';

type TestEvent = { type: 'MESSAGE_CREATE'; content: string; token: string };

describe('LoggerMiddleware', () => {
    it('redacts sensitive fields and content when configured', async () => {
        const info = mock((..._args: unknown[]) => {});
        const logger = { info } as unknown as Logger;
        const middleware = new LoggerMiddleware<TestEvent>({
            logger,
            logLevel: 'info',
            includeContent: false,
            sensitiveFields: ['token'],
        });
        const next = mock(async () => {});
        const event: TestEvent = { type: 'MESSAGE_CREATE', content: 'hello', token: 'secret' };

        await middleware.execute(event, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(info).toHaveBeenCalledTimes(1);
        const call = info.mock.calls[0];
        if (!call) {
            throw new Error('Expected logger to be called');
        }
        const [payload, message] = call as unknown as [unknown, unknown];
        const loggedEvent = (payload as { event?: Record<string, unknown> }).event;
        expect(loggedEvent?.content).toBe('[REDACTED]');
        expect(loggedEvent?.token).toBe('[REDACTED]');
        expect(message as string).toBe('Event received');
    });
});
