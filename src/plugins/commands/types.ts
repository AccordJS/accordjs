import type { EventBus } from '@app/bus/types';
import type { Config } from '@app/config';
import type { Logger } from 'pino';

/**
 * Context provided to command executors.
 */
export interface CommandContext {
    /**
     * The internal event bus for publishing/subscribing to events.
     */
    eventBus: EventBus;
    /**
     * Validated application configuration.
     */
    config: Config;
    /**
     * Command-specific logger.
     */
    logger: Logger;
    /**
     * The ID of the user who triggered the command.
     */
    userId: string;
    /**
     * The ID of the channel where the command was triggered.
     */
    channelId: string;
    /**
     * The ID of the server where the command was triggered (optional for DMs).
     */
    serverId?: string;
}

/**
 * Definition of a command in AccordJS.
 */
export interface Command {
    /**
     * The primary name of the command (e.g., 'ping').
     */
    name: string;
    /**
     * Short description of the command's purpose.
     */
    description: string;
    /**
     * Alternative names that can trigger the command.
     */
    aliases?: string[];
    /**
     * Permission level required to execute the command.
     */
    permissions?: string[];
    /**
     * Cooldown in milliseconds between command executions.
     */
    cooldown?: number;
    /**
     * The core logic to execute when the command is triggered.
     *
     * @param context - Context including event bus, config, and source IDs.
     * @param args - Parsed command arguments.
     */
    execute(context: CommandContext, args: string[]): Promise<void>;
}

/**
 * Command registry interface for managing command definitions.
 */
export interface CommandRegistry {
    /**
     * Registers a single command.
     */
    register(command: Command): void;
    /**
     * Finds a command by its name or alias.
     */
    find(name: string): Command | undefined;
    /**
     * Retrieves all registered commands.
     */
    getAll(): Command[];
}

/**
 * Result of a command string parse operation.
 */
export interface ParseResult {
    /**
     * Whether a command was actually found (matched the prefix).
     */
    isCommand: boolean;
    /**
     * The command name that was found.
     */
    commandName?: string;
    /**
     * Array of arguments passed to the command.
     */
    args?: string[];
}
