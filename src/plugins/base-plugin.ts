import type { Plugin, PluginContext } from '@app/types/index';

/**
 * Base abstract class for all AccordJS plugins.
 *
 * Provides basic functionality and standardizes plugin structure
 * with lifecycle hooks.
 */
export abstract class BasePlugin implements Plugin {
    /**
     * Unique name of the plugin.
     */
    public abstract readonly name: string;

    /**
     * Description of what the plugin does.
     */
    public readonly description?: string;

    /**
     * Version of the plugin.
     */
    public readonly version?: string;

    /**
     * Plugin context provided during registration.
     * Guaranteed to be available after register() is called.
     */
    protected context?: PluginContext;

    /**
     * Framework registration method. Sets up context and calls onRegister().
     * Should not be overridden by child classes; use onRegister() instead.
     *
     * @param ctx - The plugin context.
     */
    public async register(ctx: PluginContext): Promise<void> {
        this.context = ctx;
        await this.onRegister();
        this.context.logger.info(`Plugin '${this.name}' registered successfully.`);
    }

    /**
     * Lifecycle method called during plugin registration.
     * To be overridden by child classes for custom setup.
     */
    protected async onRegister(): Promise<void> {
        // Optional override for child plugins
    }
}
