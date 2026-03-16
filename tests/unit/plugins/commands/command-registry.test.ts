import { describe, expect, it, mock } from 'bun:test';
import { InMemoryCommandRegistry } from '@app/plugins/commands/command-registry';
import type { Command } from '@app/plugins/commands/types';

describe('InMemoryCommandRegistry', () => {
    it('should register and find a command by name', () => {
        const registry = new InMemoryCommandRegistry();
        const command: Command = {
            name: 'ping',
            description: 'Pings the bot',
            execute: mock(async () => {}),
        };

        registry.register(command);
        expect(registry.find('ping')).toBe(command);
    });

    it('should find a command regardless of casing', () => {
        const registry = new InMemoryCommandRegistry();
        const command: Command = {
            name: 'pInG',
            description: 'Pings the bot',
            execute: mock(async () => {}),
        };

        registry.register(command);
        expect(registry.find('PING')).toBe(command);
        expect(registry.find('ping')).toBe(command);
    });

    it('should find a command by alias', () => {
        const registry = new InMemoryCommandRegistry();
        const command: Command = {
            name: 'ping',
            aliases: ['p'],
            description: 'Pings the bot',
            execute: mock(async () => {}),
        };

        registry.register(command);
        expect(registry.find('p')).toBe(command);
    });

    it('should throw if command name is already registered', () => {
        const registry = new InMemoryCommandRegistry();
        const command: Command = {
            name: 'ping',
            description: 'Pings the bot',
            execute: mock(async () => {}),
        };

        registry.register(command);
        expect(() => registry.register(command)).toThrow("Command with name 'ping' is already registered.");
    });

    it('should throw if alias conflicts with another command or alias', () => {
        const registry = new InMemoryCommandRegistry();
        const cmd1: Command = {
            name: 'ping',
            aliases: ['p'],
            description: 'Pings the bot',
            execute: mock(async () => {}),
        };
        const cmd2: Command = {
            name: 'pong',
            aliases: ['p'],
            description: 'Pongs the bot',
            execute: mock(async () => {}),
        };

        registry.register(cmd1);
        expect(() => registry.register(cmd2)).toThrow("Alias 'p' is already registered.");
    });

    it('should reject command names that conflict with existing aliases', () => {
        const registry = new InMemoryCommandRegistry();
        const cmd1: Command = {
            name: 'ping',
            aliases: ['p'],
            description: 'Pings the bot',
            execute: mock(async () => {}),
        };
        const cmd2: Command = {
            name: 'p', // This should conflict with the alias 'p' from cmd1
            description: 'Another command',
            execute: mock(async () => {}),
        };

        registry.register(cmd1);
        expect(() => registry.register(cmd2)).toThrow("Command name 'p' conflicts with existing alias.");
    });

    it('should reject aliases that conflict with existing command names', () => {
        const registry = new InMemoryCommandRegistry();
        const cmd1: Command = {
            name: 'ping',
            description: 'Pings the bot',
            execute: mock(async () => {}),
        };
        const cmd2: Command = {
            name: 'pong',
            aliases: ['ping'], // This should conflict with the command name 'ping'
            description: 'Pongs the bot',
            execute: mock(async () => {}),
        };

        registry.register(cmd1);
        expect(() => registry.register(cmd2)).toThrow("Alias 'ping' conflicts with existing command.");
    });

    it('should perform atomic registration - no partial state on alias validation failure', () => {
        const registry = new InMemoryCommandRegistry();
        const cmd1: Command = {
            name: 'ping',
            aliases: ['p'],
            description: 'Pings the bot',
            execute: mock(async () => {}),
        };
        const cmd2: Command = {
            name: 'test',
            aliases: ['t', 'p'], // Second alias conflicts with existing alias
            description: 'Test command',
            execute: mock(async () => {}),
        };

        registry.register(cmd1);

        // This should fail and leave no partial registration
        expect(() => registry.register(cmd2)).toThrow("Alias 'p' is already registered.");

        // Verify cmd2 was not registered at all
        expect(registry.find('test')).toBeUndefined();
        expect(registry.find('t')).toBeUndefined();

        // Verify cmd1 is still properly registered
        expect(registry.find('ping')).toBe(cmd1);
        expect(registry.find('p')).toBe(cmd1);
    });

    it('should reject duplicate aliases within the same command', () => {
        const registry = new InMemoryCommandRegistry();
        const command: Command = {
            name: 'test',
            aliases: ['t', 'T'], // Case-insensitive duplicate
            description: 'Test command',
            execute: mock(async () => {}),
        };

        expect(() => registry.register(command)).toThrow("Duplicate alias 't' in command definition.");
    });

    it('should validate all aliases before any mutations', () => {
        const registry = new InMemoryCommandRegistry();
        const cmd1: Command = {
            name: 'ping',
            description: 'Pings the bot',
            execute: mock(async () => {}),
        };
        const cmd2: Command = {
            name: 'existing',
            aliases: ['e'],
            description: 'Existing command',
            execute: mock(async () => {}),
        };
        const cmd3: Command = {
            name: 'test',
            aliases: ['valid', 'ping', 'e'], // Multiple conflicts: 'ping' with command, 'e' with alias
            description: 'Test command',
            execute: mock(async () => {}),
        };

        registry.register(cmd1);
        registry.register(cmd2);

        // Should fail on first conflict found
        expect(() => registry.register(cmd3)).toThrow("Alias 'ping' conflicts with existing command.");

        // Verify no partial registration occurred
        expect(registry.find('test')).toBeUndefined();
        expect(registry.find('valid')).toBeUndefined();

        // Verify existing commands are unaffected
        expect(registry.find('ping')).toBe(cmd1);
        expect(registry.find('existing')).toBe(cmd2);
        expect(registry.find('e')).toBe(cmd2);
    });

    it('should return all registered commands', () => {
        const registry = new InMemoryCommandRegistry();
        const cmd1: Command = { name: 'c1', description: 'd1', execute: mock(async () => {}) };
        const cmd2: Command = { name: 'c2', description: 'd2', execute: mock(async () => {}) };

        registry.register(cmd1);
        registry.register(cmd2);

        expect(registry.getAll()).toEqual([cmd1, cmd2]);
    });

    it('should handle empty aliases array gracefully', () => {
        const registry = new InMemoryCommandRegistry();
        const command: Command = {
            name: 'test',
            aliases: [], // Empty aliases array
            description: 'Test command',
            execute: mock(async () => {}),
        };

        expect(() => registry.register(command)).not.toThrow();
        expect(registry.find('test')).toBe(command);
    });

    it('should maintain case insensitive behavior consistently', () => {
        const registry = new InMemoryCommandRegistry();
        const cmd1: Command = {
            name: 'PING',
            aliases: ['P'],
            description: 'Pings the bot',
            execute: mock(async () => {}),
        };
        const cmd2: Command = {
            name: 'ping', // Should conflict case-insensitively
            description: 'Another command',
            execute: mock(async () => {}),
        };
        const cmd3: Command = {
            name: 'test',
            aliases: ['p'], // Should conflict with alias case-insensitively
            description: 'Test command',
            execute: mock(async () => {}),
        };

        registry.register(cmd1);

        // Command name conflict
        expect(() => registry.register(cmd2)).toThrow("Command with name 'ping' is already registered.");

        // Alias conflict
        expect(() => registry.register(cmd3)).toThrow("Alias 'p' is already registered.");

        // Verify original command is still accessible with case variations
        expect(registry.find('ping')).toBe(cmd1);
        expect(registry.find('PING')).toBe(cmd1);
        expect(registry.find('p')).toBe(cmd1);
        expect(registry.find('P')).toBe(cmd1);
    });

    it('should handle complex conflict scenarios with mixed case', () => {
        const registry = new InMemoryCommandRegistry();
        const cmd1: Command = {
            name: 'Test',
            aliases: ['T', 'te'],
            description: 'Test command',
            execute: mock(async () => {}),
        };
        const cmd2: Command = {
            name: 'other',
            aliases: ['TEST'], // Should conflict with command name 'Test'
            description: 'Other command',
            execute: mock(async () => {}),
        };

        registry.register(cmd1);
        expect(() => registry.register(cmd2)).toThrow("Alias 'test' conflicts with existing command.");
    });
});
