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

        // Validate command name doesn't conflict with existing commands OR aliases
        if (this.commands.has(normalizedName)) {
            throw new Error(`Command with name '${normalizedName}' is already registered.`);
        }
        if (this.aliases.has(normalizedName)) {
            throw new Error(`Command name '${normalizedName}' conflicts with existing alias.`);
        }

        // Validate ALL aliases before making any changes to ensure atomic operation
        const normalizedAliases: string[] = [];
        if (command.aliases) {
            for (const alias of command.aliases) {
                const normalizedAlias = alias.toLowerCase();

                // Check for conflicts with existing commands
                if (this.commands.has(normalizedAlias)) {
                    throw new Error(`Alias '${normalizedAlias}' conflicts with existing command.`);
                }

                // Check for conflicts with existing aliases
                if (this.aliases.has(normalizedAlias)) {
                    throw new Error(`Alias '${normalizedAlias}' is already registered.`);
                }

                // Check for conflicts within the same command's aliases
                if (normalizedAliases.includes(normalizedAlias)) {
                    throw new Error(`Duplicate alias '${normalizedAlias}' in command definition.`);
                }

                normalizedAliases.push(normalizedAlias);
            }
        }

        // All validations passed - now perform atomic registration
        this.commands.set(normalizedName, command);

        // Register all aliases
        for (const normalizedAlias of normalizedAliases) {
            this.aliases.set(normalizedAlias, normalizedName);
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
