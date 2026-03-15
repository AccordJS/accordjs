import { describe, expect, it, mock } from 'bun:test';
import { InMemoryEventBus } from '@app/bus/in-memory-event-bus';
import type { Config } from '@app/config';
import { CommandRouterPlugin } from '@app/plugins/commands/command-router';
import type { PluginContext } from '@app/types';
import type { CommandDispatchEvent, CommandErrorEvent, CommandExecuteEvent } from '@app/types/events';
import { createLogger } from '@app/utils/create-logger';

describe('CommandRouterPlugin', () => {
    const createMockContext = (): PluginContext => ({
        eventBus: new InMemoryEventBus(),
        config: {
            env: 'test',
            log: { level: 'info' },
            discord: { token: 'test', clientId: 'test' },
        } as Config,
        logger: createLogger('Test'),
    });

    it('should dispatch registered command when matching message is published', async () => {
        const context = createMockContext();
        const router = new CommandRouterPlugin();
        const executeMock = mock(async () => {});

        router.registerCommand({
            name: 'ping',
            description: 'Ping',
            execute: executeMock,
        });

        await router.register(context);

        // Publish a message that should trigger the command
        await context.eventBus.publish('MESSAGE_CREATE', {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            userId: 'user-1',
            channelId: 'chan-1',
            messageId: 'msg-1',
            content: '!ping arg1 arg2',
            authorName: 'User',
            authorTag: 'User#0001',
            isBot: false,
        });

        expect(executeMock).toHaveBeenCalledTimes(1);
        expect(executeMock).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }), ['arg1', 'arg2']);
    });

    it('should publish lifecycle events during command execution', async () => {
        const context = createMockContext();
        const router = new CommandRouterPlugin();
        const events: (CommandDispatchEvent | CommandExecuteEvent)[] = [];

        context.eventBus.subscribe('COMMAND_DISPATCH', (e) => {
            events.push(e);
        });
        context.eventBus.subscribe('COMMAND_EXECUTE', (e) => {
            events.push(e);
        });

        router.registerCommand({
            name: 'ping',
            description: 'Ping',
            execute: async () => {},
        });

        await router.register(context);

        await context.eventBus.publish('MESSAGE_CREATE', {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            userId: 'u1',
            channelId: 'c1',
            messageId: 'm1',
            content: '!ping',
            authorName: 'U',
            authorTag: 'U#1',
            isBot: false,
        });

        expect(events.map((e) => e.type)).toEqual(['COMMAND_DISPATCH', 'COMMAND_EXECUTE']);
        expect(events[0]?.commandName).toBe('ping');
    });

    it('should publish error event if command execution fails', async () => {
        const context = createMockContext();
        const router = new CommandRouterPlugin();
        const events: CommandErrorEvent[] = [];

        context.eventBus.subscribe('COMMAND_ERROR', (e) => {
            events.push(e);
        });

        router.registerCommand({
            name: 'fail',
            description: 'Fails',
            execute: async () => {
                throw new Error('Planned failure');
            },
        });

        await router.register(context);

        await context.eventBus.publish('MESSAGE_CREATE', {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            userId: 'u1',
            channelId: 'c1',
            messageId: 'm1',
            content: '!fail',
            authorName: 'U',
            authorTag: 'U#1',
            isBot: false,
        });

        expect(events).toHaveLength(1);
        expect(events[0]?.type).toBe('COMMAND_ERROR');
        expect(events[0]?.error).toBe('Planned failure');
    });

    it('should ignore bot messages', async () => {
        const context = createMockContext();
        const router = new CommandRouterPlugin();
        const executeMock = mock(async () => {});

        router.registerCommand({
            name: 'ping',
            description: 'Ping',
            execute: executeMock,
        });

        await router.register(context);

        await context.eventBus.publish('MESSAGE_CREATE', {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            userId: 'bot-1',
            channelId: 'c1',
            messageId: 'm1',
            content: '!ping',
            authorName: 'Bot',
            authorTag: 'Bot#1',
            isBot: true,
        });

        expect(executeMock).not.toHaveBeenCalled();
    });

    it('should respect command cooldowns', async () => {
        const context = createMockContext();
        const router = new CommandRouterPlugin();
        const executeMock = mock(async () => {});

        router.registerCommand({
            name: 'cd',
            description: 'Cooldown',
            cooldown: 1000,
            execute: executeMock,
        });

        await router.register(context);

        // First call
        await context.eventBus.publish('MESSAGE_CREATE', {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            userId: 'u1',
            channelId: 'c1',
            messageId: 'm1',
            content: '!cd',
            authorName: 'U',
            authorTag: 'U#1',
            isBot: false,
        });

        // Second call (immediate)
        await context.eventBus.publish('MESSAGE_CREATE', {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            userId: 'u1',
            channelId: 'c1',
            messageId: 'm2',
            content: '!cd',
            authorName: 'U',
            authorTag: 'U#1',
            isBot: false,
        });

        expect(executeMock).toHaveBeenCalledTimes(1);
    });
});
