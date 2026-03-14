import { describe, expect, it } from 'bun:test';
import { BotEventSchema, MemberJoinEventSchema, MessageCreateEventSchema } from '../../src/types/index.ts';

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

        it('fails on unknown event type in union', () => {
            const data = {
                type: 'MEMBER_LEAVE', // Known in EventType but not yet in BotEventSchema union
                timestamp: Date.now(),
            };

            const result = BotEventSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });
});
