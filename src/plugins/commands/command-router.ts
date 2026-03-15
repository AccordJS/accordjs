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

            // 1. Check Permissions (Placeholder for now)
            if (command.permissions && command.permissions.length > 0) {
                // In a real app, we'd check against Discord member permissions
                // For now, we'll just log that we are skipping permission check
                context.logger.debug(`Permission check skipped for command '${command.name}' (not yet implemented)`);
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

                timestamps.set(event.userId, now);
                this.cooldowns.set(command.name, timestamps);
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
     * Proxy method for registering commands to the internal registry.
     */
    public registerCommand(command: Command): void {
        this.registry.register(command);
    }
}
