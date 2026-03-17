import { describe, expect, it, mock } from 'bun:test';
import { runMiddlewareChain } from '@app/middleware/middleware-runner';
import type { EventMiddleware } from '@app/middleware/types';

type TestEvent = { type: 'TEST_EVENT' };

const createMiddleware = (
    name: string,
    priority: number,
    handler: (event: TestEvent, next: () => Promise<void>) => void | Promise<void>
): EventMiddleware<TestEvent> => ({
    name,
    priority,
    execute: handler,
});

describe('runMiddlewareChain', () => {
    it('runs middleware in priority order before the handler', async () => {
        const calls: string[] = [];
        const event: TestEvent = { type: 'TEST_EVENT' };

        const middleware = [
            createMiddleware('Third', 20, async (_event, next) => {
                calls.push('third');
                await next();
            }),
            createMiddleware('First', 0, async (_event, next) => {
                calls.push('first');
                await next();
            }),
            createMiddleware('Second', 10, async (_event, next) => {
                calls.push('second');
                await next();
            }),
        ];

        await runMiddlewareChain(event, middleware, () => {
            calls.push('handler');
        });

        expect(calls).toEqual(['first', 'second', 'third', 'handler']);
    });

    it('allows middleware to short-circuit the chain', async () => {
        const event: TestEvent = { type: 'TEST_EVENT' };
        const handler = mock(() => {});

        const middleware = [
            createMiddleware('Stop', 0, () => {
                // Do not call next()
            }),
        ];

        await runMiddlewareChain(event, middleware, handler);

        expect(handler).toHaveBeenCalledTimes(0);
    });

    it('logs errors from middleware and continues without throwing', async () => {
        const event: TestEvent = { type: 'TEST_EVENT' };
        const handler = mock(() => {});
        const logger = { error: mock(() => {}) };

        const middleware = [
            createMiddleware('Thrower', 0, () => {
                throw new Error('boom');
            }),
        ];

        await runMiddlewareChain(event, middleware, handler, logger);

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledTimes(0);
    });

    it('logs errors from handlers without throwing', async () => {
        const event: TestEvent = { type: 'TEST_EVENT' };
        const logger = { error: mock(() => {}) };

        await runMiddlewareChain(
            event,
            [],
            () => {
                throw new Error('handler failure');
            },
            logger
        );

        expect(logger.error).toHaveBeenCalledTimes(1);
    });
});
