import type { EventBus } from '@app/bus/types';
import type { EventMiddleware, MiddlewareLogger } from '@app/middleware/types';
import { attachPipelineMetadata } from '@app/pipeline/event-pipeline';
import type { EventHandlerMap } from '@app/types';
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
    const pluginName =
        typeof (plugin as { name?: unknown }).name === 'string' ? (plugin as { name: string }).name : undefined;

    for (const mapped of handlers) {
        const { eventType, handler } = mapped;

        const shouldAttachMetadata =
            Boolean(pluginName) || Boolean(options.getMiddleware) || Boolean(options.middleware?.length);

        if (shouldAttachMetadata) {
            const pipelineHandler = attachPipelineMetadata(handler, {
                getPluginMiddleware: options.getMiddleware ?? (() => options.middleware ?? []),
                pluginName,
            });
            eventBus.subscribe(eventType, pipelineHandler);
            continue;
        }

        eventBus.subscribe(eventType, handler);
    }
};
