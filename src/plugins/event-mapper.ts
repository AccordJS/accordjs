import type { EventBus } from '@app/bus/types';
import { runMiddlewareChain } from '@app/middleware/middleware-runner';
import type { EventMiddleware, MiddlewareLogger } from '@app/middleware/types';
import type { EventHandlerMap, EventMap } from '@app/types';
import { HandlerRegistry } from './handler-registry';

interface LoggerLike extends MiddlewareLogger {
    warn?: (message: string) => void;
}

export interface EventMapperOptions {
    logger?: LoggerLike;
    middleware?: EventMiddleware[];
    suppressMissingHandlers?: boolean;
}

export const registerMappedHandlers = (
    plugin: object,
    eventBus: EventBus,
    eventMap: EventHandlerMap,
    options: EventMapperOptions = {}
): void => {
    const registry = new HandlerRegistry(plugin, {
        logger: options.logger,
        suppressMissingHandlers: options.suppressMissingHandlers,
    });

    const middleware = options.middleware ?? [];
    const handlers = registry.resolve(eventMap);

    for (const mapped of handlers) {
        const { eventType, handler } = mapped;

        if (middleware.length === 0) {
            eventBus.subscribe(eventType, handler);
            continue;
        }

        const wrappedHandler = (event: EventMap[typeof eventType]): void | Promise<void> => {
            return runMiddlewareChain(
                event,
                middleware as EventMiddleware<EventMap[typeof eventType]>[],
                handler,
                options.logger
            );
        };

        eventBus.subscribe(eventType, wrappedHandler);
    }
};
