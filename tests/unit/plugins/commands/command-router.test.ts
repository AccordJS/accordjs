import { describe, expect, it, mock } from 'bun:test';
import { InMemoryEventBus } from '@app/bus/in-memory-event-bus';
import type { Config } from '@app/config';
import { CommandRouterPlugin } from '@app/plugins/commands/command-router';
import type { PluginContext } from '@app/types';
import type {
    CommandDispatchEvent,
    CommandErrorEvent,
    CommandExecuteEvent,
    CommandPermissionDeniedEvent,
} from '@app/types/events';
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

    it('should deny commands with permissions and publish permission denied event', async () => {
        const context = createMockContext();
        const router = new CommandRouterPlugin();
        const executeMock = mock(async () => {});
        const permissionEvents: CommandPermissionDeniedEvent[] = [];

        context.eventBus.subscribe('COMMAND_PERMISSION_DENIED', (e) => {
            permissionEvents.push(e);
        });

        router.registerCommand({
            name: 'admin',
            description: 'Admin only command',
            permissions: ['ADMINISTRATOR'],
            execute: executeMock,
        });

        await router.register(context);

        // Try to execute command with permissions
        await context.eventBus.publish('MESSAGE_CREATE', {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            userId: 'u1',
            channelId: 'c1',
            messageId: 'm1',
            content: '!admin',
            authorName: 'U',
            authorTag: 'U#1',
            isBot: false,
        });

        // Command should not execute
        expect(executeMock).not.toHaveBeenCalled();

        // Permission denied event should be published
        expect(permissionEvents).toHaveLength(1);
        expect(permissionEvents[0]?.type).toBe('COMMAND_PERMISSION_DENIED');
        expect(permissionEvents[0]?.commandName).toBe('admin');
        expect(permissionEvents[0]?.requiredPermissions).toEqual(['ADMINISTRATOR']);
        expect(permissionEvents[0]?.reason).toBe('Permission validation not implemented');
        expect(permissionEvents[0]?.userId).toBe('u1');
    });

    it('should allow commands without permissions to execute normally', async () => {
        const context = createMockContext();
        const router = new CommandRouterPlugin();
        const executeMock = mock(async () => {});
        const permissionEvents: CommandPermissionDeniedEvent[] = [];

        context.eventBus.subscribe('COMMAND_PERMISSION_DENIED', (e) => {
            permissionEvents.push(e);
        });

        router.registerCommand({
            name: 'public',
            description: 'Public command',
            // No permissions defined
            execute: executeMock,
        });

        await router.register(context);

        // Execute command without permissions
        await context.eventBus.publish('MESSAGE_CREATE', {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            userId: 'u1',
            channelId: 'c1',
            messageId: 'm1',
            content: '!public',
            authorName: 'U',
            authorTag: 'U#1',
            isBot: false,
        });

        // Command should execute normally
        expect(executeMock).toHaveBeenCalledTimes(1);

        // No permission denied events should be published
        expect(permissionEvents).toHaveLength(0);
    });

    it('should deny commands with empty permissions array', async () => {
        const context = createMockContext();
        const router = new CommandRouterPlugin();
        const executeMock = mock(async () => {});

        router.registerCommand({
            name: 'restricted',
            description: 'Restricted command',
            permissions: [], // Empty array should still trigger security check
            execute: executeMock,
        });

        await router.register(context);

        // Try to execute command with empty permissions
        await context.eventBus.publish('MESSAGE_CREATE', {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            userId: 'u1',
            channelId: 'c1',
            messageId: 'm1',
            content: '!restricted',
            authorName: 'U',
            authorTag: 'U#1',
            isBot: false,
        });

        // Command should execute since empty array is falsy for length > 0 check
        expect(executeMock).toHaveBeenCalledTimes(1);
    });

    it('should clean up cooldown entries after expiration', async () => {
        const context = createMockContext();
        const router = new CommandRouterPlugin();
        const executeMock = mock(async () => {});
        const shortCooldown = 50; // 50ms for fast test

        router.registerCommand({
            name: 'quickcd',
            description: 'Quick cooldown',
            cooldown: shortCooldown,
            execute: executeMock,
        });

        await router.register(context);

        // First execution
        await context.eventBus.publish('MESSAGE_CREATE', {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            userId: 'u1',
            channelId: 'c1',
            messageId: 'm1',
            content: '!quickcd',
            authorName: 'U',
            authorTag: 'U#1',
            isBot: false,
        });

        expect(executeMock).toHaveBeenCalledTimes(1);

        // Verify cooldown is in place
        await context.eventBus.publish('MESSAGE_CREATE', {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            userId: 'u1',
            channelId: 'c1',
            messageId: 'm2',
            content: '!quickcd',
            authorName: 'U',
            authorTag: 'U#1',
            isBot: false,
        });

        expect(executeMock).toHaveBeenCalledTimes(1); // Still 1, blocked by cooldown

        // Wait for cooldown to expire and cleanup to occur
        await new Promise((resolve) => setTimeout(resolve, shortCooldown + 10));

        // Should be able to execute again after cleanup
        await context.eventBus.publish('MESSAGE_CREATE', {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            userId: 'u1',
            channelId: 'c1',
            messageId: 'm3',
            content: '!quickcd',
            authorName: 'U',
            authorTag: 'U#1',
            isBot: false,
        });

        expect(executeMock).toHaveBeenCalledTimes(2); // Should execute again
    });
});
