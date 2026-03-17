import { describe, expect, it, mock } from 'bun:test';
import type { EventBus } from '@app/bus/types';
import { registerMappedHandlers } from '@app/plugins/event-mapper';
import type { MessageCreateEvent } from '@app/types';

describe('registerMappedHandlers', () => {
    it('registers mapped handlers and binds them to the plugin', () => {
        let registeredHandler: ((event: MessageCreateEvent) => void | Promise<void>) | undefined;
        let registeredEventType: string | undefined;
        const subscribe = mock((type, handler) => {
            registeredEventType = type as string;
            registeredHandler = handler as (event: MessageCreateEvent) => void | Promise<void>;
        });
        const eventBus = {
            subscribe,
        } as unknown as EventBus;

        const handler = mock(() => {});
        const plugin = {
            name: 'TestPlugin',
            handleMessage: handler,
        };

        registerMappedHandlers(plugin, eventBus, {
            handleMessage: 'MESSAGE_CREATE',
        });

        expect(subscribe).toHaveBeenCalledTimes(1);
        expect(registeredEventType).toBe('MESSAGE_CREATE');
        expect(registeredHandler).toBeDefined();

        const event: MessageCreateEvent = {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            messageId: '123',
            channelId: '456',
            userId: '789',
            content: 'Hello',
            authorName: 'User',
            authorTag: 'User#0001',
            isBot: false,
        };

        registeredHandler?.(event);
        expect(handler).toHaveBeenCalledWith(event);
    });

    it('logs missing handlers when not suppressed', () => {
        const subscribe = mock(() => {});
        const eventBus = {
            subscribe,
        } as unknown as EventBus;

        const logger = {
            warn: mock(() => {}),
            error: mock(() => {}),
        };

        registerMappedHandlers({ name: 'MissingPlugin' }, eventBus, { missingMethod: 'MESSAGE_CREATE' }, { logger });

        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(subscribe).toHaveBeenCalledTimes(0);
    });

    it('supports multiple handlers mapped to the same event', () => {
        const subscribe = mock(() => {});
        const eventBus = {
            subscribe,
        } as unknown as EventBus;

        const plugin = {
            name: 'MultiPlugin',
            handleFirst: mock(() => {}),
            handleSecond: mock(() => {}),
        };

        registerMappedHandlers(plugin, eventBus, {
            handleFirst: 'MESSAGE_CREATE',
            handleSecond: 'MESSAGE_CREATE',
        });

        expect(subscribe).toHaveBeenCalledTimes(2);
    });
});
