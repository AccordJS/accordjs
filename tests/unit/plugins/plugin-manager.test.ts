import { describe, expect, it } from 'bun:test';
import type { EventBus } from '@app/bus/types';
import type { Config } from '@app/config';
import { PluginManager } from '@app/plugins/plugin-manager';
import type { EventHandlerMap, Plugin, PluginContext } from '@app/types/index';

class TestPlugin implements Plugin {
    public readonly name: string;
    public registerCalled = false;
    public context?: PluginContext;

    constructor(name: string) {
        this.name = name;
    }

    public async register(ctx: PluginContext): Promise<void> {
        this.registerCalled = true;
        this.context = ctx;
    }
}

describe('PluginManager', () => {
    const mockBus = {} as EventBus;
    const mockConfig = {} as Config;

    it('should register a single plugin and inject context', async () => {
        const manager = new PluginManager(mockBus, mockConfig);
        const plugin = new TestPlugin('test-1');

        await manager.register(plugin);

        expect(plugin.registerCalled).toBe(true);
        expect(plugin.context?.eventBus).toBe(mockBus);
        expect(plugin.context?.config).toBe(mockConfig);
        expect(plugin.context?.logger).toBeDefined();
        expect(manager.getPlugins()).toContain('test-1');
    });

    it('should not allow duplicate registrations for the same plugin name', async () => {
        const manager = new PluginManager(mockBus, mockConfig);
        const plugin1 = new TestPlugin('duplicate');
        const plugin2 = new TestPlugin('duplicate');

        await manager.register(plugin1);
        await manager.register(plugin2);

        expect(plugin1.registerCalled).toBe(true);
        expect(plugin2.registerCalled).toBe(false);
        expect(manager.getPlugins().length).toBe(1);
    });

    it('should register multiple plugins via registerAll', async () => {
        const manager = new PluginManager(mockBus, mockConfig);
        const p1 = new TestPlugin('p1');
        const p2 = new TestPlugin('p2');

        await manager.registerAll([p1, p2]);

        expect(p1.registerCalled).toBe(true);
        expect(p2.registerCalled).toBe(true);
        expect(manager.getPlugins()).toContain('p1');
        expect(manager.getPlugins()).toContain('p2');
    });

    it('should throw if plugin registration fails', async () => {
        const manager = new PluginManager(mockBus, mockConfig);
        const failingPlugin: Plugin = {
            name: 'failing',
            register: async () => {
                throw new Error('Registration failed');
            },
        };

        await expect(manager.register(failingPlugin)).rejects.toThrow('Registration failed');
    });

    it('should inject explicit handler bindings when provided', async () => {
        const manager = new PluginManager(mockBus, mockConfig);
        const plugin = new TestPlugin('bound-plugin');
        const handlerBindings: EventHandlerMap = {
            handleLeave: 'MEMBER_LEAVE',
        };

        await manager.register(plugin, { handlerBindings });

        expect(plugin.context?.handlerBindings).toEqual(handlerBindings);
    });

    it('should preserve handler bindings when registerAll receives plugin registrations', async () => {
        const manager = new PluginManager(mockBus, mockConfig);
        const plugin = new TestPlugin('bulk-bound-plugin');
        const handlerBindings: EventHandlerMap = {
            handleDelete: 'MESSAGE_DELETE',
        };

        await manager.registerAll([
            {
                plugin,
                handlerBindings,
            },
        ]);

        expect(plugin.context?.handlerBindings).toEqual(handlerBindings);
    });
});
