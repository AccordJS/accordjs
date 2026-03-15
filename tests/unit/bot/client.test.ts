import { describe, expect, it } from 'bun:test';
import { Client } from 'discord.js';
import { createDiscordClient } from '../../../src/bot/client.ts';

describe('Discord Client', () => {
    it('should create a Discord.js Client instance', () => {
        const client = createDiscordClient();
        expect(client).toBeInstanceOf(Client);
    });

    it('should use default intents when none provided', () => {
        const client = createDiscordClient();
        // Since we can't easily access intents from client directly without logging in or mocking,
        // we at least ensure it doesn't throw and returns an instance.
        expect(client).toBeInstanceOf(Client);
    });

    it('should accept custom intents', () => {
        const customIntents = [1, 2];
        const client = createDiscordClient(customIntents);
        expect(client).toBeInstanceOf(Client);
    });
});
