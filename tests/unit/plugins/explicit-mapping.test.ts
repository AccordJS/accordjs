import { describe, expect, it, mock } from 'bun:test';
import { BasePlugin } from '@app/plugins/base-plugin';
import type { MessageCreateEvent, PluginContext } from '@app/types';

class ExplicitMappingPlugin extends BasePlugin {
    public override readonly name = 'explicit-mapper';

    protected override readonly eventMap = {
        handleMessage: 'MESSAGE_CREATE',
    } as const;

    public handled: MessageCreateEvent[] = [];

    public async handleMessage(event: MessageCreateEvent): Promise<void> {
        this.handled.push(event);
    }
}

describe('Explicit event mapping', () => {
    it('registers event handlers defined in eventMap', async () => {
        const plugin = new ExplicitMappingPlugin();
        let registeredHandler: ((event: MessageCreateEvent) => void | Promise<void>) | undefined;
        const subscribe = mock((_type, handler) => {
            registeredHandler = handler as (event: MessageCreateEvent) => void | Promise<void>;
        });
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

        expect(subscribe).toHaveBeenCalledTimes(1);
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

        await registeredHandler?.(event);
        expect(plugin.handled).toEqual([event]);
    });
});
