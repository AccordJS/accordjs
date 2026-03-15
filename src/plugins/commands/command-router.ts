import type { PluginContext } from '@app/types';
import { BasePlugin } from '../base-plugin';
import { InMemoryCommandRegistry } from './command-registry';
import { CommandParser } from './parser';
import type { Command, CommandContext, CommandRegistry } from './types';

/**
 * Main command router plugin for AccordJS.
 *
 * Listens for normalized message creation events, parses them for commands,
 * and orchestrates command execution with proper lifecycle logging.
 */
export class CommandRouterPlugin extends BasePlugin {
    public readonly name = 'CommandRouter';
    protected registry: CommandRegistry;
    protected parser: CommandParser;
    protected cooldowns = new Map<string, Map<string, number>>();
    protected cooldownCleanupTimers = new Map<string, Map<string, NodeJS.Timeout>>();

    /**
     * @param registry - Command registry for command management.
     * @param prefix - Command prefix to look for in messages.
     */
    constructor(registry: CommandRegistry = new InMemoryCommandRegistry(), prefix = '!') {
        super();
        this.registry = registry;
        this.parser = new CommandParser(prefix);
    }

    /**
     * Registers the command router plugin and starts listening for events.
     */
    protected override async onRegister(): Promise<void> {
        if (!this.context) {
            throw new Error('Plugin context not available');
        }

        const context = this.context;
        context.eventBus.subscribe('MESSAGE_CREATE', async (event) => {
            if (event.isBot) {
                return;
            }

            const parseResult = this.parser.parse(event.content);
            if (!parseResult.isCommand || !parseResult.commandName) {
                return;
            }

            const command = this.registry.find(parseResult.commandName);
            if (!command) {
                context.logger.debug(`Command not found: '${parseResult.commandName}'`);
                return;
            }

            // 1. Check Permissions (Security-first: fail closed if permissions are defined)
            if (command.permissions && command.permissions.length > 0) {
                // Security-first approach: deny access if permissions are defined but not validated
                context.logger.warn(
                    `Command '${command.name}' requires permissions ${JSON.stringify(command.permissions)} but permission validation is not implemented. Access denied.`
                );

                // Publish a permission denied event for auditing
                context.eventBus.publish('COMMAND_PERMISSION_DENIED', {
                    type: 'COMMAND_PERMISSION_DENIED',
                    timestamp: Date.now(),
                    userId: event.userId,
                    channelId: event.channelId,
                    serverId: event.serverId,
                    commandName: command.name,
                    requiredPermissions: command.permissions,
                    reason: 'Permission validation not implemented',
                });

                return; // Fail closed - deny access
            }

            // 2. Check Cooldown
            if (command.cooldown) {
                const now = Date.now();
                const timestamps = this.cooldowns.get(command.name) ?? new Map<string, number>();
                const expirationTime = (timestamps.get(event.userId) ?? 0) + command.cooldown;

                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000;
                    context.logger.info(
                        `User ${event.userId} is on cooldown for command '${command.name}'. ${timeLeft.toFixed(1)}s left.`
                    );
                    return;
                }

                // Set new cooldown timestamp
                timestamps.set(event.userId, now);
                this.cooldowns.set(command.name, timestamps);

                // Schedule cleanup to prevent memory leaks
                this.scheduleCooldownCleanup(command.name, event.userId, command.cooldown, context);
            }

            await this.dispatch(command, event, parseResult.args ?? [], context);
        });

        context.logger.info(`Command router registered with registry and parser.`);
    }

    /**
     * Dispatches a command for execution.
     *
     * @param command - The command to execute.
     * @param event - The triggering message event.
     * @param args - Parsed command arguments.
     * @param pluginContext - Framework-wide plugin context.
     */
    protected async dispatch(
        command: Command,
        event: { userId: string; channelId: string; serverId?: string; content: string },
        args: string[],
        pluginContext: PluginContext
    ): Promise<void> {
        const commandContext: CommandContext = {
            eventBus: pluginContext.eventBus,
            config: pluginContext.config,
            logger: pluginContext.logger,
            userId: event.userId,
            channelId: event.channelId,
            serverId: event.serverId,
        };

        const startTime = Date.now();

        pluginContext.eventBus.publish('COMMAND_DISPATCH', {
            type: 'COMMAND_DISPATCH',
            timestamp: startTime,
            userId: event.userId,
            channelId: event.channelId,
            serverId: event.serverId,
            commandName: command.name,
            arguments: args,
            rawContent: event.content,
        });

        try {
            await command.execute(commandContext, args);

            const endTime = Date.now();
            pluginContext.eventBus.publish('COMMAND_EXECUTE', {
                type: 'COMMAND_EXECUTE',
                timestamp: endTime,
                userId: event.userId,
                channelId: event.channelId,
                serverId: event.serverId,
                commandName: command.name,
                durationMs: endTime - startTime,
            });
        } catch (error) {
            const errorTime = Date.now();
            const errorMessage = error instanceof Error ? error.message : String(error);

            pluginContext.logger.error(error, `Execution failed for command '${command.name}'`);

            pluginContext.eventBus.publish('COMMAND_ERROR', {
                type: 'COMMAND_ERROR',
                timestamp: errorTime,
                userId: event.userId,
                channelId: event.channelId,
                serverId: event.serverId,
                commandName: command.name,
                error: errorMessage,
            });
        }
    }

    /**
     * Schedules cleanup of a cooldown entry to prevent memory leaks.
     *
     * @param commandName - The name of the command.
     * @param userId - The user ID for the cooldown.
     * @param cooldownMs - The cooldown duration in milliseconds.
     * @param context - The plugin context for logging.
     */
    protected scheduleCooldownCleanup(
        commandName: string,
        userId: string,
        cooldownMs: number,
        context: PluginContext
    ): void {
        try {
            // Clear any existing cleanup timer for this command/user combination
            const commandTimers = this.cooldownCleanupTimers.get(commandName) ?? new Map<string, NodeJS.Timeout>();
            const existingTimer = commandTimers.get(userId);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            // Schedule cleanup after cooldown expires
            const cleanupTimer = setTimeout(() => {
                try {
                    // Remove the cooldown entry
                    const timestamps = this.cooldowns.get(commandName);
                    if (timestamps) {
                        timestamps.delete(userId);
                        // If no more users have cooldowns for this command, remove the command entry
                        if (timestamps.size === 0) {
                            this.cooldowns.delete(commandName);
                        }
                    }

                    // Remove the cleanup timer
                    const timers = this.cooldownCleanupTimers.get(commandName);
                    if (timers) {
                        timers.delete(userId);
                        // If no more timers for this command, remove the command entry
                        if (timers.size === 0) {
                            this.cooldownCleanupTimers.delete(commandName);
                        }
                    }

                    context.logger.debug(`Cleaned up cooldown for user ${userId} on command '${commandName}'`);
                } catch (cleanupError) {
                    context.logger.error(
                        cleanupError,
                        `Failed to clean up cooldown for user ${userId} on command '${commandName}'`
                    );
                }
            }, cooldownMs);

            // Store the cleanup timer
            commandTimers.set(userId, cleanupTimer);
            this.cooldownCleanupTimers.set(commandName, commandTimers);
        } catch (error) {
            context.logger.error(
                error,
                `Failed to schedule cooldown cleanup for user ${userId} on command '${commandName}'`
            );
        }
    }

    /**
     * Proxy method for registering commands to the internal registry.
     */
    public registerCommand(command: Command): void {
        this.registry.register(command);
    }
}
