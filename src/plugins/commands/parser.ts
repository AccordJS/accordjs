import type { ParseResult } from '@app/plugins/commands/types.ts';

/**
 * Parser responsible for splitting raw message content into command metadata.
 *
 * Supports configurable prefix and argument splitting.
 */
export class CommandParser {
    protected prefix: string;

    /**
     * @param prefix - The prefix that identifies a message as a command.
     */
    constructor(prefix: string) {
        this.prefix = prefix;
    }

    /**
     * Parses raw message content into command name and arguments.
     *
     * @param content - Raw message content from Discord.
     * @returns Result indicating if a command was found and its parts.
     */
    public parse(content: string): ParseResult {
        const trimmedContent = content.trim();

        if (!trimmedContent.startsWith(this.prefix)) {
            return { isCommand: false };
        }

        const cleanContent = trimmedContent.slice(this.prefix.length).trim();
        if (cleanContent.length === 0) {
            return { isCommand: false };
        }

        const [commandName, ...args] = cleanContent.split(/\s+/);

        if (!commandName) {
            return { isCommand: false };
        }

        return {
            isCommand: true,
            commandName: commandName.toLowerCase(),
            args: args.filter((arg) => arg.length > 0),
        };
    }
}
