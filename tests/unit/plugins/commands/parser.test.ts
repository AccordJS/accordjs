import { describe, expect, it } from 'bun:test';
import { CommandParser } from '@app/plugins/commands/parser';

describe('CommandParser', () => {
    const parser = new CommandParser('!');

    it('should identify a valid command with prefix', () => {
        const result = parser.parse('!ping');
        expect(result.isCommand).toBe(true);
        expect(result.commandName).toBe('ping');
        expect(result.args).toEqual([]);
    });

    it('should parse command with multiple arguments', () => {
        const result = parser.parse('!echo hello world');
        expect(result.isCommand).toBe(true);
        expect(result.commandName).toBe('echo');
        expect(result.args).toEqual(['hello', 'world']);
    });

    it('should handle extra whitespace between arguments', () => {
        const result = parser.parse('!test   arg1    arg2  ');
        expect(result.isCommand).toBe(true);
        expect(result.commandName).toBe('test');
        expect(result.args).toEqual(['arg1', 'arg2']);
    });

    it('should return isCommand: false for message without prefix', () => {
        const result = parser.parse('hello world');
        expect(result.isCommand).toBe(false);
    });

    it('should return isCommand: false for message with only prefix', () => {
        const result = parser.parse('!');
        expect(result.isCommand).toBe(false);
    });

    it('should normalize command name to lowercase', () => {
        const result = parser.parse('!pInG');
        expect(result.isCommand).toBe(true);
        expect(result.commandName).toBe('ping');
    });

    it('should support custom prefixes', () => {
        const customParser = new CommandParser('?');
        const result = customParser.parse('?help');
        expect(result.isCommand).toBe(true);
        expect(result.commandName).toBe('help');
    });
});
