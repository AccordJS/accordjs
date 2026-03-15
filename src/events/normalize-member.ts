import { type MemberJoinEvent, MemberJoinEventSchema } from '@app/types';
import type { GuildMember } from 'discord.js';

/**
 * Normalizes a Discord.js GuildMember object into a MemberJoinEvent.
 *
 * @param member - Raw Discord.js GuildMember object.
 * @returns Validated, normalized MemberJoinEvent.
 */
export const normalizeMember = (member: GuildMember): MemberJoinEvent => {
    const rawEvent = {
        type: 'MEMBER_JOIN',
        timestamp: Date.now(),
        userId: member.id,
        serverId: member.guild.id,
        username: member.user.username,
        joinedAt: member.joinedTimestamp ?? Date.now(),
    };

    return MemberJoinEventSchema.parse(rawEvent);
};
