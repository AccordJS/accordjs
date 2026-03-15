import type { EventBus } from '@app/bus/types';
import type { Config } from '@app/config';
import type { Logger } from 'pino';

/**
 * Context provided to plugins during registration.
 *
 * Provides access to the event bus, application configuration,
 * and a plugin-specific logger.
 */
export interface PluginContext {
    /**
     * The internal framework event bus.
     */
    readonly eventBus: EventBus;

    /**
     * The validated application configuration.
     */
    readonly config: Config;

    /**
     * A logger instance configured for the plugin.
     */
    readonly logger: Logger;
}
