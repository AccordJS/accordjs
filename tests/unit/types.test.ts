import { describe, expect, it } from 'bun:test';
import {
    BotEventSchema,
    MemberJoinEventSchema,
    MemberLeaveEventSchema,
    MessageCreateEventSchema,
    MessageDeleteEventSchema,
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
