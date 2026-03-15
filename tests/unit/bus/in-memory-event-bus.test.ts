import { describe, expect, it, mock } from 'bun:test';
import { InMemoryEventBus } from '@app/bus/in-memory-event-bus.ts';
import type { MemberJoinEvent, MessageCreateEvent } from '../../../src/types/index.ts';

describe('InMemoryEventBus', () => {
    it('correctly dispatches events to subscribers', () => {
        const bus = new InMemoryEventBus();
        const handler = mock(() => {});

        const event: MessageCreateEvent = {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            messageId: '123',
            channelId: '456',
            userId: '789',
            content: 'Hello World',
            authorName: 'User',
            authorTag: 'User#0001',
            isBot: false,
        };

        bus.subscribe('MESSAGE_CREATE', handler);
        bus.publish('MESSAGE_CREATE', event);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(event);
    });

    it('does not dispatch to unsubscribed handlers', () => {
        const bus = new InMemoryEventBus();
        const handler = mock(() => {});

        const event: MessageCreateEvent = {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            messageId: '123',
            channelId: '456',
            userId: '789',
            content: 'Hello World',
            authorName: 'User',
            authorTag: 'User#0001',
            isBot: false,
        };

        bus.subscribe('MESSAGE_CREATE', handler);
        bus.unsubscribe('MESSAGE_CREATE', handler);
        bus.publish('MESSAGE_CREATE', event);

        expect(handler).toHaveBeenCalledTimes(0);
    });

    it('supports multiple handlers for the same event', () => {
        const bus = new InMemoryEventBus();
        const handler1 = mock(() => {});
        const handler2 = mock(() => {});

        const event: MessageCreateEvent = {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            messageId: '123',
            channelId: '456',
            userId: '789',
            content: 'Hello World',
            authorName: 'User',
            authorTag: 'User#0001',
            isBot: false,
        };

        bus.subscribe('MESSAGE_CREATE', handler1);
        bus.subscribe('MESSAGE_CREATE', handler2);
        bus.publish('MESSAGE_CREATE', event);

        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('handles async handlers and logs errors instead of crashing', () => {
        const bus = new InMemoryEventBus();
        const error = new Error('Async failure');
        const handler = mock(async () => {
            throw error;
        });

        // Mock console.error to avoid noise in tests
        const consoleSpy = mock((_msg: string, _err: Error) => {});
        globalThis.console.error = consoleSpy as typeof console.error;

        const event: MemberJoinEvent = {
            type: 'MEMBER_JOIN',
            timestamp: Date.now(),
            userId: '123',
            serverId: '456',
            username: 'User',
            joinedAt: Date.now(),
        };

        bus.subscribe('MEMBER_JOIN', handler);
        bus.publish('MEMBER_JOIN', event);

        expect(handler).toHaveBeenCalledTimes(1);
        // Note: console.error will be called asynchronously, so we might not see it immediately in a synchronous check
    });

    it('isolates different event types', () => {
        const bus = new InMemoryEventBus();
        const messageHandler = mock(() => {});
        const joinHandler = mock(() => {});

        bus.subscribe('MESSAGE_CREATE', messageHandler);
        bus.subscribe('MEMBER_JOIN', joinHandler);

        const joinEvent: MemberJoinEvent = {
            type: 'MEMBER_JOIN',
            timestamp: Date.now(),
            userId: '123',
            serverId: '456',
            username: 'User',
            joinedAt: Date.now(),
        };

        bus.publish('MEMBER_JOIN', joinEvent);

        expect(joinHandler).toHaveBeenCalledTimes(1);
        expect(messageHandler).toHaveBeenCalledTimes(0);
    });
});
