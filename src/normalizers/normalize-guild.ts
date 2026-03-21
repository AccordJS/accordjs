import {
    type GuildAvailableEvent,
    GuildAvailableEventSchema,
    type GuildUnavailableEvent,
    GuildUnavailableEventSchema,
} from '@app/types';
import type { Guild } from 'discord.js';

type GuildUnavailableLike = Guild & {
    unavailable?: boolean;
};

export const normalizeGuildAvailable = (guild: Guild): GuildAvailableEvent => {
    const timestamp = Date.now();

    return GuildAvailableEventSchema.parse({
        type: 'GUILD_AVAILABLE',
        timestamp,
        serverId: guild.id,
        guildName: guild.name,
        memberCount: guild.memberCount,
    });
};

export const normalizeGuildUnavailable = (guild: GuildUnavailableLike): GuildUnavailableEvent => {
    const timestamp = Date.now();

    return GuildUnavailableEventSchema.parse({
        type: 'GUILD_UNAVAILABLE',
        timestamp,
        serverId: guild.id,
        guildName: guild.name,
        memberCount: guild.memberCount,
        unavailable: guild.unavailable,
    });
};
