import { describe, expect, it, mock } from 'bun:test';
import type { EventMiddleware } from '@app/middleware/types';
import { runEventPipeline } from '@app/pipeline/event-pipeline';

const logger = {
    error: mock(() => {}),
};

type TestEvent = { type: 'TEST_EVENT' };

const createMiddleware = (
    name: string,
    onCall: (name: string) => void,
    callNext = true
): EventMiddleware<TestEvent> => ({
    name,
    priority: 0,
    execute: async (_event, next) => {
        onCall(name);
        if (callNext) {
            await next();
        }
    },
});

describe('runEventPipeline', () => {
    it('runs global middleware before plugin middleware and handler', async () => {
        const calls: string[] = [];
        const event: TestEvent = { type: 'TEST_EVENT' };

        const globalMiddleware = [createMiddleware('global', (name) => calls.push(name))];
        const pluginMiddleware = [createMiddleware('plugin', (name) => calls.push(name))];
        const handler = mock(() => {
            calls.push('handler');
        });

        await runEventPipeline({
            event,
            eventType: event.type,
            globalMiddleware,
            pluginMiddleware,
            handler,
            options: {
                logger,
            },
        });

        expect(calls).toEqual(['global', 'plugin', 'handler']);
    });

    it('supports short-circuiting in global middleware', async () => {
        const calls: string[] = [];
        const event: TestEvent = { type: 'TEST_EVENT' };

        const globalMiddleware = [createMiddleware('global', (name) => calls.push(name), false)];
        const pluginMiddleware = [createMiddleware('plugin', (name) => calls.push(name))];
        const handler = mock(() => {
            calls.push('handler');
        });

        await runEventPipeline({
            event,
            eventType: event.type,
            globalMiddleware,
            pluginMiddleware,
            handler,
            options: {
                logger,
            },
        });

        expect(calls).toEqual(['global']);
        expect(handler).toHaveBeenCalledTimes(0);
    });

    it('captures trace and duration when enabled', async () => {
        const event: TestEvent = { type: 'TEST_EVENT' };
        let completedContext = undefined as
            | {
                  durationMs?: number;
                  trace?: { stage: string; name: string }[];
              }
            | undefined;
        let currentTime = 0;
        const getTime = () => {
            currentTime += 5;
            return currentTime;
        };

        await runEventPipeline({
            event,
            eventType: event.type,
            globalMiddleware: [createMiddleware('global', () => {})],
            pluginMiddleware: [createMiddleware('plugin', () => {})],
            handler: () => {},
            options: {
                logger,
                enableTracing: true,
                getTime,
                onComplete: (context) => {
                    completedContext = context;
                },
            },
        });

        expect(completedContext).toBeDefined();
        expect(completedContext?.durationMs).toBeGreaterThanOrEqual(0);
        expect(completedContext?.trace?.map((entry) => entry.name)).toEqual(['global', 'plugin', 'handler']);
    });
});
