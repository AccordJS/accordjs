import { describe, expect, it } from 'bun:test';
import { normalizeMember, normalizeMemberLeave } from '@app/events/normalize-member';
import type { Guild, GuildMember, PartialGuildMember, User } from 'discord.js';
import { ZodError } from 'zod';

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

        const beforeCall = Date.now();
        const normalized = normalizeMember(mockMember);
        const afterCall = Date.now();

        expect(normalized.joinedAt).toBeGreaterThanOrEqual(beforeCall);
        expect(normalized.joinedAt).toBeLessThanOrEqual(afterCall);
        expect(normalized.username).toBe('newmember');
    });

    it('should throw TypeError when accessing properties on undefined guild', () => {
        const mockMember = {
            id: 'user-789',
            guild: undefined,
            user: undefined,
            // Missing guild and user - this will cause TypeError when accessing .guild.id
        } as unknown as GuildMember;

        expect(() => normalizeMember(mockMember)).toThrow(TypeError);
        // The specific error message can vary between environments (Node.js vs Bun)
        // Just verify it's a TypeError related to accessing properties on undefined
        expect(() => normalizeMember(mockMember)).toThrow(/undefined.*id|guild.*id/);
    });

    it('should throw ZodError when invalid data types are provided', () => {
        const mockMember = {
            id: 'user-789',
            guild: { id: 123 }, // Invalid: number instead of string
            user: { username: 'testuser' },
            joinedTimestamp: null,
        } as unknown as GuildMember;

        expect(() => normalizeMember(mockMember)).toThrow(ZodError);
    });
});

describe('Member Leave Normalization', () => {
    it('should correctly normalize a member leave event', () => {
        const mockMember = {
            id: 'user-789',
            guild: {
                id: 'guild-456',
            },
            user: {
                username: 'departing-member',
            },
        } as unknown as GuildMember;

        const normalized = normalizeMemberLeave(mockMember);

        expect(normalized.type).toBe('MEMBER_LEAVE');
        expect(normalized.userId).toBe('user-789');
        expect(normalized.serverId).toBe('guild-456');
        expect(normalized.username).toBe('departing-member');
        expect(typeof normalized.leftAt).toBe('number');
    });

    it('should fall back to unknown when partial member lacks username', () => {
        const mockMember = {
            id: 'user-789',
            guild: {
                id: 'guild-456',
            },
            user: undefined,
        } as unknown as PartialGuildMember;

        const normalized = normalizeMemberLeave(mockMember);

        expect(normalized.username).toBe('unknown');
    });
});
