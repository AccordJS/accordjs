import { GatewayIntentBits } from 'discord.js';

/**
 * Default Discord gateway intents for AccordJS.
 *
 * Includes common intents needed for message and member events.
 */
export const DEFAULT_INTENTS = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
];
