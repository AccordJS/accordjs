import type { PluginContext } from '@app/types';
import { BasePlugin } from '../base-plugin';
import { InMemoryCommandRegistry } from './command-registry';
import { CommandParser } from './parser';
import type { Command, CommandContext, CommandRegistry } from './types';

/**
 * Interface for chunked timeouts that support proper cancellation
 */
interface ChunkedTimeout {
    readonly cancelled: boolean;
    cancel(): void;
}

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
    protected cooldownCleanupTimers = new Map<string, Map<string, NodeJS.Timeout | ChunkedTimeout>>();

    // Maximum safe timeout value for setTimeout (2^31 - 1 milliseconds ≈ 24.8 days)
    private static readonly MAX_TIMEOUT_MS = 2_147_483_647;

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
     * Uses safe timeout handling to avoid JavaScript's setTimeout limit of ~24.8 days.
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
            const commandTimers =
                this.cooldownCleanupTimers.get(commandName) ?? new Map<string, NodeJS.Timeout | ChunkedTimeout>();
            const existingTimer = commandTimers.get(userId);
            if (existingTimer) {
                // Handle both NodeJS.Timeout and ChunkedTimeout
                if ('cancel' in existingTimer) {
                    existingTimer.cancel();
                } else {
                    clearTimeout(existingTimer);
                }
            }

            // Use safe timeout to handle cooldowns longer than JavaScript's setTimeout limit
            const safeTimer = this.createSafeTimeout(
                () => this.performCooldownCleanup(commandName, userId, context),
                cooldownMs,
                context
            );

            // Store the cleanup timer
            commandTimers.set(userId, safeTimer);
            this.cooldownCleanupTimers.set(commandName, commandTimers);
        } catch (error) {
            context.logger.error(
                error,
                `Failed to schedule cooldown cleanup for user ${userId} on command '${commandName}'`
            );
        }
    }

    /**
     * Performs the actual cooldown cleanup logic.
     * Separated for better testability and reuse.
     *
     * @param commandName - The name of the command.
     * @param userId - The user ID for the cooldown.
     * @param context - The plugin context for logging.
     */
    protected performCooldownCleanup(commandName: string, userId: string, context: PluginContext): void {
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
    }

    /**
     * Creates a safe timeout that handles delays longer than JavaScript's setTimeout limit.
     * Delays longer than ~24.8 days are chunked into smaller intervals to prevent
     * immediate execution due to integer overflow.
     *
     * @param callback - The function to execute after the delay.
     * @param delayMs - The total delay in milliseconds.
     * @param context - The plugin context for logging.
     * @returns A timeout handle that can be cancelled properly.
     */
    public createSafeTimeout(
        callback: () => void,
        delayMs: number,
        context: PluginContext
    ): NodeJS.Timeout | ChunkedTimeout {
        if (delayMs <= CommandRouterPlugin.MAX_TIMEOUT_MS) {
            // Safe to use direct setTimeout
            return setTimeout(callback, delayMs);
        }

        // For long delays, chunk into smaller intervals with proper cancellation support
        context.logger.debug(
            `Using chunked timeout for delay ${delayMs}ms (exceeds limit of ${CommandRouterPlugin.MAX_TIMEOUT_MS}ms)`
        );

        const chunkSize = CommandRouterPlugin.MAX_TIMEOUT_MS;
        let remainingDelay = delayMs;
        let currentTimerId: NodeJS.Timeout | null = null;
        let isCancelled = false;

        const timeoutRef: ChunkedTimeout = {
            get cancelled() {
                return isCancelled;
            },
            cancel() {
                isCancelled = true;
                if (currentTimerId) {
                    clearTimeout(currentTimerId);
                    currentTimerId = null;
                }
            },
        };

        const scheduleChunk = (): void => {
            if (isCancelled) return;

            if (remainingDelay <= chunkSize) {
                // Final chunk
                currentTimerId = setTimeout(() => {
                    if (!isCancelled) {
                        callback();
                    }
                }, remainingDelay);
                return;
            }

            // Schedule next chunk
            remainingDelay -= chunkSize;
            currentTimerId = setTimeout(() => {
                if (!isCancelled) {
                    scheduleChunk();
                }
            }, chunkSize);
        };

        scheduleChunk();
        return timeoutRef;
    }

    /**
     * Proxy method for registering commands to the internal registry.
     */
    public registerCommand(command: Command): void {
        this.registry.register(command);
    }

    /**
     * Cleans up all active cooldown timers and cooldown entries.
     * This method should be called during test teardown or plugin shutdown
     * to prevent memory leaks and long-running timer handles.
     */
    public cleanup(): void {
        // Clear all cooldown cleanup timers
        for (const commandTimers of this.cooldownCleanupTimers.values()) {
            for (const timer of commandTimers.values()) {
                // Handle both NodeJS.Timeout and ChunkedTimeout
                if ('cancel' in timer) {
                    timer.cancel();
                } else {
                    clearTimeout(timer);
                }
            }
        }

        // Clear all data structures
        this.cooldownCleanupTimers.clear();
        this.cooldowns.clear();
    }
}
