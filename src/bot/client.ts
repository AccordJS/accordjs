import { Client } from 'discord.js';
import { DEFAULT_INTENTS } from './intents.ts';

/**
 * Creates and initializes a Discord.js client instance.
 *
 * @param intents - Gateway intents for the client.
 * @returns Initialized Discord.js client.
 */
export const createDiscordClient = (intents: number[] = DEFAULT_INTENTS): Client => {
    return new Client({
        intents,
    });
};
