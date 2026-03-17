import { describe, expect, it, mock } from 'bun:test';
import { InMemoryEventBus } from '@app/bus/in-memory-event-bus';
import { BaseMiddleware } from '@app/middleware/base-middleware';
import type { MessageCreateEvent } from '@app/types';

let order: string[] = [];

class OrderMiddleware extends BaseMiddleware<MessageCreateEvent> {
    public override async execute(_event: MessageCreateEvent, next: () => Promise<void>): Promise<void> {
        order.push('middleware');
        await next();
    }
}

class StopMiddleware extends BaseMiddleware<MessageCreateEvent> {
    public override async execute(_event: MessageCreateEvent, _next: () => Promise<void>): Promise<void> {
        order.push('stop');
    }
}

const createEvent = (): MessageCreateEvent => ({
    type: 'MESSAGE_CREATE',
    timestamp: Date.now(),
    messageId: '123',
    channelId: '456',
    userId: '789',
    content: 'Hello World',
    authorName: 'User',
    authorTag: 'User#0001',
    isBot: false,
});

describe('InMemoryEventBus middleware integration', () => {
    it('runs global middleware before handlers', async () => {
        order = [];
        const bus = new InMemoryEventBus();
        const handler = mock(() => {
            order.push('handler');
        });

        bus.addMiddleware(new OrderMiddleware());
        bus.subscribe('MESSAGE_CREATE', handler);
        bus.publish('MESSAGE_CREATE', createEvent());

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(order).toEqual(['middleware', 'handler']);
    });

    it('allows middleware to stop handler execution', async () => {
        order = [];
        const bus = new InMemoryEventBus();
        const handler = mock(() => {
            order.push('handler');
        });

        bus.addMiddleware(new StopMiddleware());
        bus.subscribe('MESSAGE_CREATE', handler);
        bus.publish('MESSAGE_CREATE', createEvent());

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(handler).toHaveBeenCalledTimes(0);
        expect(order).toEqual(['stop']);
    });
});
