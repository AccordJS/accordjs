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
        expect(() => registry.register(cmd2)).toThrow("Alias/Command 'p' is already registered.");
    });

    it('should return all registered commands', () => {
        const registry = new InMemoryCommandRegistry();
        const cmd1: Command = { name: 'c1', description: 'd1', execute: mock(async () => {}) };
        const cmd2: Command = { name: 'c2', description: 'd2', execute: mock(async () => {}) };

        registry.register(cmd1);
        registry.register(cmd2);

        expect(registry.getAll()).toEqual([cmd1, cmd2]);
    });
});
