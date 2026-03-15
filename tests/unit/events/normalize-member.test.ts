import { describe, expect, it } from 'bun:test';
import type { Guild, GuildMember, User } from 'discord.js';
import { normalizeMember } from '../../../src/events/normalize-member.ts';

describe('Member Join Normalization', () => {
    it('should correctly normalize a member join event', () => {
        const mockUser = {
            id: 'user-789',
            username: 'newmember',
        } as User;

        const mockGuild = {
            id: 'guild-456',
        } as Guild;

        const mockMember = {
            id: 'user-789',
            user: mockUser,
            guild: mockGuild,
            joinedTimestamp: 1710450000000,
        } as GuildMember;

        const normalized = normalizeMember(mockMember);

        expect(normalized.type).toBe('MEMBER_JOIN');
        expect(normalized.userId).toBe('user-789');
        expect(normalized.serverId).toBe('guild-456');
        expect(normalized.username).toBe('newmember');
        expect(normalized.joinedAt).toBe(1710450000000);
    });

    it('should use current timestamp if joinedTimestamp is missing', () => {
        const mockUser = {
            id: 'user-789',
            username: 'newmember',
        } as User;

        const mockGuild = {
            id: 'guild-456',
        } as Guild;

        const mockMember = {
            id: 'user-789',
            user: mockUser,
            guild: mockGuild,
            joinedTimestamp: null,
        } as GuildMember;

        const normalized = normalizeMember(mockMember);

        expect(normalized.joinedAt).toBeGreaterThan(0);
        expect(normalized.username).toBe('newmember');
    });

    it('should throw if critical data is missing', () => {
        const mockMember = {
            id: 'user-789',
            // Missing guild and user
        } as GuildMember;

        expect(() => normalizeMember(mockMember)).toThrow();
    });
});
