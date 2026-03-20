import type { EventMiddleware } from '@app/middleware/types';
import type { EventHandlerMap, Plugin, PluginContext } from '@app/types/index';
import { registerMappedHandlers } from './event-mapper';
import { PluginMiddlewareManager } from './plugin-middleware-manager';

/**
 * Base abstract class for all AccordJS plugins.
 *
 * Provides basic functionality and standardizes plugin structure
 * with lifecycle hooks.
 */
export abstract class BasePlugin implements Plugin {
    private static readonly defaultEventMap: EventHandlerMap = Object.freeze({
        onMessageCreate: 'MESSAGE_CREATE',
        onMemberJoin: 'MEMBER_JOIN',
        onMemberLeave: 'MEMBER_LEAVE',
        onMessageDelete: 'MESSAGE_DELETE',
        onCommandDispatch: 'COMMAND_DISPATCH',
        onCommandExecute: 'COMMAND_EXECUTE',
        onCommandError: 'COMMAND_ERROR',
        onCommandPermissionDenied: 'COMMAND_PERMISSION_DENIED',
    });

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
     * Explicit mapping of handler method names to event types.
     */
    protected readonly eventMap: EventHandlerMap = BasePlugin.defaultEventMap;

    /**
     * Plugin-scoped middleware manager.
     */
    private middlewareManager = new PluginMiddlewareManager();

    /**
     * Framework registration method. Sets up context and calls onRegister().
     * Should not be overridden by child classes; use onRegister() instead.
     *
     * @param ctx - The plugin context.
     */
    public async register(ctx: PluginContext): Promise<void> {
        this.context = ctx;
        await this.onRegister();
        const handlerBindings = ctx.handlerBindings ?? this.eventMap;
        registerMappedHandlers(this, ctx.eventBus, handlerBindings, {
            logger: ctx.logger,
            getMiddleware: () => this.middlewareManager.list(),
            suppressMissingHandlers: handlerBindings === BasePlugin.defaultEventMap,
        });
        this.context.logger.info(`Plugin '${this.name}' registered successfully.`);
    }

    /**
     * Lifecycle method called during plugin registration.
     * To be overridden by child classes for custom setup.
     */
    protected async onRegister(): Promise<void> {
        // Optional override for child plugins
    }

    /**
     * Registers plugin-scoped middleware for all handlers in this plugin.
     *
     * @param middleware - Middleware instances to register
     */
    protected addMiddleware(middleware: EventMiddleware[] | EventMiddleware): void {
        this.middlewareManager.add(middleware);
    }

    /**
     * Returns the currently registered plugin middleware.
     */
    protected getPluginMiddleware(): EventMiddleware[] {
        return this.middlewareManager.list();
    }
}
