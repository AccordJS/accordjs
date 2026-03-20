import { BaseMiddleware } from '@app/middleware/base-middleware';
import type { BotEvent } from '@app/types';

export class BotFilterMiddleware<TEvent = BotEvent> extends BaseMiddleware<TEvent> {
    public override async execute(event: TEvent, next: () => Promise<void>): Promise<void> {
        const record = event as { isBot?: unknown };
        if (record.isBot === true) {
            return;
        }

        await next();
    }
}
