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

        expect(disabledClient.handlers.has('guildCreate')).toBe(true);
        expect(disabledClient.handlers.get('guildCreate')).toHaveLength(1);
        expect(disabledClient.handlers.has('guildDelete')).toBe(true);
        expect(disabledClient.handlers.get('guildDelete')).toHaveLength(1);
        expect(disabledClient.handlers.has('messageCreate')).toBe(true);
        expect(disabledClient.handlers.has('messageUpdate')).toBe(true);
        expect(disabledClient.handlers.has('messageDelete')).toBe(true);
        expect(disabledClient.handlers.has('presenceUpdate')).toBe(true);
        expect(disabledClient.handlers.has('guildMemberAdd')).toBe(true);
        expect(disabledClient.handlers.has('guildMemberRemove')).toBe(true);

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
        expect(enabledClient.handlers.get('guildCreate')).toHaveLength(2);
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

    it('publishes MEMBER_LEAVE when guildMemberRemove is enabled', () => {
        const { client, handlers } = createClientStub();
        const eventBus = createEventBusStub();
        const adapter = new GatewayAdapter(client as never, eventBus, {
            gatewayEvents: ['guildMemberRemove'],
            logger: createLoggerStub(),
        });

        adapter.registerListeners();

        expect(handlers.has('messageCreate')).toBe(false);
        expect(handlers.has('guildMemberAdd')).toBe(false);
        expect(handlers.has('guildMemberRemove')).toBe(true);

        const memberRemoveHandler = handlers.get('guildMemberRemove')?.[0];
        expect(memberRemoveHandler).toBeDefined();

        memberRemoveHandler?.({
            id: 'user-2',
            guild: {
                id: 'guild-9',
            },
            user: {
                username: 'Bob',
            },
        });

        expect(eventBus.publish).toHaveBeenCalledWith(
            'MEMBER_LEAVE',
            expect.objectContaining({
                type: 'MEMBER_LEAVE',
                userId: 'user-2',
                serverId: 'guild-9',
                username: 'Bob',
            })
        );
    });

    it('publishes GUILD_AVAILABLE when guildCreate is enabled', () => {
        const { client, handlers } = createClientStub();
        const eventBus = createEventBusStub();
        const adapter = new GatewayAdapter(client as never, eventBus, {
            gatewayEvents: ['guildCreate'],
            logger: createLoggerStub(),
        });

        adapter.registerListeners();

        expect(handlers.has('guildCreate')).toBe(true);
        expect(handlers.has('guildDelete')).toBe(false);

        const guildCreateHandler = handlers.get('guildCreate')?.[0];
        expect(guildCreateHandler).toBeDefined();

        guildCreateHandler?.({
            id: 'guild-available-1',
            name: 'Available Guild',
            memberCount: 22,
        });

        expect(eventBus.publish).toHaveBeenCalledWith(
            'GUILD_AVAILABLE',
            expect.objectContaining({
                type: 'GUILD_AVAILABLE',
                serverId: 'guild-available-1',
                guildName: 'Available Guild',
                memberCount: 22,
            })
        );
    });

    it('publishes GUILD_UNAVAILABLE when guildDelete is enabled', () => {
        const { client, handlers } = createClientStub();
        const eventBus = createEventBusStub();
        const adapter = new GatewayAdapter(client as never, eventBus, {
            gatewayEvents: ['guildDelete'],
            logger: createLoggerStub(),
        });

        adapter.registerListeners();

        expect(handlers.has('guildCreate')).toBe(false);
        expect(handlers.has('guildDelete')).toBe(true);

        const guildDeleteHandler = handlers.get('guildDelete')?.[0];
        expect(guildDeleteHandler).toBeDefined();

        guildDeleteHandler?.({
            id: 'guild-unavailable-1',
            name: 'Unavailable Guild',
            memberCount: 14,
            unavailable: true,
        });

        expect(eventBus.publish).toHaveBeenCalledWith(
            'GUILD_UNAVAILABLE',
            expect.objectContaining({
                type: 'GUILD_UNAVAILABLE',
                serverId: 'guild-unavailable-1',
                guildName: 'Unavailable Guild',
                memberCount: 14,
                unavailable: true,
            })
        );
    });

    it('publishes MESSAGE_UPDATE when messageUpdate is enabled', () => {
        const { client, handlers } = createClientStub();
        const eventBus = createEventBusStub();
        const adapter = new GatewayAdapter(client as never, eventBus, {
            gatewayEvents: ['messageUpdate'],
            logger: createLoggerStub(),
        });

        adapter.registerListeners();

        expect(handlers.has('messageCreate')).toBe(false);
        expect(handlers.has('messageUpdate')).toBe(true);
        expect(handlers.has('messageDelete')).toBe(false);

        const messageUpdateHandler = handlers.get('messageUpdate')?.[0];
        expect(messageUpdateHandler).toBeDefined();

        messageUpdateHandler?.(
            {
                id: 'message-7',
                channelId: 'channel-7',
                guildId: 'guild-7',
                content: 'before',
            },
            {
                id: 'message-7',
                channelId: 'channel-7',
                guildId: 'guild-7',
                content: 'after',
                editedTimestamp: 5000,
                author: {
                    id: 'user-7',
                },
            }
        );

        expect(eventBus.publish).toHaveBeenCalledWith(
            'MESSAGE_UPDATE',
            expect.objectContaining({
                type: 'MESSAGE_UPDATE',
                messageId: 'message-7',
                channelId: 'channel-7',
                serverId: 'guild-7',
                userId: 'user-7',
                authorId: 'user-7',
                content: 'after',
                editedAt: 5000,
            })
        );
    });

    it('publishes PRESENCE_UPDATE when presenceUpdate is enabled', () => {
        const { client, handlers } = createClientStub();
        const eventBus = createEventBusStub();
        const adapter = new GatewayAdapter(client as never, eventBus, {
            gatewayEvents: ['presenceUpdate'],
            logger: createLoggerStub(),
        });

        adapter.registerListeners();

        expect(handlers.has('presenceUpdate')).toBe(true);
        expect(handlers.has('messageCreate')).toBe(false);

        const presenceUpdateHandler = handlers.get('presenceUpdate')?.[0];
        expect(presenceUpdateHandler).toBeDefined();

        presenceUpdateHandler?.(
            {
                userId: 'user-5',
                status: 'offline',
                guild: { id: 'guild-5' },
                clientStatus: { web: 'offline' },
                activities: [{ name: 'Before', type: 0 }],
            },
            {
                userId: 'user-5',
                status: 'online',
                guild: { id: 'guild-5' },
                clientStatus: { desktop: 'online' },
                activities: [{ name: 'After', type: 2 }],
            }
        );

        expect(eventBus.publish).toHaveBeenCalledWith(
            'PRESENCE_UPDATE',
            expect.objectContaining({
                type: 'PRESENCE_UPDATE',
                userId: 'user-5',
                serverId: 'guild-5',
                oldStatus: 'offline',
                newStatus: 'online',
                newActivityNames: ['After'],
                newActivityTypes: [2],
            })
        );
    });

    it('publishes MESSAGE_DELETE when messageDelete is enabled', () => {
        const { client, handlers } = createClientStub();
        const eventBus = createEventBusStub();
        const adapter = new GatewayAdapter(client as never, eventBus, {
            gatewayEvents: ['messageDelete'],
            logger: createLoggerStub(),
        });

        adapter.registerListeners();

        expect(handlers.has('messageCreate')).toBe(false);
        expect(handlers.has('messageDelete')).toBe(true);
        expect(handlers.has('guildMemberAdd')).toBe(false);
        expect(handlers.has('guildMemberRemove')).toBe(false);

        const messageDeleteHandler = handlers.get('messageDelete')?.[0];
        expect(messageDeleteHandler).toBeDefined();

        messageDeleteHandler?.({
            id: 'message-2',
            channelId: 'channel-9',
            guildId: 'guild-3',
            author: {
                id: 'user-9',
            },
        });

        expect(eventBus.publish).toHaveBeenCalledWith(
            'MESSAGE_DELETE',
            expect.objectContaining({
                type: 'MESSAGE_DELETE',
                messageId: 'message-2',
                channelId: 'channel-9',
                serverId: 'guild-3',
                userId: 'user-9',
                authorId: 'user-9',
            })
        );
    });

    it('logs messageDelete normalization errors instead of throwing', () => {
        const { client, handlers } = createClientStub();
        const logger = createLoggerStub();
        const adapter = new GatewayAdapter(client as never, createEventBusStub(), {
            gatewayEvents: ['messageDelete'],
            logger,
        });

        adapter.registerListeners();

        const messageDeleteHandler = handlers.get('messageDelete')?.[0];
        expect(messageDeleteHandler).toBeDefined();

        expect(() => messageDeleteHandler?.({ id: 'message-3' })).not.toThrow();
        expect(logger.error).toHaveBeenCalledWith(expect.anything(), 'Error normalizing messageDelete event');
    });

    it('logs guildDelete normalization errors instead of throwing', () => {
        const { client, handlers } = createClientStub();
        const logger = createLoggerStub();
        const adapter = new GatewayAdapter(client as never, createEventBusStub(), {
            gatewayEvents: ['guildDelete'],
            logger,
        });

        adapter.registerListeners();

        const guildDeleteHandler = handlers.get('guildDelete')?.[0];
        expect(guildDeleteHandler).toBeDefined();

        expect(() => guildDeleteHandler?.({ id: 'guild-delete-bad' })).not.toThrow();
        expect(logger.error).toHaveBeenCalledWith(expect.anything(), 'Error normalizing guildDelete event');
    });

    it('logs messageUpdate normalization errors instead of throwing', () => {
        const { client, handlers } = createClientStub();
        const logger = createLoggerStub();
        const adapter = new GatewayAdapter(client as never, createEventBusStub(), {
            gatewayEvents: ['messageUpdate'],
            logger,
        });

        adapter.registerListeners();

        const messageUpdateHandler = handlers.get('messageUpdate')?.[0];
        expect(messageUpdateHandler).toBeDefined();

        expect(() => messageUpdateHandler?.({ id: 'message-9' }, { id: 'message-9' })).not.toThrow();
        expect(logger.error).toHaveBeenCalledWith(expect.anything(), 'Error normalizing messageUpdate event');
    });

    it('logs presenceUpdate normalization errors instead of throwing', () => {
        const { client, handlers } = createClientStub();
        const logger = createLoggerStub();
        const adapter = new GatewayAdapter(client as never, createEventBusStub(), {
            gatewayEvents: ['presenceUpdate'],
            logger,
        });

        adapter.registerListeners();

        const presenceUpdateHandler = handlers.get('presenceUpdate')?.[0];
        expect(presenceUpdateHandler).toBeDefined();

        expect(() =>
            presenceUpdateHandler?.(null, {
                userId: 'user-6',
                status: 'online',
                activities: [],
            })
        ).not.toThrow();
        expect(logger.error).toHaveBeenCalledWith(expect.anything(), 'Error normalizing presenceUpdate event');
    });
});
