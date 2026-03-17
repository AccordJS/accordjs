import { createLogger } from '@app/utils/create-logger';
import type { EventMiddleware, MiddlewareHandler, MiddlewareNext } from './types';

interface LoggerLike {
    error: (error: unknown, message?: string) => void;
}

const defaultLogger = createLogger('MiddlewareRunner');

const resolveEventType = (event: unknown): string => {
    if (event && typeof event === 'object' && 'type' in event) {
        const eventType = (event as { type?: unknown }).type;
        if (typeof eventType === 'string') {
            return eventType;
        }
    }

    return 'unknown';
};

const sortMiddleware = <TEvent>(middleware: EventMiddleware<TEvent>[]): EventMiddleware<TEvent>[] => {
    return [...middleware].sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }

        return a.name.localeCompare(b.name);
    });
};

const invokeHandler = <TEvent>(
    event: TEvent,
    handler: MiddlewareHandler<TEvent>,
    logger: LoggerLike,
    eventType: string
): void | Promise<void> => {
    try {
        const result = handler(event);
        if (result instanceof Promise) {
            return result.catch((error) => {
                logger.error(error, `Error in handler for event ${eventType}`);
            });
        }
    } catch (error) {
        logger.error(error, `Error in handler for event ${eventType}`);
    }
};

export const runMiddlewareChain = <TEvent>(
    event: TEvent,
    middleware: EventMiddleware<TEvent>[],
    handler: MiddlewareHandler<TEvent>,
    logger: LoggerLike = defaultLogger
): void | Promise<void> => {
    if (middleware.length === 0) {
        return invokeHandler(event, handler, logger, resolveEventType(event));
    }

    const orderedMiddleware = sortMiddleware(middleware);
    const eventType = resolveEventType(event);
    let index = -1;

    const dispatch = (position: number): void | Promise<void> => {
        if (position <= index) {
            logger.error(new Error('next() called multiple times'), `Error in middleware chain for event ${eventType}`);
            return;
        }

        index = position;
        const current = orderedMiddleware[position];
        if (!current) {
            return invokeHandler(event, handler, logger, eventType);
        }

        let nextCalled = false;
        const next: MiddlewareNext = () => {
            if (nextCalled) {
                logger.error(
                    new Error('next() called multiple times'),
                    `Error in middleware ${current.name} for event ${eventType}`
                );
                return Promise.resolve();
            }

            nextCalled = true;
            const result = dispatch(position + 1);
            return result instanceof Promise ? result : Promise.resolve();
        };

        try {
            const result = current.execute(event, next);
            if (result instanceof Promise) {
                return result.catch((error) => {
                    logger.error(error, `Error in middleware ${current.name} for event ${eventType}`);
                });
            }
        } catch (error) {
            logger.error(error, `Error in middleware ${current.name} for event ${eventType}`);
        }
    };

    return dispatch(0);
};
