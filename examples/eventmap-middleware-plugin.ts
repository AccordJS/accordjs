import { BaseMiddleware } from '@app/middleware/base-middleware';
import { BasePlugin } from '@app/plugins/base-plugin';
import type { MessageCreateEvent } from '@app/types';

class IgnoreBotMessagesMiddleware extends BaseMiddleware<MessageCreateEvent> {
    public override async execute(event: MessageCreateEvent, next: () => Promise<void>): Promise<void> {
        if (event.isBot) {
            return;
        }

        await next();
    }
}

export class ExampleEventMapPlugin extends BasePlugin {
    public override readonly name = 'example-event-map';
    public override readonly description = 'Demonstrates eventMap + plugin middleware flow.';

    protected override readonly eventMap = {
        handleMessageCreate: 'MESSAGE_CREATE',
    } as const;

    protected override async onRegister(): Promise<void> {
        this.addMiddleware(new IgnoreBotMessagesMiddleware());
        this.context?.logger.info('ExampleEventMapPlugin registered.');
    }

    public async handleMessageCreate(event: MessageCreateEvent): Promise<void> {
        this.context?.logger.info(`Message received: ${event.content}`);
    }
}
