import { describe, expect, it } from 'bun:test';
import {
    BotEventSchema,
    ClientStatusSnapshotSchema,
    GuildAvailableEventSchema,
    GuildUnavailableEventSchema,
    MemberJoinEventSchema,
    MemberLeaveEventSchema,
    MessageCreateEventSchema,
    MessageDeleteEventSchema,
    MessageUpdateEventSchema,
    PresenceUpdateEventSchema,
} from '@app/types/index';

describe('Foundational Zod Schemas', () => {
    describe('MessageCreateEventSchema', () => {
        it('validates a valid message create event', () => {
            const validData = {
                type: 'MESSAGE_CREATE',
                timestamp: Date.now(),
                messageId: '123',
                channelId: '456',
                userId: '789',
                content: 'Hello World',
                authorName: 'User',
                authorTag: 'User#0001',
                isBot: false,
            };

            const result = MessageCreateEventSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.type).toBe('MESSAGE_CREATE');
                expect(result.data.content).toBe('Hello World');
            }
        });

        it('fails on invalid event type', () => {
            const invalidData = {
                type: 'INVALID_TYPE',
                timestamp: Date.now(),
                messageId: '123',
                channelId: '456',
                userId: '789',
                content: 'Hello World',
                authorName: 'User',
                authorTag: 'User#0001',
                isBot: false,
            };

            const result = MessageCreateEventSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('fails when required fields are missing', () => {
            const invalidData = {
                type: 'MESSAGE_CREATE',
                timestamp: Date.now(),
                // messageId missing
                channelId: '456',
                userId: '789',
                content: 'Hello World',
                authorName: 'User',
                authorTag: 'User#0001',
                isBot: false,
            };

            const result = MessageCreateEventSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('MemberJoinEventSchema', () => {
        it('validates a valid member join event', () => {
            const validData = {
                type: 'MEMBER_JOIN',
                timestamp: Date.now(),
                userId: '123',
                serverId: '456',
                username: 'User',
                joinedAt: Date.now(),
            };

            const result = MemberJoinEventSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.type).toBe('MEMBER_JOIN');
                expect(result.data.username).toBe('User');
            }
        });
    });

    describe('MessageDeleteEventSchema', () => {
        it('validates a valid message delete event', () => {
            const validData = {
                type: 'MESSAGE_DELETE',
                timestamp: Date.now(),
                messageId: '123',
                channelId: '456',
                userId: '789',
                authorId: '789',
                deletedAt: Date.now(),
            };

            const result = MessageDeleteEventSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.type).toBe('MESSAGE_DELETE');
                expect(result.data.messageId).toBe('123');
                expect(result.data.authorId).toBe('789');
            }
        });

        it('validates a message delete event without author details', () => {
            const validData = {
                type: 'MESSAGE_DELETE',
                timestamp: Date.now(),
                messageId: '123',
                channelId: '456',
                deletedAt: Date.now(),
            };

            const result = MessageDeleteEventSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('fails when required fields are missing', () => {
            const invalidData = {
                type: 'MESSAGE_DELETE',
                timestamp: Date.now(),
                // messageId missing
                channelId: '456',
                userId: '789',
                authorId: '789',
                deletedAt: Date.now(),
            };

            const result = MessageDeleteEventSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('MessageUpdateEventSchema', () => {
        it('validates a valid message update event', () => {
            const validData = {
                type: 'MESSAGE_UPDATE',
                timestamp: Date.now(),
                messageId: '123',
                channelId: '456',
                userId: '789',
                authorId: '789',
                content: 'Updated content',
                editedAt: Date.now(),
            };

            const result = MessageUpdateEventSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('validates a sparse message update event', () => {
            const validData = {
                type: 'MESSAGE_UPDATE',
                timestamp: Date.now(),
                messageId: '123',
                channelId: '456',
            };

            const result = MessageUpdateEventSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('ClientStatusSnapshotSchema', () => {
        it('validates a client status snapshot', () => {
            const result = ClientStatusSnapshotSchema.safeParse({
                desktop: 'online',
                mobile: 'idle',
            });

            expect(result.success).toBe(true);
        });
    });

    describe('MemberLeaveEventSchema', () => {
        it('validates a valid member leave event', () => {
            const validData = {
                type: 'MEMBER_LEAVE',
                timestamp: Date.now(),
                userId: '123',
                serverId: '456',
                username: 'User',
                leftAt: Date.now(),
            };

            const result = MemberLeaveEventSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.type).toBe('MEMBER_LEAVE');
                expect(result.data.username).toBe('User');
            }
        });

        it('validates a member leave event with optional reason', () => {
            const validData = {
                type: 'MEMBER_LEAVE',
                timestamp: Date.now(),
                userId: '123',
                serverId: '456',
                username: 'User',
                leftAt: Date.now(),
                reason: 'banned',
            };

            const result = MemberLeaveEventSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.reason).toBe('banned');
            }
        });

        it('fails when serverId is missing', () => {
            const invalidData = {
                type: 'MEMBER_LEAVE',
                timestamp: Date.now(),
                userId: '123',
                // serverId missing
                username: 'User',
                leftAt: Date.now(),
            };

            const result = MemberLeaveEventSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('PresenceUpdateEventSchema', () => {
        it('validates a full presence update event', () => {
            const validData = {
                type: 'PRESENCE_UPDATE',
                timestamp: Date.now(),
                occurredAt: Date.now(),
                userId: 'user-1',
                serverId: 'guild-1',
                oldStatus: 'offline',
                newStatus: 'online',
                oldClientStatus: { web: 'offline' },
                newClientStatus: { desktop: 'online' },
                oldActivityNames: ['Before'],
                newActivityNames: ['After'],
                oldActivityTypes: [0],
                newActivityTypes: [2],
            };

            const result = PresenceUpdateEventSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('validates a sparse presence update event with optional old fields', () => {
            const validData = {
                type: 'PRESENCE_UPDATE',
                timestamp: Date.now(),
                occurredAt: Date.now(),
                userId: 'user-1',
                serverId: 'guild-1',
                newStatus: 'idle',
                newClientStatus: {},
                newActivityNames: [],
                newActivityTypes: [],
            };

            const result = PresenceUpdateEventSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('GuildAvailableEventSchema', () => {
        it('validates a valid guild available event', () => {
            const validData = {
                type: 'GUILD_AVAILABLE',
                timestamp: Date.now(),
                serverId: 'guild-123',
                guildName: 'AccordJS Guild',
                memberCount: 42,
            };

            const result = GuildAvailableEventSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('GuildUnavailableEventSchema', () => {
        it('validates a valid guild unavailable event', () => {
            const validData = {
                type: 'GUILD_UNAVAILABLE',
                timestamp: Date.now(),
                serverId: 'guild-123',
                guildName: 'AccordJS Guild',
                memberCount: 42,
                unavailable: true,
            };

            const result = GuildUnavailableEventSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('BotEventSchema (Discriminated Union)', () => {
        it('correctly narrows and validates a message create event', () => {
            const data = {
                type: 'MESSAGE_CREATE',
                timestamp: Date.now(),
                messageId: '123',
                channelId: '456',
                userId: '789',
                content: 'Hello World',
                authorName: 'User',
                authorTag: 'User#0001',
                isBot: false,
            };

            const result = BotEventSchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.type).toBe('MESSAGE_CREATE');
                // Narrowing should work in TS due to z.infer
                if (result.data.type === 'MESSAGE_CREATE') {
                    expect(result.data.content).toBe('Hello World');
                }
            }
        });

        it('correctly validates a member leave event', () => {
            const data = {
                type: 'MEMBER_LEAVE',
                timestamp: Date.now(),
                userId: '123',
                serverId: '456',
                username: 'User',
                leftAt: Date.now(),
            };

            const result = BotEventSchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.type).toBe('MEMBER_LEAVE');
                // Narrowing should work in TS due to z.infer
                if (result.data.type === 'MEMBER_LEAVE') {
                    expect(result.data.username).toBe('User');
                }
            }
        });

        it('correctly validates a message delete event', () => {
            const data = {
                type: 'MESSAGE_DELETE',
                timestamp: Date.now(),
                messageId: '123',
                channelId: '456',
                userId: '789',
                authorId: '789',
                deletedAt: Date.now(),
            };

            const result = BotEventSchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.type).toBe('MESSAGE_DELETE');
                // Narrowing should work in TS due to z.infer
                if (result.data.type === 'MESSAGE_DELETE') {
                    expect(result.data.messageId).toBe('123');
                }
            }
        });

        it('correctly validates a message update event', () => {
            const data = {
                type: 'MESSAGE_UPDATE',
                timestamp: Date.now(),
                messageId: '123',
                channelId: '456',
                content: 'Updated content',
            };

            const result = BotEventSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('correctly validates a guild available event', () => {
            const data = {
                type: 'GUILD_AVAILABLE',
                timestamp: Date.now(),
                serverId: 'guild-123',
                guildName: 'AccordJS Guild',
                memberCount: 42,
            };

            const result = BotEventSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('correctly validates a presence update event', () => {
            const data = {
                type: 'PRESENCE_UPDATE',
                timestamp: Date.now(),
                occurredAt: Date.now(),
                userId: 'user-1',
                serverId: 'guild-1',
                newStatus: 'online',
                newClientStatus: { desktop: 'online' },
                newActivityNames: ['After'],
                newActivityTypes: [0],
            };

            const result = BotEventSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('fails on unknown event type in union', () => {
            const data = {
                type: 'INVALID_EVENT_TYPE', // Not in EventType enum at all
                timestamp: Date.now(),
            };

            const result = BotEventSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });
});
