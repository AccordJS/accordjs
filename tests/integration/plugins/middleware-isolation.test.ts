import { describe, expect, it, mock } from 'bun:test';
import { InMemoryEventBus } from '@app/bus/in-memory-event-bus';
import { BaseMiddleware } from '@app/middleware/base-middleware';
import { BasePlugin } from '@app/plugins/base-plugin';
import type { MessageCreateEvent, PluginContext } from '@app/types';

class TrackingMiddleware extends BaseMiddleware<MessageCreateEvent> {
    constructor(private onCall: () => void) {
        super();
    }

    public override async execute(_event: MessageCreateEvent, next: () => Promise<void>): Promise<void> {
        this.onCall();
        await next();
    }
}

class PluginWithMiddleware extends BasePlugin {
    public override readonly name = 'plugin-with-middleware';

    protected override readonly eventMap = {
        handleMessage: 'MESSAGE_CREATE',
    } as const;

    public middlewareCalls = 0;
    public handlerCalls = 0;

    public override async onRegister(): Promise<void> {
        this.addMiddleware([new TrackingMiddleware(() => this.middlewareCalls++)]);
    }

    public async handleMessage(_event: MessageCreateEvent): Promise<void> {
        this.handlerCalls += 1;
    }
}

class PluginWithoutMiddleware extends BasePlugin {
    public override readonly name = 'plugin-without-middleware';

    protected override readonly eventMap = {
        handleMessage: 'MESSAGE_CREATE',
    } as const;

    public handlerCalls = 0;

    public async handleMessage(_event: MessageCreateEvent): Promise<void> {
        this.handlerCalls += 1;
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

describe('Plugin middleware isolation', () => {
    it('applies middleware only to the owning plugin handlers', async () => {
        const eventBus = new InMemoryEventBus();
        const pluginWithMiddleware = new PluginWithMiddleware();
        const pluginWithoutMiddleware = new PluginWithoutMiddleware();

        await pluginWithMiddleware.register(createContext(eventBus));
        await pluginWithoutMiddleware.register(createContext(eventBus));

        eventBus.publish('MESSAGE_CREATE', createEvent());

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(pluginWithMiddleware.middlewareCalls).toBe(1);
        expect(pluginWithMiddleware.handlerCalls).toBe(1);
        expect(pluginWithoutMiddleware.handlerCalls).toBe(1);
    });
});
