import type { EventMap } from '@app/types';
import { createLogger } from '@app/utils/create-logger';
import type { AnyEventHandler, EventBus, EventHandler } from './types';

/**
 * In-memory event bus implementation for AccordJS
 * Provides a typed in-memory event distribution system using Map/Set storage
 */
export class InMemoryEventBus implements EventBus {
    /**
     * Internal handler storage. Each Set contains handlers for the specific event type
     * corresponding to its map key. Union type represents all possible event handlers.
     */
    protected handlers = new Map<keyof EventMap, Set<AnyEventHandler>>();

    /**
     * Logger instance for structured error logging
     */
    protected logger = createLogger('InMemoryEventBus');

    /**
     * @inheritdoc
     */
    public publish<K extends keyof EventMap>(type: K, event: EventMap[K]): void {
        const typeHandlers = this.handlers.get(type);
        if (!typeHandlers) {
            return;
        }

        // Snapshot the handlers to prevent mutation during iteration
        // This prevents issues if handlers call subscribe/unsubscribe during dispatch
        const handlerSnapshot = Array.from(typeHandlers);

        for (const handler of handlerSnapshot) {
            try {
                // Ensure handler is called with await for potential async operations
                const result = handler(event);
                if (result instanceof Promise) {
                    result.catch((error) => {
                        this.logger.error(error, `Error in async handler for event ${type}`);
                    });
                }
            } catch (error) {
                this.logger.error(error, `Error in handler for event ${type}`);
            }
        }
    }

    /**
     * @inheritdoc
     */
    public subscribe<K extends keyof EventMap>(type: K, handler: EventHandler<EventMap[K]>): void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }

        this.handlers.get(type)?.add(handler as AnyEventHandler);
    }

    /**
     * @inheritdoc
     */
    public unsubscribe<K extends keyof EventMap>(type: K, handler: EventHandler<EventMap[K]>): void {
        const typeHandlers = this.handlers.get(type);
        if (!typeHandlers) {
            return;
        }

        typeHandlers.delete(handler as AnyEventHandler);

        if (typeHandlers.size === 0) {
            this.handlers.delete(type);
        }
    }
}
