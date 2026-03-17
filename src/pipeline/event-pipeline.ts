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

const traceExecution = <TResult>(
    trace: PipelineTraceEntry[],
    stage: PipelineStage,
    name: string,
    getTime: () => number,
    fn: () => TResult | Promise<TResult>
): TResult | Promise<TResult> => {
    const startedAt = getTime();
    const entry: PipelineTraceEntry = {
        stage,
        name,
        durationMs: 0,
    };
    trace.push(entry);

    const finalize = (error?: unknown) => {
        entry.durationMs = getTime() - startedAt;
        if (typeof error !== 'undefined') {
            entry.error = error;
        }
    };

    try {
        const result = fn();
        if (result instanceof Promise) {
            return result
                .then((value) => {
                    finalize();
                    return value;
                })
                .catch((error) => {
                    finalize(error);
                    throw error;
                });
        }

        finalize();
        return result;
    } catch (error) {
        finalize(error);
        throw error;
    }
};

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
            return traceExecution(trace, stage, current.name, getTime, () => {
                return current.execute.call(current, event, next);
            });
        },
    }));
};

const wrapHandler = <TEvent>(
    handler: MiddlewareHandler<TEvent>,
    trace: PipelineTraceEntry[],
    getTime: () => number
): MiddlewareHandler<TEvent> => {
    return (event) => {
        return traceExecution(trace, 'handler', 'handler', getTime, () => handler(event));
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
