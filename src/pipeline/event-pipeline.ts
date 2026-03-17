import { runMiddlewareChain } from '@app/middleware/middleware-runner';
import type { EventMiddleware, MiddlewareHandler, MiddlewareLogger } from '@app/middleware/types';
import { createLogger } from '@app/utils/create-logger';
import type { PipelineContext, PipelineStage, PipelineTraceEntry } from './pipeline-context';

const defaultLogger = createLogger('EventPipeline');
const pipelineMetadataKey = Symbol('pipelineMetadata');

export interface PipelineMetadata {
    getPluginMiddleware?: () => EventMiddleware[];
    pluginName?: string;
}

export type PipelineAwareHandler<TEvent> = MiddlewareHandler<TEvent> & {
    [pipelineMetadataKey]?: PipelineMetadata;
};

export const attachPipelineMetadata = <TEvent>(
    handler: MiddlewareHandler<TEvent>,
    metadata: PipelineMetadata
): MiddlewareHandler<TEvent> => {
    (handler as PipelineAwareHandler<TEvent>)[pipelineMetadataKey] = metadata;
    return handler;
};

export const getPipelineMetadata = <TEvent>(handler: MiddlewareHandler<TEvent>): PipelineMetadata | undefined => {
    return (handler as PipelineAwareHandler<TEvent>)[pipelineMetadataKey];
};

export interface EventPipelineOptions {
    logger?: MiddlewareLogger;
    enableTracing?: boolean;
    getTime?: () => number;
    onComplete?: (context: PipelineContext) => void;
}

export interface EventPipelineArgs<TEvent> {
    event: TEvent;
    eventType: string;
    globalMiddleware?: EventMiddleware<TEvent>[];
    pluginMiddleware?: EventMiddleware<TEvent>[];
    handler: MiddlewareHandler<TEvent>;
    pluginName?: string;
    options?: EventPipelineOptions;
}

const wrapMiddleware = <TEvent>(
    middleware: EventMiddleware<TEvent>[],
    stage: PipelineStage,
    trace: PipelineTraceEntry[],
    getTime: () => number
): EventMiddleware<TEvent>[] => {
    return middleware.map((current) => ({
        name: current.name,
        priority: current.priority,
        execute: (event, next) => {
            const startedAt = getTime();
            try {
                const result = current.execute.call(current, event, next);
                if (result instanceof Promise) {
                    return result
                        .then(() => {
                            trace.push({
                                stage,
                                name: current.name,
                                durationMs: getTime() - startedAt,
                            });
                        })
                        .catch((error) => {
                            trace.push({
                                stage,
                                name: current.name,
                                durationMs: getTime() - startedAt,
                                error,
                            });
                            throw error;
                        });
                }

                trace.push({
                    stage,
                    name: current.name,
                    durationMs: getTime() - startedAt,
                });

                return result;
            } catch (error) {
                trace.push({
                    stage,
                    name: current.name,
                    durationMs: getTime() - startedAt,
                    error,
                });
                throw error;
            }
        },
    }));
};

const wrapHandler = <TEvent>(
    handler: MiddlewareHandler<TEvent>,
    trace: PipelineTraceEntry[],
    getTime: () => number
): MiddlewareHandler<TEvent> => {
    return (event) => {
        const startedAt = getTime();
        try {
            const result = handler(event);
            if (result instanceof Promise) {
                return result
                    .then(() => {
                        trace.push({
                            stage: 'handler',
                            name: 'handler',
                            durationMs: getTime() - startedAt,
                        });
                    })
                    .catch((error) => {
                        trace.push({
                            stage: 'handler',
                            name: 'handler',
                            durationMs: getTime() - startedAt,
                            error,
                        });
                        throw error;
                    });
            }

            trace.push({
                stage: 'handler',
                name: 'handler',
                durationMs: getTime() - startedAt,
            });

            return result;
        } catch (error) {
            trace.push({
                stage: 'handler',
                name: 'handler',
                durationMs: getTime() - startedAt,
                error,
            });
            throw error;
        }
    };
};

export const runEventPipeline = <TEvent>(args: EventPipelineArgs<TEvent>): void | Promise<void> => {
    const { event, eventType, handler, pluginName, options, globalMiddleware = [], pluginMiddleware = [] } = args;
    const logger = options?.logger ?? defaultLogger;
    const getTime = options?.getTime ?? Date.now;
    const context: PipelineContext<TEvent> = {
        event,
        eventType,
        pluginName,
        startedAt: getTime(),
        trace: options?.enableTracing ? [] : undefined,
    };

    const trace = context.trace;
    const tracedHandler = trace ? wrapHandler(handler, trace, getTime) : handler;
    const tracedGlobal = trace
        ? wrapMiddleware(globalMiddleware, 'global-middleware', trace, getTime)
        : globalMiddleware;
    const tracedPlugin = trace
        ? wrapMiddleware(pluginMiddleware, 'plugin-middleware', trace, getTime)
        : pluginMiddleware;

    const runPluginChain = (evt: TEvent): void | Promise<void> => {
        return runMiddlewareChain(evt, tracedPlugin, tracedHandler, logger);
    };

    const result = runMiddlewareChain(event, tracedGlobal, runPluginChain, logger);
    const finalize = () => {
        context.finishedAt = getTime();
        context.durationMs = context.finishedAt - context.startedAt;
        options?.onComplete?.(context);
    };

    if (result instanceof Promise) {
        return result.finally(finalize);
    }

    finalize();
    return result;
};
