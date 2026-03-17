import type { BotEvent } from '@app/types';
import type { EventMiddleware, MiddlewareNext } from './types';

const MIDDLEWARE_SUFFIX = 'Middleware';

export abstract class BaseMiddleware<TEvent = BotEvent> implements EventMiddleware<TEvent> {
    public readonly priority: number = 0;

    public constructor() {
        const className = this.constructor.name;
        if (!className.endsWith(MIDDLEWARE_SUFFIX)) {
            throw new Error(`Middleware class name must end with "${MIDDLEWARE_SUFFIX}": ${className}`);
        }
    }

    public get name(): string {
        const className = this.constructor.name;
        return className.endsWith(MIDDLEWARE_SUFFIX) ? className.slice(0, -MIDDLEWARE_SUFFIX.length) : className;
    }

    public abstract execute(event: TEvent, next: MiddlewareNext): void | Promise<void>;
}
