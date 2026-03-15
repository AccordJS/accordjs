import { describe, expect, it } from 'bun:test';
import { normalizeMessage } from '@app/events/normalize-message';
import type { Message, User } from 'discord.js';

describe('Message Normalization', () => {
    it('should correctly normalize a Discord message', () => {
        const mockUser = {
            id: 'user-123',
            username: 'testuser',
            tag: 'testuser#1234',
            bot: false,
        } as User;

        const mockMessage = {
            id: 'msg-123',
            createdTimestamp: 1710450000000,
            channelId: 'chan-123',
            author: mockUser,
            guildId: 'guild-123',
            content: 'Hello AccordJS!',
        } as Message;

        const normalized = normalizeMessage(mockMessage);

        expect(normalized).toEqual({
            type: 'MESSAGE_CREATE',
            timestamp: 1710450000000,
            messageId: 'msg-123',
            channelId: 'chan-123',
            userId: 'user-123',
            serverId: 'guild-123',
            content: 'Hello AccordJS!',
            authorName: 'testuser',
            authorTag: 'testuser#1234',
            isBot: false,
        });
    });

    it('should handle messages without a guildId (Direct Messages)', () => {
        const mockUser = {
            id: 'user-123',
            username: 'testuser',
            tag: 'testuser#1234',
            bot: false,
        } as User;

        const mockMessage = {
            id: 'msg-456',
            createdTimestamp: 1710450000000,
            channelId: 'dm-123',
            author: mockUser,
            guildId: null,
            content: 'Direct message content',
        } as Message;

        const normalized = normalizeMessage(mockMessage);

        expect(normalized.serverId).toBeUndefined();
        expect(normalized.type).toBe('MESSAGE_CREATE');
    });

    it('should throw if data is missing or invalid', () => {
        const mockUser = {
            id: 'user-123',
            // Missing username/tag/bot
        } as User;

        const mockMessage = {
            id: 'msg-123',
            // Missing others
            author: mockUser,
        } as Message;

        expect(() => normalizeMessage(mockMessage)).toThrow();
    });
});
