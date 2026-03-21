import { describe, expect, it } from 'bun:test';
import { normalizeMessage, normalizeMessageDelete } from '@app/normalizers/normalize-message';
import type { Message, PartialMessage, User } from 'discord.js';

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

    it('should correctly normalize a deleted Discord message', () => {
        const mockUser = {
            id: 'user-123',
            username: 'testuser',
            tag: 'testuser#1234',
            bot: false,
        } as User;

        const mockMessage = {
            id: 'msg-delete-123',
            channelId: 'chan-123',
            author: mockUser,
            guildId: 'guild-123',
        } as Message;

        const normalized = normalizeMessageDelete(mockMessage);

        expect(normalized).toEqual({
            type: 'MESSAGE_DELETE',
            timestamp: expect.any(Number),
            deletedAt: expect.any(Number),
            messageId: 'msg-delete-123',
            channelId: 'chan-123',
            userId: 'user-123',
            serverId: 'guild-123',
            authorId: 'user-123',
        });
    });

    it('should normalize a partial deleted message without author details', () => {
        const mockMessage = {
            id: 'msg-delete-456',
            channelId: 'chan-999',
            guildId: null,
        } as PartialMessage;

        const normalized = normalizeMessageDelete(mockMessage);

        expect(normalized).toEqual({
            type: 'MESSAGE_DELETE',
            timestamp: expect.any(Number),
            deletedAt: expect.any(Number),
            messageId: 'msg-delete-456',
            channelId: 'chan-999',
            userId: undefined,
            serverId: undefined,
            authorId: undefined,
        });
    });

    it('should throw for deleted messages missing required identifiers', () => {
        const mockMessage = {
            id: 'msg-delete-789',
        } as PartialMessage;

        expect(() => normalizeMessageDelete(mockMessage)).toThrow();
    });
});
