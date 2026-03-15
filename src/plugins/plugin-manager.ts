import type { EventBus } from '@app/bus/types';
import type { Config } from '@app/config';
import type { Plugin, PluginContext } from '@app/types/index';
import { createLogger } from '@app/utils/create-logger';

/**
 * Manager responsible for registering and orchestrating AccordJS plugins.
 *
 * Provides plugin lifecycle management and injects necessary context
 * into plugins during registration.
 */
export class PluginManager {
    /**
     * Store of registered plugins by their unique name.
     */
    protected plugins = new Map<string, Plugin>();

    /**
     * The internal framework event bus.
     */
    protected eventBus: EventBus;

    /**
     * The validated application configuration.
     */
    protected config: Config;

    /**
     * Framework logger instance.
     */
    protected logger = createLogger('PluginManager');

    /**
     * @param eventBus - The event bus to provide to plugins.
     * @param config - The configuration to provide to plugins.
     */
    constructor(eventBus: EventBus, config: Config) {
        this.eventBus = eventBus;
        this.config = config;
    }

    /**
     * Registers a single plugin with the framework.
     *
     * @param plugin - The plugin instance to register.
     * @throws Error if plugin registration fails.
     */
    public async register(plugin: Plugin): Promise<void> {
        if (this.plugins.has(plugin.name)) {
            this.logger.warn(`Plugin '${plugin.name}' is already registered. Skipping.`);
            return;
        }

        const context: PluginContext = {
            eventBus: this.eventBus,
            config: this.config,
            logger: createLogger(`Plugin:${plugin.name}`),
        };

        try {
            await plugin.register(context);
            this.plugins.set(plugin.name, plugin);
        } catch (error) {
            this.logger.error(error, `Registration failed for plugin '${plugin.name}'`);
            throw error;
        }
    }

    /**
     * Registers multiple plugins sequentially.
     *
     * @param plugins - Array of plugin instances.
     */
    public async registerAll(plugins: Plugin[]): Promise<void> {
        for (const plugin of plugins) {
            await this.register(plugin);
        }
    }

    /**
     * Retrieves a list of all currently registered plugin names.
     */
    public getPlugins(): string[] {
        return Array.from(this.plugins.keys());
    }
}
