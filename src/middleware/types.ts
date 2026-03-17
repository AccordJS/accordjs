import type { BotEvent } from '@app/types';

export type MiddlewareNext = () => Promise<void>;

export interface MiddlewareLogger {
    error: (error: unknown, message?: string) => void;
}

export interface EventMiddleware<TEvent = BotEvent> {
    readonly name: string;
    readonly priority: number;
    execute(event: TEvent, next: MiddlewareNext): void | Promise<void>;
}

export type MiddlewareHandler<TEvent = BotEvent> = (event: TEvent) => void | Promise<void>;

export type AnyEventMiddleware = EventMiddleware<BotEvent>;
