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
    getMiddleware?: () => EventMiddleware[];
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

    const handlers = registry.resolve(eventMap);

    for (const mapped of handlers) {
        const { eventType, handler } = mapped;

        const wrappedHandler = (event: EventMap[typeof eventType]): void | Promise<void> => {
            const middleware = options.getMiddleware?.() ?? options.middleware ?? [];
            if (middleware.length === 0) {
                return handler(event);
            }

            return runMiddlewareChain(
                event,
                middleware as EventMiddleware<EventMap[typeof eventType]>[],
                handler,
                options.logger
            );
        };

        if (options.getMiddleware || (options.middleware && options.middleware.length > 0)) {
            eventBus.subscribe(eventType, wrappedHandler);
            continue;
        }

        eventBus.subscribe(eventType, handler);
    }
};
