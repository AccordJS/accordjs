import { describe, expect, it, mock } from 'bun:test';
import { InMemoryEventBus } from '@app/bus/in-memory-event-bus';
import { BaseMiddleware } from '@app/middleware/base-middleware';
import { BasePlugin } from '@app/plugins/base-plugin';
import type { MessageCreateEvent, PluginContext } from '@app/types';

let pipelineOrder: string[] = [];

class GlobalMiddleware extends BaseMiddleware<MessageCreateEvent> {
    public override async execute(_event: MessageCreateEvent, next: () => Promise<void>): Promise<void> {
        pipelineOrder.push('global');
        await next();
    }
}

class PluginMiddleware extends BaseMiddleware<MessageCreateEvent> {
    public override async execute(_event: MessageCreateEvent, next: () => Promise<void>): Promise<void> {
        pipelineOrder.push('plugin');
        await next();
    }
}

class PipelinePlugin extends BasePlugin {
    public override readonly name = 'pipeline-plugin';

    protected override readonly eventMap = {
        handleMessage: 'MESSAGE_CREATE',
    } as const;

    public override async onRegister(): Promise<void> {
        this.addMiddleware([new PluginMiddleware()]);
    }

    public async handleMessage(_event: MessageCreateEvent): Promise<void> {
        pipelineOrder.push('handler');
    }
}

const createContext = (eventBus: InMemoryEventBus): PluginContext =>
    ({
        eventBus,
        config: {},
        logger: {
            info: mock(() => {}),
            warn: mock(() => {}),
            error: mock(() => {}),
        },
    }) as unknown as PluginContext;

const createEvent = (): MessageCreateEvent => ({
    type: 'MESSAGE_CREATE',
    timestamp: Date.now(),
    messageId: '123',
    channelId: '456',
    userId: '789',
    content: 'Hello',
    authorName: 'User',
    authorTag: 'User#0001',
    isBot: false,
});

describe('Full pipeline integration', () => {
    it('runs global middleware, plugin middleware, and handler in order', async () => {
        pipelineOrder = [];
        const eventBus = new InMemoryEventBus();
        eventBus.addMiddleware(new GlobalMiddleware());

        const plugin = new PipelinePlugin();
        await plugin.register(createContext(eventBus));

        eventBus.publish('MESSAGE_CREATE', createEvent());

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(pipelineOrder).toEqual(['global', 'plugin', 'handler']);
    });
});
