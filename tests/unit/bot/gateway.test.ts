import { describe, expect, it, mock } from 'bun:test';
import { GatewayAdapter } from '@app/bot/gateway';
import type { EventBus } from '@app/bus/types';
import type { Logger } from 'pino';

type ClientHandler = (...args: unknown[]) => void;

const createClientStub = () => {
    const handlers = new Map<string, ClientHandler[]>();

    return {
        handlers,
        client: {
            on(eventName: string, handler: ClientHandler) {
                const existing = handlers.get(eventName) ?? [];
                existing.push(handler);
                handlers.set(eventName, existing);
                return this;
            },
        },
    };
};

const createEventBusStub = (): EventBus => ({
    publish: mock(() => {}),
    subscribe: mock(() => {}),
    unsubscribe: mock(() => {}),
    addMiddleware: mock(() => {}),
    removeMiddleware: mock(() => {}),
    clearMiddleware: mock(() => {}),
    listMiddleware: mock(() => []),
});

const createLoggerStub = (): Logger =>
    ({
        debug: mock(() => {}),
        error: mock(() => {}),
    }) as unknown as Logger;

describe('GatewayAdapter', () => {
    it('registers debug listeners only when enabled', () => {
        const disabledClient = createClientStub();
        const disabledAdapter = new GatewayAdapter(disabledClient.client as never, createEventBusStub(), {
            debug: {
                enabled: false,
                events: ['guildCreate'],
            },
            logger: createLoggerStub(),
        });

        disabledAdapter.registerListeners();

        expect(disabledClient.handlers.has('guildCreate')).toBe(false);
        expect(disabledClient.handlers.has('messageCreate')).toBe(true);
        expect(disabledClient.handlers.has('guildMemberAdd')).toBe(true);

        const enabledClient = createClientStub();
        const enabledAdapter = new GatewayAdapter(enabledClient.client as never, createEventBusStub(), {
            debug: {
                enabled: true,
                events: ['guildCreate'],
            },
            logger: createLoggerStub(),
        });

        enabledAdapter.registerListeners();

        expect(enabledClient.handlers.has('guildCreate')).toBe(true);
    });

    it('logs structured debug payloads for guildCreate', () => {
        const { client, handlers } = createClientStub();
        const logger = createLoggerStub();
        const adapter = new GatewayAdapter(client as never, createEventBusStub(), {
            debug: {
                enabled: true,
                events: ['guildCreate'],
            },
            logger,
        });

        adapter.registerListeners();

        const guildCreateHandler = handlers.get('guildCreate')?.[0];
        expect(guildCreateHandler).toBeDefined();

        guildCreateHandler?.({
            id: 'guild-123',
            name: 'Debug Guild',
            memberCount: 42,
        });

        expect(logger.debug).toHaveBeenCalledTimes(1);
        expect(logger.debug).toHaveBeenCalledWith(
            expect.objectContaining({
                discordClientEvent: 'guildCreate',
                guildId: 'guild-123',
                metadata: expect.objectContaining({
                    guildName: 'Debug Guild',
                    memberCount: 42,
                }),
            }),
            'Observed Discord client event'
        );
    });

    it('catches debug payload errors and logs them instead of throwing', () => {
        const { client, handlers } = createClientStub();
        const logger = createLoggerStub();
        const adapter = new GatewayAdapter(client as never, createEventBusStub(), {
            debug: {
                enabled: true,
                events: ['guildCreate'],
            },
            logger,
        });

        adapter.registerListeners();

        const guildCreateHandler = handlers.get('guildCreate')?.[0];
        expect(guildCreateHandler).toBeDefined();

        expect(() => guildCreateHandler?.(undefined)).not.toThrow();
        expect(logger.debug).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(expect.anything(), 'Error capturing debug payload for guildCreate');
    });

    it('preserves normal MESSAGE_CREATE publishing when debug capture is enabled', () => {
        const { client, handlers } = createClientStub();
        const eventBus = createEventBusStub();
        const adapter = new GatewayAdapter(client as never, eventBus, {
            debug: {
                enabled: true,
                events: ['guildCreate'],
            },
            logger: createLoggerStub(),
        });

        adapter.registerListeners();

        const messageCreateHandler = handlers.get('messageCreate')?.[0];
        expect(messageCreateHandler).toBeDefined();

        messageCreateHandler?.({
            id: 'message-1',
            content: 'hello',
            createdTimestamp: 1000,
            author: {
                id: 'user-1',
                username: 'Alice',
                tag: 'Alice#0001',
                bot: false,
            },
            channelId: 'channel-1',
            guildId: 'guild-1',
        });

        expect(eventBus.publish).toHaveBeenCalledWith(
            'MESSAGE_CREATE',
            expect.objectContaining({
                type: 'MESSAGE_CREATE',
                messageId: 'message-1',
                userId: 'user-1',
                channelId: 'channel-1',
                serverId: 'guild-1',
            })
        );
    });
});
