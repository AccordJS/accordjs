import { describe, expect, it, mock } from 'bun:test';
import { BaseMiddleware } from '@app/middleware/base-middleware';
import { BasePlugin } from '@app/plugins/base-plugin';
import type { MessageCreateEvent, PluginContext } from '@app/types';

class TestMiddleware extends BaseMiddleware<MessageCreateEvent> {
    public override execute(_event: MessageCreateEvent, next: () => Promise<void>): void | Promise<void> {
        return next();
    }
}

class MiddlewarePlugin extends BasePlugin {
    public override readonly name = 'middleware-plugin';

    protected override readonly eventMap = {
        handleMessage: 'MESSAGE_CREATE',
    } as const;

    public override async onRegister(): Promise<void> {
        this.addMiddleware([new TestMiddleware()]);
    }

    public getRegisteredMiddleware(): TestMiddleware[] {
        return this.getPluginMiddleware() as TestMiddleware[];
    }

    public addAfterRegister(): void {
        this.addMiddleware([new TestMiddleware()]);
    }

    public async handleMessage(_event: MessageCreateEvent): Promise<void> {
        // no-op
    }
}

describe('Plugin middleware', () => {
    it('registers middleware through addMiddleware', async () => {
        const plugin = new MiddlewarePlugin();
        const subscribe = mock(() => {});
        const eventBus = {
            subscribe,
        };
        const context = {
            eventBus,
            config: {},
            logger: {
                info: mock(() => {}),
                warn: mock(() => {}),
                error: mock(() => {}),
            },
        } as unknown as PluginContext;

        await plugin.register(context);

        const middleware = plugin.getRegisteredMiddleware();
        expect(middleware).toHaveLength(1);
        expect(middleware[0]).toBeInstanceOf(TestMiddleware);
    });

    it('allows adding middleware after registration', async () => {
        const plugin = new MiddlewarePlugin();
        const subscribe = mock(() => {});
        const eventBus = {
            subscribe,
        };
        const context = {
            eventBus,
            config: {},
            logger: {
                info: mock(() => {}),
                warn: mock(() => {}),
                error: mock(() => {}),
            },
        } as unknown as PluginContext;

        await plugin.register(context);

        plugin.addAfterRegister();

        const middleware = plugin.getRegisteredMiddleware();
        expect(middleware).toHaveLength(2);
    });
});
