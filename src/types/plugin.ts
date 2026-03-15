/**
 * Plugin interface definitions for AccordJS
 */

import type { PluginContext } from '@app/types/plugin-context';

/**
 * Basic plugin interface
 */
export interface Plugin {
    /**
     * Unique name of the plugin
     */
    readonly name: string;

    /**
     * Description of the plugin
     */
    readonly description?: string;

    /**
     * Version of the plugin
     */
    readonly version?: string;

    /**
     * Initialization method for the plugin
     * @param ctx - Plugin context providing access to framework features
     */
    register(ctx: PluginContext): void | Promise<void>;
}
