import { describe, expect, it } from 'bun:test';
import { createDiscordClient } from '@app/bot/client';
import { DEFAULT_INTENTS } from '@app/bot/intents';
import { Client, IntentsBitField } from 'discord.js';

describe('Discord Client', () => {
    it('should create a Discord.js Client instance', () => {
        const client = createDiscordClient();
        expect(client).toBeInstanceOf(Client);
    });

    it('should use default intents when none provided', () => {
        const client = createDiscordClient();
        expect(client).toBeInstanceOf(Client);
        expect(client.options.intents).toEqual(new IntentsBitField(DEFAULT_INTENTS));
    });

    it('should accept custom intents', () => {
        const customIntents = [1, 2];
        const client = createDiscordClient(customIntents);
        expect(client).toBeInstanceOf(Client);
        expect(client.options.intents).toEqual(new IntentsBitField(customIntents));
    });
});
