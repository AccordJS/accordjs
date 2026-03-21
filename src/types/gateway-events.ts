import { z } from 'zod';

export const GatewayEventSchema = z.enum([
    'messageCreate',
    'messageDelete',
    'guildCreate',
    'guildDelete',
    'guildMemberAdd',
    'guildMemberRemove',
]);

export type GatewayEvent = z.infer<typeof GatewayEventSchema>;

export const DEFAULT_GATEWAY_EVENTS = [...GatewayEventSchema.options];

export const GATEWAY_EVENT_DESCRIPTIONS: Record<GatewayEvent, string> = {
    messageCreate: 'Discord.js gateway event for a newly created message.',
    messageDelete: 'Discord.js gateway event for a deleted message.',
    guildCreate: 'Discord.js gateway event for a guild becoming available to the client.',
    guildDelete: 'Discord.js gateway event for a guild becoming unavailable or inaccessible to the client.',
    guildMemberAdd: 'Discord.js gateway event for a member joining a guild.',
    guildMemberRemove: 'Discord.js gateway event for a member leaving or being removed from a guild.',
};

export const GATEWAY_TO_ACCORD_EVENT_MAP: Record<GatewayEvent, string> = {
    messageCreate: 'MESSAGE_CREATE',
    messageDelete: 'MESSAGE_DELETE',
    guildCreate: 'GUILD_AVAILABLE',
    guildDelete: 'GUILD_UNAVAILABLE',
    guildMemberAdd: 'MEMBER_JOIN',
    guildMemberRemove: 'MEMBER_LEAVE',
};
