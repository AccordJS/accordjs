import { DEFAULT_INTENTS } from '@app/bot/intents';
import { Client } from 'discord.js';

/**
 * Creates and initializes a Discord.js client instance.
 *
 * @param intents - Gateway intents for the client.
 * @returns Initialized Discord.js client.
 */
export const createDiscordClient = (intents: readonly number[] = DEFAULT_INTENTS): Client => {
    return new Client({
        intents,
    });
};
