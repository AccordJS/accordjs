import type { EventHandler } from '@app/bus/types';
import type { EventHandlerMap, EventMap } from '@app/types';

interface LoggerLike {
    error?: (error: unknown, message?: string) => void;
    warn?: (message: string) => void;
}

export interface HandlerRegistryOptions {
    logger?: LoggerLike;
    suppressMissingHandlers?: boolean;
}

export interface MappedHandler<K extends keyof EventMap = keyof EventMap> {
    eventType: K;
    methodName: string;
    handler: EventHandler<EventMap[K]>;
}

export class HandlerRegistry {
    private plugin: Record<string, unknown>;
    private logger?: LoggerLike;
    private suppressMissingHandlers: boolean;

    constructor(plugin: object, options: HandlerRegistryOptions = {}) {
        this.plugin = plugin as Record<string, unknown>;
        this.logger = options.logger;
        this.suppressMissingHandlers = options.suppressMissingHandlers ?? false;
    }

    public resolve(eventMap: EventHandlerMap): MappedHandler[] {
        const handlers: MappedHandler[] = [];
        const pluginName = typeof this.plugin.name === 'string' ? this.plugin.name : 'UnknownPlugin';

        for (const [methodName, eventType] of Object.entries(eventMap)) {
            const candidate = this.plugin[methodName];

            if (candidate === undefined || candidate === null) {
                if (!this.suppressMissingHandlers) {
                    this.logger?.warn?.(`Plugin '${pluginName}' eventMap refers to missing method '${methodName}'.`);
                }
                continue;
            }

            if (typeof candidate !== 'function') {
                this.logger?.error?.(
                    new Error(`Invalid handler for ${methodName}`),
                    `Plugin '${pluginName}' eventMap method '${methodName}' is not a function.`
                );
                continue;
            }

            handlers.push({
                eventType: eventType as keyof EventMap,
                methodName,
                handler: candidate.bind(this.plugin) as EventHandler<EventMap[keyof EventMap]>,
            });
        }

        return handlers;
    }
}
