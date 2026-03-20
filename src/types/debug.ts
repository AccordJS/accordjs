import { z } from 'zod';

export const DiscordClientDebugEventSchema = z.enum([
    'clientReady',
    'guildCreate',
    'guildDelete',
    'guildUnavailable',
    'guildMemberAdd',
    'guildMemberRemove',
    'messageCreate',
    'messageDelete',
    'messageUpdate',
    'interactionCreate',
    'presenceUpdate',
    'voiceStateUpdate',
    'error',
    'warn',
    'debug',
]);

export type DiscordClientDebugEvent = z.infer<typeof DiscordClientDebugEventSchema>;

export const DEFAULT_DISCORD_CLIENT_DEBUG_EVENTS = [
    'clientReady',
    'guildCreate',
    'guildDelete',
    'guildUnavailable',
    'guildMemberAdd',
    'guildMemberRemove',
    'messageCreate',
    'messageDelete',
    'messageUpdate',
    'interactionCreate',
    'presenceUpdate',
    'voiceStateUpdate',
    'error',
    'warn',
    'debug',
] as const satisfies readonly DiscordClientDebugEvent[];
