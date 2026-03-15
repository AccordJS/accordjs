import type { EventMap } from '@app/types';

/**
 * Event handler type for the event bus
 */
export type EventHandler<T> = (event: T) => void | Promise<void>;

/**
 * Type alias for any event handler that can handle any event in our EventMap
 */
export type AnyEventHandler = EventHandler<EventMap[keyof EventMap]>;

/**
 * Event bus interface - abstract contract for all event bus implementations
 */
export interface EventBus {
    /**
     * Publishes an event to all subscribers
     * @param type - Event type name
     * @param event - Event data
     */
    publish<K extends keyof EventMap>(type: K, event: EventMap[K]): void;

    /**
     * Subscribes a handler to an event type
     * @param type - Event type name
     * @param handler - Handler function
     */
    subscribe<K extends keyof EventMap>(type: K, handler: EventHandler<EventMap[K]>): void;

    /**
     * Unsubscribes a handler from an event type
     * @param type - Event type name
     * @param handler - Handler function to remove
     */
    unsubscribe<K extends keyof EventMap>(type: K, handler: EventHandler<EventMap[K]>): void;
}
