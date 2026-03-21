import { type MemberJoinEvent, MemberJoinEventSchema, type MemberLeaveEvent, MemberLeaveEventSchema } from '@app/types';
import type { GuildMember, PartialGuildMember } from 'discord.js';

type GuildMemberLike = GuildMember | PartialGuildMember;

const getUsername = (member: GuildMemberLike): string => {
    return member.user?.username ?? 'unknown';
};

/**
 * Normalizes a Discord.js guildMemberAdd payload into an AccordJS MemberJoinEvent.
 *
 * @param member - Raw Discord.js GuildMember object.
 * @returns Validated, normalized MemberJoinEvent.
 */
export const normalizeMemberJoin = (member: GuildMember): MemberJoinEvent => {
    const rawEvent = {
        type: 'MEMBER_JOIN',
        timestamp: Date.now(),
        userId: member.id,
        serverId: member.guild.id,
        username: getUsername(member),
        joinedAt: member.joinedTimestamp ?? Date.now(),
    };

    return MemberJoinEventSchema.parse(rawEvent);
};

/**
 * Normalizes a Discord.js guildMemberRemove payload into an AccordJS MemberLeaveEvent.
 *
 * @param member - Raw Discord.js guild member payload.
 * @returns Validated, normalized MemberLeaveEvent.
 */
export const normalizeMemberLeave = (member: GuildMemberLike): MemberLeaveEvent => {
    const rawEvent = {
        type: 'MEMBER_LEAVE',
        timestamp: Date.now(),
        userId: member.id,
        serverId: member.guild.id,
        username: getUsername(member),
        leftAt: Date.now(),
    };

    return MemberLeaveEventSchema.parse(rawEvent);
};
