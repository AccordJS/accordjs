import { describe, expect, it, mock } from 'bun:test';
import { BasePlugin } from '@app/plugins/base-plugin';
import type { PluginContext } from '@app/types/index';

// Concrete implementation for testing
class MockPlugin extends BasePlugin {
    public override readonly name = 'mock-plugin';
    public override readonly description = 'Mock plugin for testing';
    public override readonly version = '1.0.0';

    public onRegisterCalled = false;

    protected override async onRegister(): Promise<void> {
        this.onRegisterCalled = true;
    }

    public getPluginContext(): PluginContext | undefined {
        return this.context;
    }
}

describe('BasePlugin', () => {
    it('should set context and execute onRegister lifecycle hook', async () => {
        const plugin = new MockPlugin();
        const mockContext = {
            eventBus: {},
            config: {},
            logger: {
                info: mock(() => {}),
            },
        } as unknown as PluginContext;

        await plugin.register(mockContext);

        expect(plugin.onRegisterCalled).toBe(true);
        expect(plugin.getPluginContext()).toBe(mockContext);
        expect(mockContext.logger.info).toHaveBeenCalled();
    });

    it('should expose plugin metadata', () => {
        const plugin = new MockPlugin();
        expect(plugin.name).toBe('mock-plugin');
        expect(plugin.description).toBe('Mock plugin for testing');
        expect(plugin.version).toBe('1.0.0');
    });
});
