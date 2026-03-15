import type { Command, CommandRegistry } from './types';

/**
 * In-memory implementation of the CommandRegistry.
 *
 * Stores commands by name and provides fast lookup by alias.
 */
export class InMemoryCommandRegistry implements CommandRegistry {
    protected commands = new Map<string, Command>();
    protected aliases = new Map<string, string>();

    /**
     * Registers a new command with the registry.
     *
     * @param command - The command definition to register.
     * @throws Error if command name or alias is already registered.
     */
    public register(command: Command): void {
        const normalizedName = command.name.toLowerCase();

        if (this.commands.has(normalizedName)) {
            throw new Error(`Command with name '${normalizedName}' is already registered.`);
        }

        this.commands.set(normalizedName, command);

        if (command.aliases) {
            for (const alias of command.aliases) {
                const normalizedAlias = alias.toLowerCase();
                if (this.aliases.has(normalizedAlias) || this.commands.has(normalizedAlias)) {
                    throw new Error(`Alias/Command '${normalizedAlias}' is already registered.`);
                }
                this.aliases.set(normalizedAlias, normalizedName);
            }
        }
    }

    /**
     * Finds a command by name or alias.
     *
     * @param name - The name or alias to search for.
     */
    public find(name: string): Command | undefined {
        const normalizedName = name.toLowerCase();
        const mainName = this.aliases.get(normalizedName) ?? normalizedName;
        return this.commands.get(mainName);
    }

    /**
     * Returns an array of all registered command definitions.
     */
    public getAll(): Command[] {
        return Array.from(this.commands.values());
    }
}
